

import CommaOperatorUnwrapper from './unwrappers/commaOperatorUnwrapper';
import EsModuleCleaner from './cleaners/esModuleCleaner';
import { PluginConstructor } from '../plugin';
import BabelInlineConverters from './converters/babelInlineConverters';
import NoUndefinedExport from './variables/noUndefinedExport';

const editorList: PluginConstructor[] = [
  CommaOperatorUnwrapper,
  // pass 2
  BabelInlineConverters,
  EsModuleCleaner,
  NoUndefinedExport,
];

export default editorList;
