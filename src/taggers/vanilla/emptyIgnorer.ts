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
 * Ignores empty files
 */
export default class EmptyIgnorer extends Plugin {
  readonly pass = 1;
  name = 'EmptyIgnorer';

  evaluate(): void {
    if (this.module.rootPath.node.body.body.length === 0) {
      this.debugLog(`Ignored ${this.module.moduleId} because it is empty`);
      this.module.ignored = true;
    }
  }
}
