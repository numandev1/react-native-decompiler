

import { Visitor } from '@babel/traverse';
import {
  isArrayPattern,
  isCallExpression,
  isMemberExpression,
  isIdentifier,
} from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Does some renaming on Reach Hook setStates for clarity (changes setter function to `setX`)
 */
export default class SetStateRenamer extends Plugin {
  // has to run after array destructuring
  readonly pass = 4;

  getVisitor(): Visitor {
    return {
      VariableDeclaration: (path) => {
        path.node.declarations.forEach((varNode) => {
          // is it array destructure with 2 elements?
          if (!isArrayPattern(varNode.id) || varNode.id.elements.length !== 2 || !isIdentifier(varNode.id.elements[0]) || !isIdentifier(varNode.id.elements[1])) return;

          // is it defined by React.useState?
          if (!isCallExpression(varNode.init) || !isMemberExpression(varNode.init.callee)) return;
          if (!isIdentifier(varNode.init.callee.object) || !isIdentifier(varNode.init.callee.property)) return;
          if (varNode.init.callee.object.name !== 'React' || varNode.init.callee.property.name !== 'useState') return;
          path.parentPath.scope.crawl();
          path.parentPath.scope.rename(varNode.id.elements[1].name, `set${varNode.id.elements[0].name[0].toUpperCase()}${varNode.id.elements[0].name.slice(1)}`);
        });
      },
    };
  }
}
