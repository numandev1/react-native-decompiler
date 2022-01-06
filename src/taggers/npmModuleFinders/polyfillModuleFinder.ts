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

/* eslint-disable max-len */
import ModuleFinder from './moduleFinder';

/**
 * Simple searcher of polyfills
 */
export default class PolyfillModuleFinder extends ModuleFinder {
  name = 'PolyfillModuleFinder';

  private readonly commentMappings: Record<string, string[]> = {
  };

  private readonly stringMappings: Record<string, string[]> = {
  };

  private readonly codeRegexMappings: Record<string, RegExp[]> = {
    ResizeObserver: [/var .=void 0!==.\.ResizeObserver\?.\.ResizeObserver:.;.\.default=./],
  };

  evaluate(): void {
    const commentMappingMatch = Object.keys(this.commentMappings).find((key) => this.test(this.module.moduleComments, this.commentMappings[key]));
    if (commentMappingMatch) {
      this.debugLog(`${this.module.moduleId} matched module ${commentMappingMatch} via comment`);
      this.tagAsNpmModule(commentMappingMatch, commentMappingMatch);
      this.module.isPolyfill = true;
      return;
    }

    const stringMappingMatch = Object.keys(this.stringMappings).find((key) => this.test(this.module.moduleStrings, this.stringMappings[key]));
    if (stringMappingMatch) {
      this.debugLog(`${this.module.moduleId} matched module ${stringMappingMatch} via string`);
      this.tagAsNpmModule(stringMappingMatch, stringMappingMatch);
      this.module.isPolyfill = true;
      return;
    }

    const codeRegexMatch = Object.keys(this.codeRegexMappings).find((key) => this.regexTest(this.module.originalCode, this.codeRegexMappings[key]));
    if (codeRegexMatch) {
      this.debugLog(`${this.module.moduleId} matched module ${codeRegexMatch} via code regex`);
      this.tagAsNpmModule(codeRegexMatch, codeRegexMatch);
      this.module.isPolyfill = true;
    }
  }

  private test(moduleStrings: string[], stringsToFind: string[]): boolean {
    return stringsToFind.every((stringToFind) => moduleStrings.some((moduleString) => moduleString.includes(stringToFind)));
  }

  private regexTest(originalCode: string, regexes: RegExp[]): boolean {
    return regexes.every((regex) => regex.test(originalCode));
  }
}
