

import { Visitor } from '@babel/traverse';
import { identifier, isNumericLiteral } from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Converts `void 0` to `undefined`
 */
export default class VoidZeroToUndefined extends Plugin {
  readonly pass = 1;

  getVisitor(): Visitor {
    return {
      UnaryExpression(path) {
        if (path.node.operator !== 'void' || !isNumericLiteral(path.node.argument) || path.node.argument.value !== 0) return;
        path.replaceWith(identifier('undefined'));
      },
    };
  }
}
