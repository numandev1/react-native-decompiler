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
 * Simple searcher of NPM modules through string matching
 */
export default class SimpleModuleFinder extends ModuleFinder {
  name = 'SimpleModuleFinder';

  private readonly commentMappings: Record<string, string[]> = {
    react: ['react.production.min.js'],
    'react-dom': ['react-dom.production.min.js'],
    classnames: ['http://jedwatson.github.io/classnames'],
    'safe-buffer': ['safe-buffer. MIT License. Feross Aboukhadijeh'],
    buffer: ['The buffer module from node.js, for the browser.'],
  };

  private readonly stringMappings: Record<string, string[]> = {
    'react-dom': ['suspended while rendering, but no fallback UI was specified'],
    react: ['https://reactjs.org/docs/error-decoder.html?invariant='],
    'react-native-web': ['Text strings must be rendered within a <Text> component.'],
    'base64-js': ['Invalid string. Length must be a multiple of 4'],
    'redux-react-hook': ['redux-react-hook requires your Redux store to be passed through context via the <StoreContext.Provider>'],
    'pusher-js': ['You must pass your app key when you instantiate Pusher.'],
    'regenerator-runtime': ['try statement without catch or finally'],
    '@sentry/browser': ['addGlobalEventProcessor', 'getHubFromCarrier'],
    'react-native': ['progress-bar-android-moved'],
    'url-parse': ['^[\\x09\\x0A\\x0B\\x0C\\x0D\\x20\\xA0\\u1680\\u180E\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u202F\\u205F\\u3000\\u2028\\u2029\\uFEFF]+'],
    'crypto-browserify': ['https://github.com/crypto-browserify/crypto-browserify'],
    'style-loader': ['https://github.com/webpack-contrib/style-loader#insertat'],
    'prop-types': ['Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types'],
    'crypto-js': ['Native crypto module could not be used to get secure random number.'],
    'react-i18next': ['pass in an i18next instance by using initReactI18next'],
    i18next: ['accessing an object - but returnObjects options is not enabled!'],
  };

  private readonly codeRegexMappings: Record<string, RegExp[]> = {
    jsonwebtoken: [/verify:.\(/, /sign:.\(/, /JsonWebTokenError:.\(/, /NotBeforeError:.\(/, /TokenExpiredError:.\(/],
    'asn1.js': [/.\.bignum=.\(/, /.\.define=.\(/, /.\.base=.\(/, /.\.constants=.\(/, /.\.decoders=.\(/, /.\.encoders=.\(/],
    elliptic: [/.\.base=.\(/, /.\.mont=.\(/, /.\.short=.\(/, /.\.edwards=.\(/],
    'crypto-js/aes': [/encryptBlock:function\(.,.\){this\._doCryptBlock\(.,.,this\._keySchedule,.,.,.,.,.\);?}/],
    'lz-string': [/compressToEncodedURIComponent:function\(.\){return null==.\?"":.\._compress\(.,6,function\(.\){return .\.charAt\(.\);?}\);?}/],
  };

  private readonly moduleVarNames: Record<string, string> = {
    react: 'React',
    'react-dom': 'ReactDOM',
    'base64-js': 'base64js',
    'pusher-js': 'Pusher',
    'regenerator-runtime': 'regeneratorRuntime',
    '@sentry/browser': 'Sentry',
    'react-native': 'ReactNative',
    'url-parse': 'Url',
    classnames: 'classnames',
    'safe-buffer': 'Buffer',
    buffer: 'Buffer',
    'crypto-browserify': 'crypto',
    'prop-types': 'PropTypes',
    'crypto-js': 'CryptoJS',
    'crypto-js/aes': 'AES',
    jsonwebtoken: 'jwt',
    i18next: 'i18next',
    asn: 'asn',
    'lz-string': 'LZString',
  };

  evaluate(): void {
    const commentMappingMatch = Object.keys(this.commentMappings).find((key) => this.test(this.module.moduleComments, this.commentMappings[key]));
    if (commentMappingMatch) {
      this.debugLog(`${this.module.moduleId} matched module ${commentMappingMatch} via comment`);
      this.tagAsNpmModule(commentMappingMatch, this.moduleVarNames[commentMappingMatch]);
      return;
    }

    const stringMappingMatch = Object.keys(this.stringMappings).find((key) => this.test(this.module.moduleStrings, this.stringMappings[key]));
    if (stringMappingMatch) {
      this.debugLog(`${this.module.moduleId} matched module ${stringMappingMatch} via string`);
      this.tagAsNpmModule(stringMappingMatch, this.moduleVarNames[stringMappingMatch]);
    }

    const codeRegexMatch = Object.keys(this.codeRegexMappings).find((key) => this.regexTest(this.module.originalCode, this.codeRegexMappings[key]));
    if (codeRegexMatch) {
      this.debugLog(`${this.module.moduleId} matched module ${codeRegexMatch} via code regex`);
      this.tagAsNpmModule(codeRegexMatch, this.moduleVarNames[codeRegexMatch]);
    }
  }

  private test(moduleStrings: string[], stringsToFind: string[]): boolean {
    return stringsToFind.every((stringToFind) => moduleStrings.some((moduleString) => moduleString.includes(stringToFind)));
  }

  private regexTest(originalCode: string, regexes: RegExp[]): boolean {
    return regexes.every((regex) => regex.test(originalCode));
  }
}
