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

import { Plugin } from '../../plugin';

/**
 * Finds CSS files loaded by css-loader & style-loader
 */
export default class CssFinder extends Plugin {
  readonly pass = 2;
  name = 'CssFinder';

  evaluate(): void {
    if (this.module.dependencies.filter((e) => e != null).length !== 2) return;

    const styleLoaderDep = this.module.dependencies.find((dep) => this.moduleList[dep] && this.moduleList[dep].moduleName === 'style-loader');
    if (styleLoaderDep == null) return;

    const cssDep = this.module.dependencies.find((dep) => dep != null && dep !== styleLoaderDep);
    if (cssDep == null) return;

    this.module.isStatic = true;
    this.module.ignored = true;
    this.module.staticContent = this.moduleList[cssDep].moduleStrings[0];
    this.module.tags.push('css');

    this.moduleList[cssDep].ignored = true;
  }
}
