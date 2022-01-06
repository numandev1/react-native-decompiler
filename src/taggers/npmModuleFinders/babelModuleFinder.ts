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
import ModuleFinder from './moduleFinder';

/**
 * Finds babel modules
 */
export default class BabelModuleFinder extends ModuleFinder {
  private readonly moduleMap: Record<string, (RegExp | string)[]> = {
    '@babel/runtime/helpers/classCallCheck': [
      // 'Cannot call a class as a function',
    ],
    '@babel/runtime/helpers/toConsumableArray': [
      /{var .=.\(.\[0]\),.=.\(.\[1]\),.=.\(.\[2]\),.=.\(.\[3]\);.\.exports=function\(.\){return .\(.\)\|\|.\(.\)\|\|.\(.\)\|\|.\(\);};}/,
    ],
    '@babel/runtime/helpers/slicedToArray': [
      /{var .=.\(.\[0]\),.=.\(.\[1]\),.=.\(.\[2]\),.=.\(.\[3]\);.\.exports=function\(.,.\){return .\(.\)\|\|.\(.,.\)\|\|.\(.,.\)\|\|.\(\);};}/,
    ],
    '@babel/runtime/helpers/interopRequireDefault': [
      /.\.exports=function\(.\){return .&&.\.__esModule\?.:{default:.}/,
      /.\.exports=function\(obj\){return obj&&obj\.__esModule\?obj:{default:obj}/,
    ],
    '@babel/runtime/helpers/interopRequireWildcard': [
      /function .\(\){if\("function"!=typeof WeakMap\)return null;var .=new WeakMap\(\);return .=function\(\){return .;},.;}/,
    ],
    '@babel/runtime/helpers/createClass': [
      /.\.exports=function\(.,.,.\){return .&&.\(.\.prototype,.\),.&&.\(.,.\),.;};/,
    ],
    '@babel/runtime/helpers/defineEnumerableProperties': [
      /.\.exports=function\(.,.\){if\(null==.\)return{};var .,.,.=.\(.,.\);if\(Object\.getOwnPropertySymbols\){var .=Object\.getOwnPropertySymbols\(.\);/,
    ],
  };

  evaluate(): void {
    Object.keys(this.moduleMap).forEach((moduleName) => {
      const matchers = this.moduleMap[moduleName];
      if (matchers.some((matcher) => (matcher instanceof RegExp ? matcher.test(this.module.originalCode) : this.module.moduleStrings.includes(matcher)))) {
        this.tagAsNpmModule(moduleName);
      }
    });
  }
}
