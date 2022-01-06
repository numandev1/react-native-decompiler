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

import { Visitor } from '@babel/traverse';
import { isNumericLiteral } from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Cleans up any useless comma operations, for example `(0, function)`
 */
export default class UselessCommaOperatorCleaner extends Plugin {
  readonly pass = 1;

  getVisitor(): Visitor {
    return {
      SequenceExpression(path) {
        if (path.node.expressions.length !== 2 || !isNumericLiteral(path.node.expressions[0])) return;
        path.replaceWith(path.node.expressions[1]);
      },
    };
  }
}
