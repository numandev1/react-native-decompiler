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
import {
  isArrayPattern,
  isCallExpression,
  isMemberExpression,
  isIdentifier,
} from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Does some renaming on Reach Hook setStates for clarity (changes setter function to `setX`)
 */
export default class SetStateRenamer extends Plugin {
  // has to run after array destructuring
  readonly pass = 4;

  getVisitor(): Visitor {
    return {
      VariableDeclaration: (path) => {
        path.node.declarations.forEach((varNode) => {
          // is it array destructure with 2 elements?
          if (!isArrayPattern(varNode.id) || varNode.id.elements.length !== 2 || !isIdentifier(varNode.id.elements[0]) || !isIdentifier(varNode.id.elements[1])) return;

          // is it defined by React.useState?
          if (!isCallExpression(varNode.init) || !isMemberExpression(varNode.init.callee)) return;
          if (!isIdentifier(varNode.init.callee.object) || !isIdentifier(varNode.init.callee.property)) return;
          if (varNode.init.callee.object.name !== 'React' || varNode.init.callee.property.name !== 'useState') return;
          path.parentPath.scope.crawl();
          path.parentPath.scope.rename(varNode.id.elements[1].name, `set${varNode.id.elements[0].name[0].toUpperCase()}${varNode.id.elements[0].name.slice(1)}`);
        });
      },
    };
  }
}
