/**
  React Native Decompiler
  Copyright (C) 2020-2022 Richard Fu, Numan and contributors
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.
  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { NodePath, Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Converts inlines to requires for decompilers
 */
export default class BabelInlineConverters extends Plugin {
  readonly pass = 2;
  name = 'BabelInlineConverters';

  private interopRequireName?: string;
  private createClassName?: string;

  getVisitor(): Visitor {
    return {
      FunctionDeclaration: (nodePath) => {
        this.interopRequireDefaultFunction(nodePath);
      },
      CallExpression: (nodePath) => {
        this.createClassFunctionInline(nodePath);
        this.classCallCheckInline(nodePath);
        this.assertThisInitalizedInline(nodePath);
      },
      VariableDeclarator: (nodePath) => {
        this.interopRequireDefaultVarInline(nodePath);
        this.slicedToArrayFunction(nodePath);
      },
    };
  }

  private generateRequireDeclaration(name: t.Identifier, requireModule: string): t.VariableDeclaration {
    return t.variableDeclaration('const', [
      t.variableDeclarator(name, t.callExpression(t.identifier('require'), [t.stringLiteral(requireModule)])),
    ]);
  }

  private generateRequireDeclarator(name: t.Identifier, requireModule: string): t.VariableDeclarator {
    return t.variableDeclarator(name, t.callExpression(t.identifier('require'), [t.stringLiteral(requireModule)]));
  }

  private interopRequireDefaultFunction(path: NodePath<t.FunctionDeclaration>) {
    const body = path.node.body.body;
    if (path.node.params.length !== 1 || body.length !== 1 || !t.isIdentifier(path.node.id) || !t.isReturnStatement(body[0])) return;
    if (!t.isConditionalExpression(body[0].argument) || !t.isLogicalExpression(body[0].argument.test)) return;
    if (!t.isIdentifier(body[0].argument.test.left) || body[0].argument.test.operator !== '&&' || !t.isMemberExpression(body[0].argument.test.right)) return;
    const esModuleExpression = body[0].argument.test.right;
    if (!t.isIdentifier(esModuleExpression.object) || !t.isIdentifier(esModuleExpression.property) || body[0].argument.test.left.name !== esModuleExpression.object.name) return;
    if (esModuleExpression.property.name !== '__esModule') return;

    this.debugLog('removed inline babel interopRequireDefault function:');
    this.debugLog(this.debugPathToCode(path));

    if (this.interopRequireName) {
      path.scope.rename(path.node.id.name, this.interopRequireName);
      path.remove();
    } else {
      this.interopRequireName = path.node.id.name;
      path.replaceWith(this.generateRequireDeclaration(path.node.id, '@babel/runtime/helpers/interopRequireDefault'));
    }
    this.addTag('babel-interop');
  }

  private interopRequireDefaultVarInline(path: NodePath<t.VariableDeclarator>) {
    const node = path.node;
    const init = node.init;
    if (!t.isIdentifier(node.id)) return;
    if (!t.isConditionalExpression(init) || !t.isLogicalExpression(init.test) || !t.isIdentifier(init.consequent) || !t.isObjectExpression(init.alternate)) return;
    const test = init.test;
    if (!t.isAssignmentExpression(test.left) || !t.isIdentifier(test.left.left) || !t.isIdentifier(test.left.right)) return;
    if (!t.isMemberExpression(test.right) || !t.isIdentifier(test.right.object) || !t.isIdentifier(test.right.property)) return;
    if (test.left.left.name !== test.right.object.name || test.right.property.name !== '__esModule') return;

    const moduleSource = path.scope.getBinding(test.left.right.name);
    if (!moduleSource) return;
    const moduleSourcePath = moduleSource.path.find((p) => p.isVariableDeclarator());
    if (moduleSourcePath == null || !moduleSourcePath.isVariableDeclarator() || !t.isIdentifier(moduleSourcePath.node.id)) return;

    this.debugLog('removed inline babel interopRequireDefault inline:');
    this.debugLog(this.debugPathToCode(path));

    this.mergeBindings(path, node.id.name, moduleSourcePath.node.id.name);

    path.scope.bindings[test.left.left.name].path.remove();
  }

  private createClassFunctionInline(path: NodePath<t.CallExpression>) {
    if (!t.isFunctionExpression(path.node.callee)) return;
    const body = path.node.callee.body.body;
    const lastLine = body[body.length - 1];
    if (!t.isReturnStatement(lastLine) || !t.isFunctionExpression(lastLine.argument)) return;
    const returnBody = lastLine.argument.body.body;
    if (!t.isExpressionStatement(returnBody[0]) || !t.isExpressionStatement(returnBody[1]) || !t.isReturnStatement(returnBody[2])) return;
    if (!t.isLogicalExpression(returnBody[0].expression) || !t.isIdentifier(returnBody[0].expression.left) || !t.isCallExpression(returnBody[0].expression.right)) return;
    const testArgs = returnBody[0].expression.right.arguments;
    if (!t.isMemberExpression(testArgs[0]) || !t.isIdentifier(testArgs[1]) || !t.isIdentifier(testArgs[0].property) || testArgs[0].property.name !== 'prototype') return;

    this.debugLog('removed inline babel createClass function:');
    this.debugLog(this.debugPathToCode(path));

    const varDeclar = path.find((e) => e.isVariableDeclarator());
    if (varDeclar == null || !varDeclar.isVariableDeclarator() || !t.isIdentifier(varDeclar.node.id)) return;

    if (this.createClassName) {
      path.scope.rename(varDeclar.node.id.name, this.createClassName);
      path.remove();
    } else {
      this.createClassName = varDeclar.node.id.name;
      varDeclar.replaceWith(this.generateRequireDeclarator(varDeclar.node.id, '@babel/runtime/helpers/createClass'));
    }
    this.addTag('babel-createClass');
  }

  private classCallCheckInline(path: NodePath<t.CallExpression>) {
    if (!t.isFunctionExpression(path.node.callee) || path.node.arguments.length !== 2) return;
    if (!t.isThisExpression(path.node.arguments[0]) || !t.isIdentifier(path.node.arguments[1])) return;

    let hasErrorString = false;
    path.traverse({
      StringLiteral: (stringPath) => {
        if (stringPath.node.value === 'Cannot call a class as a function') {
          hasErrorString = true;
        }
      },
    });
    if (!hasErrorString) return;

    const parent = path.find((p) => p.isExpressionStatement());
    if (!parent) return;

    this.debugLog('removed inline babel classCallCheck function:');
    this.debugLog(this.debugPathToCode(path));

    parent.remove();
  }

  private assertThisInitalizedInline(path: NodePath<t.CallExpression>) {
    if (!t.isFunctionExpression(path.node.callee) || path.node.arguments.length !== 2) return;
    if (!t.isThisExpression(path.node.arguments[0]) || !t.isCallExpression(path.node.arguments[1])) return;

    let hasErrorString = false;
    path.traverse({
      StringLiteral: (stringPath) => {
        if (stringPath.node.value === 'this hasn\'t been initialised - super() hasn\'t been called') {
          hasErrorString = true;
        }
      },
    });
    if (!hasErrorString) return;

    const parent = t.isReturnStatement(path.parent) ? path.parentPath : path.find((p) => p.isExpressionStatement());
    if (!parent) return;

    this.debugLog('removed inline babel assertThisInitalized function:');
    this.debugLog(this.debugPathToCode(path));

    parent.remove();
  }

  private slicedToArrayFunction(path: NodePath<t.VariableDeclarator>) {
    if (path.removed || !t.isCallExpression(path.node.init) || path.node.init.arguments.length !== 0) return;

    let hasErrorString = false;
    path.traverse({
      StringLiteral: (stringPath) => {
        if (stringPath.node.value === 'Invalid attempt to destructure non-iterable instance') {
          hasErrorString = true;
        }
      },
    });
    if (!hasErrorString) return;

    this.debugLog('replace var incline babel slicedToArray function:');
    this.debugLog(this.debugPathToCode(path));

    path.get('init').replaceWith(t.callExpression(t.identifier('require'), [t.stringLiteral('@babel/runtime/helpers/slicedToArray')]));
  }
}
