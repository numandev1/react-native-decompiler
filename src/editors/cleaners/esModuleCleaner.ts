

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
