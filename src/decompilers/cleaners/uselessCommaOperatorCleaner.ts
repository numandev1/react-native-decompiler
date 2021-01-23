

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
