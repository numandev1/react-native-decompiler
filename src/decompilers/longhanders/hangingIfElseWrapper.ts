

import { NodePath, Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Converts `cond && statement` to `if (cond) statement`
 */
export default class HangingIfElseWrapper extends Plugin {
  readonly pass = 1;
  readonly name = 'HangingIfElseWrapper';

  getVisitor(): Visitor {
    return {
      ExpressionStatement: (path) => {
        if (!t.isBlockStatement(path.parent) && !t.isSwitchCase(path.parent)) return;

        if (t.isLogicalExpression(path.node.expression) && path.node.expression.operator === '&&') {
          this.convertShorthandIf(path, path.node.expression, true);
        } else if (t.isLogicalExpression(path.node.expression) && path.node.expression.operator === '||') {
          this.convertShorthandIf(path, path.node.expression, false);
        } else if (t.isConditionalExpression(path.node.expression)) {
          this.convertShorthandIfElse(path, path.node.expression);
        }
      },
      ReturnStatement: (path) => {
        if (!t.isConditionalExpression(path.node.argument)) return;
        const eitherIsSeqExp = t.isSequenceExpression(path.node.argument.consequent) || t.isSequenceExpression(path.node.argument.alternate);
        const bothAreCondExp = t.isConditionalExpression(path.node.argument.consequent) && t.isConditionalExpression(path.node.argument.alternate);
        if (!eitherIsSeqExp && !bothAreCondExp) return;

        path.replaceWith(t.ifStatement(path.node.argument.test, this.convertToReturnBody(path.node.argument.consequent), this.convertToReturnBody(path.node.argument.alternate)));
      },
    };
  }

  private convertShorthandIf(path: NodePath<t.ExpressionStatement>, expression: t.LogicalExpression, condition: boolean): void {
    this.debugLog(this.debugPathToCode(path));
    path.replaceWith(this.parseConditionalIf(expression, condition));
  }

  private parseConditionalIf(exp: t.LogicalExpression, condition: boolean): t.IfStatement {
    const body = t.isSequenceExpression(exp.right) ? t.blockStatement(exp.right.expressions.map((e) => t.expressionStatement(e))) : t.expressionStatement(exp.right);
    return t.ifStatement(condition ? exp.left : t.unaryExpression('!', exp.left), body);
  }

  private convertShorthandIfElse(path: NodePath<t.ExpressionStatement>, cond: t.ConditionalExpression): void {
    this.debugLog(this.debugPathToCode(path));
    path.replaceWith(this.parseConditionalToIfElse(cond));
  }

  private parseConditionalToIfElse(cond: t.ConditionalExpression): t.IfStatement {
    const elseBlock = t.isConditionalExpression(cond.alternate) ? this.parseConditionalToIfElse(cond.alternate) : this.convertToBody(cond.alternate);
    return t.ifStatement(cond.test, this.convertToBody(cond.consequent), elseBlock);
  }

  private convertToBody(e: t.Node): t.Statement {
    if (t.isSequenceExpression(e)) {
      return t.blockStatement(e.expressions.map((exp) => t.expressionStatement(exp)));
    }
    if (t.isLogicalExpression(e)) {
      return this.parseConditionalIf(e, e.operator === '&&');
    }
    if (t.isExpression(e)) {
      return t.expressionStatement(e);
    }
    if (t.isStatement(e)) {
      return e;
    }
    throw new Error(`Unexpected conversion of ${e.type} to statement body`);
  }

  private convertToReturnBody(e: t.Node): t.Statement {
    if (t.isSequenceExpression(e)) {
      return t.blockStatement(e.expressions.map((exp, i) => (i + 1 === e.expressions.length ? t.returnStatement(exp) : t.expressionStatement(exp))));
    }
    if (t.isExpression(e)) {
      return t.returnStatement(e);
    }
    throw new Error(`Unexpected conversion of ${e.type} to return body`);
  }
}
