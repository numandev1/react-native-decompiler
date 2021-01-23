

import { NodePath, Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Convertes requires from ES6 modules into ES6 imports
 */
export default class ImportsToEs6 extends Plugin {
  readonly pass = 2;

  getVisitor(): Visitor {
    if (!this.cmdArgs.es6) return {};
    return {
      CallExpression: (path) => {
        if (!t.isIdentifier(path.node.callee) || !t.isStringLiteral(path.node.arguments[0])) return;

        const moduleDependency = this.getModuleDependency(path);
        if (moduleDependency == null) return;

        const varDeclar = path.find((e) => e.isVariableDeclarator());
        if (varDeclar == null || !varDeclar.isVariableDeclarator() || !t.isIdentifier(varDeclar.node.id)) return;
        const varIdentifier = varDeclar.node.id;
        const varName = varIdentifier.name;

        if (moduleDependency.tags.includes('defaultExportOnly') || !moduleDependency.tags.includes('__esModule')) {
          this.bindingTraverse(varDeclar.scope.bindings[varName], varName, {
            MemberExpression: (bPath) => {
              if (t.isIdentifier(bPath.node.object) && t.isIdentifier(bPath.node.property) && bPath.node.object.name === varName && bPath.node.property.name === 'default') {
                bPath.replaceWith(bPath.node.object);
              }
            },
          });
          const [newPath] = varDeclar.parentPath.insertBefore(t.importDeclaration([t.importDefaultSpecifier(varIdentifier)], path.node.arguments[0]));
          newPath.scope.registerBinding('module', newPath);
          varDeclar.remove();
          return;
        }

        const binding = varDeclar.scope.bindings[varName];
        const memberExpressions: NodePath<t.MemberExpression>[] = [];
        const imports: Set<string> = new Set();
        this.bindingTraverse(binding, varName, {
          MemberExpression: (bPath) => {
            if (t.isIdentifier(bPath.node.object) && t.isIdentifier(bPath.node.property) && bPath.node.object.name === varName) {
              memberExpressions.push(bPath);
              imports.add(bPath.node.property.name);
            }
          },
        });
        if (imports.size < 1) return;

        memberExpressions.forEach((bPath) => {
          if (t.isIdentifier(bPath.node.property) && bPath.node.property.name === 'default') {
            bPath.replaceWith(bPath.node.object);
          } else {
            bPath.replaceWith(bPath.node.property);
          }
        });

        const importSpecifiers = [...imports].map((i) => (i === 'default' ? t.importDefaultSpecifier(varIdentifier) : t.importSpecifier(t.identifier(i), t.identifier(i))));
        varDeclar.parentPath.insertBefore(t.importDeclaration(importSpecifiers, path.node.arguments[0]));
        varDeclar.remove();
      },
    };
  }
}
