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

import { PluginConstructor } from '../plugin';
import VoidZeroToUndefined from './longhanders/voidZeroToUndefined';
import LongBooleans from './longhanders/longBooleans';
import RequireMapper from './mappers/requireMapper';
import UselessCommaOperatorCleaner from './cleaners/uselessCommaOperatorCleaner';
import AssignmentIfElseToTernary from './cleaners/assignmentIfElseToTernary';
import HangingIfElseWrapper from './longhanders/hangingIfElseWrapper';
import DefaultInteropEvaluator from './evaluators/defaultInteropEvaluator';
import ArrayDestructureEvaluator from './evaluators/arrayDestructureEvaluator';
import SetStateRenamer from './react/setStateRenamer';
import ToConsumableArrayCleaner from './babel/cleaners/toConsumableArrayCleaner';
import Spreadifier from './evaluators/spreadifier';
import JSXConverter from './react/jsxConverter';
import ExportsToEs6 from './es6/exportsToEs6';
import CleanReturns from './cleaners/cleanReturns';
import BabelClassEvaluator from './babel/class/babelClassEvaluator';
import PowCleaner from './cleaners/powCleaner';
import ImportsToEs6 from './es6/importsToEs6';

const decompilerList: PluginConstructor[] = [
  VoidZeroToUndefined,
  LongBooleans,
  RequireMapper,
  AssignmentIfElseToTernary,
  HangingIfElseWrapper,
  CleanReturns,
  PowCleaner,
  DefaultInteropEvaluator,
  ArrayDestructureEvaluator,
  Spreadifier,
  UselessCommaOperatorCleaner,
  // pass 2
  ExportsToEs6,
  ImportsToEs6,
  // pass 3
  ToConsumableArrayCleaner,
  BabelClassEvaluator,
  JSXConverter,
  // pass 4
  SetStateRenamer,
];

export default decompilerList;
