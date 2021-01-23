

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
