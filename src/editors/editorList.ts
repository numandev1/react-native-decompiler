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
