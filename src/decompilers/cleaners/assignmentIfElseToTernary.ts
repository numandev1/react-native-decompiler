

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
