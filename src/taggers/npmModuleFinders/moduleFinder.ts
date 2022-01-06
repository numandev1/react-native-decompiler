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

import { NodePath } from '@babel/traverse';
import { FunctionExpression } from '@babel/types';
import { Plugin } from '../../plugin';

export default abstract class ModuleFinder extends Plugin {
  readonly pass = 1;

  protected tagAsNpmModule(moduleName: string, varName?: string): void {
    if (this.module.isNpmModule && this.module.moduleName !== moduleName) {
      throw new Error(`Module #${this.module.moduleId} is already the ${this.module.moduleName} module but tried to re-tag as ${moduleName}`);
    }

    this.module.isNpmModule = true;
    this.module.ignored = true;
    this.module.moduleName = moduleName;
    this.module.npmModuleVarName = varName;
  }

  abstract evaluate(path: NodePath<FunctionExpression>): void;
}
