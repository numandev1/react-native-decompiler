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

import {
  isExpressionStatement,
  isCallExpression,
  isMemberExpression,
  isIdentifier,
  isStringLiteral,
  FunctionExpression,
} from '@babel/types';
import { NodePath } from '@babel/traverse';
import { Plugin } from '../../plugin';

/**
 * Removes the ```Object.defineProperty(exports, '__esModule', { value: true });```
 */
export default class EsModuleCleaner extends Plugin {
  readonly pass = 2;

  evaluate(path: NodePath<FunctionExpression>): void {
    const bodyPath = this.navigateToModuleBody(path);

    bodyPath.node.body = bodyPath.node.body.filter((line) => {
      const callExpression = isExpressionStatement(line) ? line.expression : line;
      if (!isCallExpression(callExpression)) return true;
      if (!isMemberExpression(callExpression.callee)) return true;
      if (!isIdentifier(callExpression.callee.object) || !isIdentifier(callExpression.callee.property)) return true;
      if (callExpression.callee.object.name !== 'Object' || callExpression.callee.property.name !== 'defineProperty') return true;
      if (!isIdentifier(callExpression.arguments[0]) || !isStringLiteral(callExpression.arguments[1])) return true;
      if (bodyPath.scope.getBindingIdentifier(callExpression.arguments[0].name)?.start !== this.module.exportsParam?.start) return true;
      if (callExpression.arguments[1].value !== '__esModule') return true;

      this.module.tags.push('__esModule');
      return false;
    });
  }
}
