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

import * as t from '@babel/types';
import { Visitor } from '@babel/traverse';
import { Plugin } from '../../plugin';

/**
 * Removes all instances of exports.? = undefined;
 */
export default class NoUndefinedExport extends Plugin {
  readonly pass = 2;
  name = 'NoUndefinedExport';

  getVisitor(): Visitor {
    return {
      AssignmentExpression: (path) => {
        if (!t.isMemberExpression(path.node.left) || !t.isUnaryExpression(path.node.right) || !t.isIdentifier(path.node.left.object)) return;
        if (!t.isNumericLiteral(path.node.right.argument)) return;
        if (path.node.left.object.name !== 'exports' || path.node.right.operator !== 'void' || path.node.right.argument.value !== 0) return;

        const parentStatement = path.find((p) => p.isExpressionStatement());
        if (!parentStatement) return;
        parentStatement.remove();
      },
    };
  }
}
