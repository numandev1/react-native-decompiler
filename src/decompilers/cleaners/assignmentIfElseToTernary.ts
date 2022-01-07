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
import { isLogicalExpression, isReturnStatement, conditionalExpression } from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Converts `return condition && a || b;` to `return condition ? a : b;`
 */
export default class AssignmentIfElseToTernary extends Plugin {
  readonly pass = 1;

  getVisitor(): Visitor {
    return {
      LogicalExpression(path) {
        if (!isReturnStatement(path.parent) || !isLogicalExpression(path.node.left)) return;
        if (path.node.operator !== '||' || path.node.left.operator !== '&&') return;

        path.replaceWith(conditionalExpression(path.node.left.left, path.node.left.right, path.node.right));
      },
    };
  }
}
