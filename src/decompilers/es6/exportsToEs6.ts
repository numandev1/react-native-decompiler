

import { Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Convertes exports.? into ES6 named exports
 */
export default class ExportsToEs6 extends Plugin {
  readonly pass = 2;

  getVisitor(): Visitor {
    if (!this.cmdArgs.es6 || !this.module.tags.includes('__esModule')) return {};
    return {
      AssignmentExpression: (path) => {
        if (!t.isMemberExpression(path.node.left) || !t.isIdentifier(path.node.left.object) || !t.isIdentifier(path.node.left.property)) return;
        if (path.node.left.object.name !== 'exports') return;
        const isDefault = path.node.left.property.name === 'default';
        const generatedExport = this.generateEs6Export(path.node, isDefault);
        if (!generatedExport) return;

        if (t.isExpressionStatement(path.parent)) {
          path.parentPath.replaceWith(generatedExport);
        } else if (t.isFunctionExpression(path.node.right) && path.parentPath.isVariableDeclarator() && t.isIdentifier(path.parentPath.node.id)) {
          path.scope.rename(path.parentPath.node.id.name, path.node.left.property.name);
          if (path.parentPath.parentPath.isVariableDeclaration() && path.parentPath.parentPath.node.declarations.length === 1) {
            path.parentPath.parentPath.replaceWith(generatedExport);
          } else {
            path.parentPath.parentPath.insertAfter(generatedExport);
            path.parentPath.remove();
          }
        }
      },
    };
  }

  private generateEs6Export(node: t.AssignmentExpression, isDefault: boolean): t.ExportNamedDeclaration | t.ExportDefaultDeclaration | null {
    if (!t.isMemberExpression(node.left) || !t.isIdentifier(node.left.property)) throw new Error('Failed assertion');

    const exportType = isDefault ? t.exportDefaultDeclaration : t.exportNamedDeclaration;
    if (t.isObjectExpression(node.right) && !isDefault) {
      return t.exportNamedDeclaration(t.variableDeclaration('const', [t.variableDeclarator(node.left.property, node.right)]));
    }
    if (t.isFunctionExpression(node.right)) {
      return exportType(t.functionDeclaration(node.left.property, node.right.params, node.right.body));
    }
    if (t.isIdentifier(node.right) && isDefault) {
      return t.exportDefaultDeclaration(node.right);
    }
    return null;
  }
}
