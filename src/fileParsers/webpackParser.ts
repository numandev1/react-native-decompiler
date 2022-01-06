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

import traverse, { NodePath } from '@babel/traverse';
import {
  isNumericLiteral, isFunctionExpression, isIdentifier, File, isMemberExpression, isAssignmentExpression, ArrayExpression, ObjectExpression, isStringLiteral,
} from '@babel/types';
import ParamMappings from '../interfaces/paramMappings';
import Module from '../module';
import PerformanceTracker from '../util/performanceTracker';

export default class WebpackParser extends PerformanceTracker {
  private readonly PARAM_MAPPING: ParamMappings = {
    module: 0,
    exports: 1,
    require: 2,
  };

  protected fileIsWebpackEntry = (file: string): boolean => file.includes('window.webpackHotUpdate') || (file.includes('"Loading chunk "') && file.includes('"ChunkLoadError"'));

  protected parseAst(ast: File, modules: Module[]): void {
    traverse(ast, {
      CallExpression: (nodePath) => {
        const firstArg = nodePath.get('arguments')[0];
        if (isFunctionExpression(nodePath.node.callee) && firstArg?.isArrayExpression()) { // entrypoint
          this.parseArray(ast, firstArg, modules);
        } else if (isMemberExpression(nodePath.node.callee) && isAssignmentExpression(nodePath.node.callee.object) && firstArg?.isArrayExpression()) { // chunked
          const assignment = nodePath.node.callee.object;
          if (isMemberExpression(assignment.left)) {
            let leftPropName = '';
            if (isIdentifier(assignment.left.property)) {
              leftPropName = assignment.left.property.name;
            } else if (isStringLiteral(assignment.left.property)) {
              leftPropName = assignment.left.property.value;
            }
            if (leftPropName.startsWith('webpackJsonp')) {
              const modulesObject = firstArg.get('elements')[1];
              if (modulesObject.isArrayExpression()) {
                this.parseArray(ast, modulesObject, modules);
              } else {
                if (!modulesObject || !modulesObject.isObjectExpression()) throw new Error('Failed assertion');
                this.parseObject(ast, modulesObject, modules);
              }
            }
          }
        }
        nodePath.skip();
      },
    });
  }

  private parseArray(file: File, ast: NodePath<ArrayExpression>, modules: Module[]): void {
    ast.get('elements').forEach((element, i) => {
      if (!element.isFunctionExpression()) return;
      if (element.node.body.body.length === 0) return;

      const dependencyValues: number[] = [];
      const requireIdentifer = element.node.params[2];
      if (isIdentifier(requireIdentifer)) {
        element.traverse({
          CallExpression: (dependencyPath) => {
            if (!isIdentifier(dependencyPath.node.callee) || !isNumericLiteral(dependencyPath.node.arguments[0])) return;
            if (dependencyPath.scope.bindingIdentifierEquals(dependencyPath.node.callee.name, requireIdentifer)) {
              dependencyValues[dependencyPath.node.arguments[0].value] = dependencyPath.node.arguments[0].value;
            }
          },
        });
      }

      const newModule = new Module(file, element, i, dependencyValues, this.PARAM_MAPPING);
      newModule.calculateFields();
      modules[i] = newModule;
    });
  }

  private parseObject(file: File, ast: NodePath<ObjectExpression>, modules: Module[]): void {
    ast.get('properties').forEach((property) => {
      if (!property.isObjectProperty() || !isNumericLiteral(property.node.key)) return;

      const element = property.get('value');
      const i = property.node.key.value;
      if (!element.isFunctionExpression()) return;
      if (element.node.body.body.length === 0) return;

      const dependencyValues: number[] = [];
      const requireIdentifer = element.node.params[2];
      if (isIdentifier(requireIdentifer)) {
        element.traverse({
          CallExpression: (dependencyPath) => {
            if (!isIdentifier(dependencyPath.node.callee) || !isNumericLiteral(dependencyPath.node.arguments[0])) return;
            if (dependencyPath.scope.bindingIdentifierEquals(dependencyPath.node.callee.name, requireIdentifer)) {
              dependencyValues[dependencyPath.node.arguments[0].value] = dependencyPath.node.arguments[0].value;
            }
          },
        });
      }

      const newModule = new Module(file, element, i, dependencyValues, this.PARAM_MAPPING);
      newModule.calculateFields();
      modules[i] = newModule;
    });
  }
}
