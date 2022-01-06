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
import { Visitor, NodePath } from '@babel/traverse';
import {
  CallExpression,
  isIdentifier,
  isCallExpression,
  isVariableDeclarator,
  VariableDeclarator,
} from '@babel/types';
import { Plugin } from '../../../plugin';
import Module from '../../../module';
import ArrayMap from '../../../util/arrayMap';
import CmdArgs from '../../../interfaces/cmdArgs';

/**
 * Cleans up `@babel/runtime/helpers/toConsumableArray` usage
 */
export default class ToConsumableArrayCleaner extends Plugin {
  readonly pass = 3;

  private moduleUsed: boolean;
  private moduleVarPath?: NodePath<VariableDeclarator>;
  private moduleBindingLocation?: number;
  private callExpressions: ArrayMap<number, NodePath<CallExpression>> = new ArrayMap();

  constructor(args: CmdArgs, module: Module, moduleList: Module[]) {
    super(args, module, moduleList);

    const destructureDependency = moduleList.find((mod) => mod?.moduleName === '@babel/runtime/helpers/toConsumableArray');
    this.moduleUsed = destructureDependency?.moduleId != null && module.dependencies.includes(destructureDependency?.moduleId);
  }

  getVisitor(): Visitor {
    if (!this.moduleUsed) return {};

    return {
      CallExpression: (path) => {
        if (!isIdentifier(path.node.callee)) return;

        const bindingLocation = path.scope.getBindingIdentifier(path.node.callee.name)?.start;
        if (bindingLocation == null) return;

        this.callExpressions.push(bindingLocation, path);
      },
      VariableDeclarator: (path) => {
        if (this.moduleVarPath || !isIdentifier(path.node.id) || !isCallExpression(path.node.init)) return;

        const init = path.get('init');
        if (!init.isCallExpression()) return;
        const moduleDependency = this.getModuleDependency(init);
        if (moduleDependency?.moduleName !== '@babel/runtime/helpers/toConsumableArray') return;

        this.moduleVarPath = path;
        this.moduleBindingLocation = path.scope.getBindingIdentifier(path.node.id.name)?.start ?? undefined;
      },
    };
  }

  afterPass(): void {
    if (this.moduleBindingLocation != null && this.moduleVarPath) {
      if (!this.moduleVarPath.removed) {
        this.moduleVarPath.remove();
      }

      this.callExpressions.forEachElement(this.moduleBindingLocation, (exp) => {
        if (isVariableDeclarator(exp.parent) && isIdentifier(exp.parent.id) && isIdentifier(exp.node.arguments[0])) {
          exp.scope.rename(exp.parent.id.name, exp.node.arguments[0].name);
          if (!exp.parentPath.removed) {
            exp.parentPath.remove();
          }
        } else {
          exp.replaceWith(exp.node.arguments[0]);
        }
      });
    }
  }
}
