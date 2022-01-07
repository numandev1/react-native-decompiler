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

import { Visitor } from '@babel/traverse';
import {
  isCallExpression,
  isIdentifier,
} from '@babel/types';
import { Plugin } from '../../plugin';
import Module from '../../module';
import CmdArgs from '../../interfaces/cmdArgs';

/**
 * Evaluates babel default interops
 */
export default class DefaultInteropEvaluator extends Plugin {
  readonly pass = 1;

  getVisitor(): Visitor {
    return {
      VariableDeclarator: (path) => {
        if (!isIdentifier(path.node.id)) return;
        if (this.variableIsForDependency(path, ['@babel/runtime/helpers/interopRequireDefault', '@babel/runtime/helpers/interopRequireWildcard'])) {
          const interopVarName = path.node.id.name;
          this.bindingTraverse(path.scope.bindings[interopVarName], interopVarName, {
            CallExpression: (bindingPath) => {
              if (!isIdentifier(bindingPath.node.callee) || bindingPath.node.callee.name !== interopVarName) return;
              if (isCallExpression(bindingPath.node.arguments[0])) {
                bindingPath.replaceWith(bindingPath.node.arguments[0]);
              } else if (isIdentifier(bindingPath.node.arguments[0])) {
                const parent = bindingPath.find((p) => p.isVariableDeclarator());
                if (!parent?.isVariableDeclarator() || !isIdentifier(parent.node.id)) throw new Error('Failed assertion');
                this.mergeBindings(parent, parent.node.id.name, bindingPath.node.arguments[0].name);
              }
            },
          });
          path.remove();
        }
      },
    };
  }
}
