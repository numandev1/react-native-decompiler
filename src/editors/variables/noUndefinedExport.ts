

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
