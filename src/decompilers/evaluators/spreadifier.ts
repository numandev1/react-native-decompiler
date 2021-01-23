

import { Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import { Plugin } from '../../plugin';
/**
 * Coverts x.apply(x, [...]) into spreads)
 */
export default class Spreadifier extends Plugin {
  readonly pass = 1;
  readonly name = 'Spreadifer';

  getVisitor(): Visitor {
    return {
      CallExpression: (path) => {
        const callee = path.get('callee');
        if (!callee.isMemberExpression()) return;
        if (!t.isIdentifier(callee.node.property) || callee.node.property.name !== 'apply') return;
        const args = path.get('arguments');
        if (!t.isIdentifier(args[0].node) || !t.isCallExpression(args[1].node) || !t.isMemberExpression(args[1].node.callee)) return;
        if (!t.isArrayExpression(args[1].node.callee.object) || !t.isIdentifier(args[1].node.callee.property)) return;
        if (!t.isExpression(args[1].node.arguments[0]) || args[1].node.callee.property.name !== 'concat') return;

        let expectedThis: t.Node = path.node.callee;
        while (t.isMemberExpression(expectedThis)) {
          expectedThis = expectedThis.object;
        }
        if (!t.isIdentifier(expectedThis) || args[0].node.name !== expectedThis.name) return;

        callee.replaceWith(callee.node.object);

        const newAugments = [...args[1].node.callee.object.elements, t.spreadElement(args[1].node.arguments[0])];
        path.node.arguments = <t.Expression[]>newAugments;
      },
      ForStatement: (path) => {
        if (!t.isExpressionStatement(path.node.body) || !t.isAssignmentExpression(path.node.body.expression)) return;
        const forBody = path.node.body.expression;
        if (!t.isMemberExpression(forBody.left) || !t.isMemberExpression(forBody.right)) return;
        if (!t.isIdentifier(forBody.left.object) || !t.isIdentifier(forBody.left.property)) return;
        if (!t.isIdentifier(forBody.right.object) || !t.isIdentifier(forBody.right.property) || forBody.right.object.name !== 'arguments') return;

        let hasArgumentsLength = false;
        path.traverse({
          MemberExpression: (p) => {
            if (!t.isIdentifier(p.node.object) || !t.isIdentifier(p.node.property) || p.node.object.name !== 'arguments' || p.node.property.name !== 'length') return;
            hasArgumentsLength = true;
          },
        });
        if (!hasArgumentsLength) return;

        const func = path.find((p) => p.isFunctionExpression());
        if (!func?.isFunctionExpression()) return;

        path.scope.rename(forBody.left.object.name, 'args');
        path.remove();
        func.pushContainer('params', t.restElement(t.identifier('args')));
      },
    };
  }
}
