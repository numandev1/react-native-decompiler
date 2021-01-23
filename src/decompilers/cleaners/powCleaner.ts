

import { Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Converts Math.pow to "a **" b"
 */
export default class PowCleaner extends Plugin {
  readonly pass = 1;

  getVisitor(): Visitor {
    return {
      CallExpression: (path) => {
        if (!t.isMemberExpression(path.node.callee) || !t.isIdentifier(path.node.callee.object) || !t.isIdentifier(path.node.callee.property)) return;
        if (path.node.callee.object.name !== 'Math' && path.node.callee.property.name !== 'pow') return;
        if (!t.isExpression(path.node.arguments[0]) || !t.isExpression(path.node.arguments[1])) return;

        path.replaceWith(t.binaryExpression('**', path.node.arguments[0], path.node.arguments[1]));
      },
    };
  }
}
