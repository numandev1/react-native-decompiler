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

import * as t from '@babel/types';
import { NodePath, Visitor } from '@babel/traverse';
import { Plugin } from '../../../plugin';
import ArrayMap from '../../../util/arrayMap';

/**
 * Evaluates Babel class structures
 */
export default class BabelClassEvaluator extends Plugin {
  readonly pass = 3;
  private classCreateName?: string;
  private classCreatePath?: NodePath<t.VariableDeclarator>;
  private callExpressions: ArrayMap<string, NodePath<t.CallExpression>> = new ArrayMap();
  private assignmentExpressions: ArrayMap<string, NodePath<t.AssignmentExpression>> = new ArrayMap();

  getVisitor(): Visitor {
    return {
      VariableDeclarator: (path) => {
        if (!t.isIdentifier(path.node.id)) return;
        if (this.variableIsForDependency(path, '@babel/runtime/helpers/createClass')) {
          this.classCreateName = path.node.id.name;
          path.remove();
        }
      },
      ImportDeclaration: (path) => {
        if (!t.isImportDefaultSpecifier(path.node.specifiers[0]) || !t.isIdentifier(path.node.specifiers[0].local)) return;
        if (this.variableIsForDependency(path, '@babel/runtime/helpers/createClass')) {
          this.classCreateName = path.node.specifiers[0].local.name;
          path.remove();
        }
      },
      CallExpression: (path) => {
        if (!t.isIdentifier(path.node.callee) || path.node.arguments.length > 2) return;

        this.callExpressions.push(path.node.callee.name, path);
      },
      AssignmentExpression: (path) => {
        if (!t.isBlockStatement(path.parentPath.parent) || !t.isMemberExpression(path.node.left) || !t.isIdentifier(path.node.left.object)) return;

        this.assignmentExpressions.push(path.node.left.object.name, path);
      },
    };
  }

  afterPass(): void {
    if (!this.classCreateName || !this.callExpressions.has(this.classCreateName)) return;

    this.callExpressions.forEachElement(this.classCreateName, (path) => {
      if (path.removed) return;

      const varDeclar = path.find((e) => e.isVariableDeclarator());
      if (!varDeclar?.isVariableDeclarator() || !t.isIdentifier(varDeclar.node.id) || !t.isVariableDeclaration(varDeclar.parent)) return;
      const className = varDeclar.node.id.name;

      const parentBody = path.find((e) => e.isBlockStatement());
      if (!parentBody?.isBlockStatement()) return;

      const extendsId = parentBody.get('body').map((line) => {
        if (!line.isExpressionStatement() || !t.isCallExpression(line.node.expression)) return null;
        const exp = line.node.expression;
        if (!t.isFunctionExpression(exp.callee) || !t.isIdentifier(exp.arguments[0]) || !t.isExpression(exp.arguments[1])) return null;

        let hasSuperExpression = false;

        line.traverse({
          StringLiteral: (p) => {
            if (p.node.value.includes('Super expression must either be null or a function')) {
              hasSuperExpression = true;
            }
          },
        });

        return hasSuperExpression ? exp.arguments[1] : null;
      }).find((line) => line != null);

      const methods = [];

      const constructor = this.createConstructor(path);
      if (constructor) {
        methods.push(constructor);
      }

      methods.push(...this.createStatic(className, varDeclar.scope.bindings[className].identifier));
      methods.push(...this.createMethods(path));

      if (varDeclar.parent.declarations.length === 1) {
        varDeclar.parentPath.replaceWith(t.classDeclaration(t.identifier(className), extendsId, t.classBody(methods)));
      } else {
        varDeclar.parentPath.insertAfter(t.classDeclaration(t.identifier(className), extendsId, t.classBody(methods)));
        varDeclar.remove();
      }
    });

    this.classCreatePath?.remove();
  }

  private createConstructor(path: NodePath<t.CallExpression>): t.ClassMethod | null {
    const firstParam = path.get('arguments')[0];
    if (!firstParam?.isIdentifier()) return null;

    const constructorFunction = firstParam.scope.getBinding(firstParam.node.name)?.path;
    if (!constructorFunction?.isFunctionDeclaration()) return null;

    if (constructorFunction.node.body.body.length === 0) return null;

    return t.classMethod('constructor', t.identifier('constructor'), constructorFunction.node.params, constructorFunction.node.body);
  }

  private createStatic(varName: string, bindingIdentifier: t.Identifier): (t.ClassProperty | t.ClassMethod)[] {
    const methods: (t.ClassProperty | t.ClassMethod)[] = [];

    this.assignmentExpressions.forEachElement(varName, (path) => {
      if (path.removed || !path.scope.bindingIdentifierEquals(varName, bindingIdentifier)) return;
      if (!t.isMemberExpression(path.node.left) || !t.isIdentifier(path.node.left.property)) return;

      if (t.isFunctionExpression(path.node.right)) {
        methods.push(t.classMethod('method', t.identifier(path.node.left.property.name), path.node.right.params, path.node.right.body, undefined, true));
        path.remove();
      } else {
        // methods.push(t.classProperty(path.node.left.property, path.node.right, undefined, undefined, undefined, true));
      }
    });
    return methods;
  }

  private createMethods(path: NodePath<t.CallExpression>): t.ClassMethod[] {
    const secondParam = path.get('arguments')[1];
    if (!secondParam?.isArrayExpression()) return [];

    const methods: t.ClassMethod[] = [];
    secondParam.node.elements.forEach((e) => {
      if (!t.isObjectExpression(e) || !t.isObjectProperty(e.properties[0]) || !t.isObjectProperty(e.properties[1])) return;
      if (!t.isIdentifier(e.properties[0].key) || !t.isStringLiteral(e.properties[0].value) || !t.isFunctionExpression(e.properties[1].value)) return;

      methods.push(t.classMethod('method', t.identifier(e.properties[0].value.value), e.properties[1].value.params, e.properties[1].value.body));
    });

    return methods;
  }
}
