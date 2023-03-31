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
import { isAssignmentExpression, isIdentifier } from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Keeps returns clean with no weird things like AssignmentExpressions
 */
export default class CleanReturns extends Plugin {
  readonly pass = 1;

  getVisitor(): Visitor {
    return {
      ReturnStatement: (path) => {
        if (isAssignmentExpression(path.node.argument) && isIdentifier(path.node.argument.left)) {
          path.insertBefore(path.node.argument);
          path.get('argument').replaceWith(path.node.argument.left);
        }
      },
    };
  }
}
