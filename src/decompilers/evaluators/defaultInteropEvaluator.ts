

import { Visitor } from '@babel/traverse';
import {
  isCallExpression,
  isIdentifier,
} from '@babel/types';
import { Plugin } from '../../plugin';
import Module from '../../module';
import CmdArgs from '../../interfaces/cmdArgs';

/**
 * Evaluates babel default interops
 */
export default class DefaultInteropEvaluator extends Plugin {
  readonly pass = 1;

  getVisitor(): Visitor {
    return {
      VariableDeclarator: (path) => {
        if (!isIdentifier(path.node.id)) return;
        if (this.variableIsForDependency(path, ['@babel/runtime/helpers/interopRequireDefault', '@babel/runtime/helpers/interopRequireWildcard'])) {
          const interopVarName = path.node.id.name;
          this.bindingTraverse(path.scope.bindings[interopVarName], interopVarName, {
            CallExpression: (bindingPath) => {
              if (!isIdentifier(bindingPath.node.callee) || bindingPath.node.callee.name !== interopVarName) return;
              if (isCallExpression(bindingPath.node.arguments[0])) {
                bindingPath.replaceWith(bindingPath.node.arguments[0]);
              } else if (isIdentifier(bindingPath.node.arguments[0])) {
                const parent = bindingPath.find((p) => p.isVariableDeclarator());
                if (!parent?.isVariableDeclarator() || !isIdentifier(parent.node.id)) throw new Error('Failed assertion');
                this.mergeBindings(parent, parent.node.id.name, bindingPath.node.arguments[0].name);
              }
            },
          });
          path.remove();
        }
      },
    };
  }
}
