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
import * as t from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Converts Math.pow to "a **" b"
 */
export default class PowCleaner extends Plugin {
  readonly pass = 1;

  getVisitor(): Visitor {
    return {
      CallExpression: (path) => {
        if (!t.isMemberExpression(path.node.callee) || !t.isIdentifier(path.node.callee.object) || !t.isIdentifier(path.node.callee.property)) return;
        if (path.node.callee.object.name !== 'Math' && path.node.callee.property.name !== 'pow') return;
        if (!t.isExpression(path.node.arguments[0]) || !t.isExpression(path.node.arguments[1])) return;

        path.replaceWith(t.binaryExpression('**', path.node.arguments[0], path.node.arguments[1]));
      },
    };
  }
}
