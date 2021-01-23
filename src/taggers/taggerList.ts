

import PassthroughModuleRemapper from './remappers/passthroughModuleRemapper';
import SimpleModuleFinder from './npmModuleFinders/simpleModuleFinder';
import BabelModuleFinder from './npmModuleFinders/babelModuleFinder';
import { PluginConstructor } from '../plugin';
import EmptyIgnorer from './vanilla/emptyIgnorer';
import PolyfillModuleFinder from './npmModuleFinders/polyfillModuleFinder';
import CssFinder from './static/cssFinder';

const taggerList: PluginConstructor[] = [
  // pass 1
  EmptyIgnorer,
  SimpleModuleFinder,
  PolyfillModuleFinder,
  BabelModuleFinder,
  // pass 2
  PassthroughModuleRemapper,
  CssFinder,
];

export default taggerList;
