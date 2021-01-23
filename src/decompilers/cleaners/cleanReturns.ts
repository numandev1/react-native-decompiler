

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
      }
    };
  }
}
