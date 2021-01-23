

import { Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import Module from '../../module';
import { Plugin } from '../../plugin';

/**
 * Maps the webpack requires to their file/NPM counterparts (that we generate)
 */
export default class RequireMapper extends Plugin {
  readonly pass = 1;

  getVisitor(): Visitor {
    return {
      CallExpression: (path) => {
        if (!t.isIdentifier(path.node.callee)) return;

        const moduleDependency = this.getModuleDependency(path);
        if (moduleDependency == null) return;

        const varDeclar = path.find((p) => p.isVariableDeclarator());
        const varName = varDeclar?.isVariableDeclarator() && t.isIdentifier(varDeclar.node.id) ? varDeclar.node.id.name : null;

        if (moduleDependency.isPolyfill && varName) {
          this.bindingTraverse(path.scope.bindings[varName], varName, {
            MemberExpression: (bPath) => {
              if (!t.isIdentifier(bPath.node.object) || !t.isIdentifier(bPath.node.property)) return;
              if (bPath.node.object.name !== varName || bPath.node.property.name !== 'default') return;

              bPath.replaceWith(bPath.node.object);
            },
          });
          path.scope.rename(varName, moduleDependency.npmModuleVarName);
          varDeclar?.remove();
          return;
        }

        path.get('arguments')[0].replaceWith(t.stringLiteral(this.generateModuleName(moduleDependency)));
        if (!varDeclar?.isVariableDeclarator()) return;
        if (!t.isIdentifier(varDeclar.node.id)) return;
        path.scope.rename(varDeclar.node.id.name, moduleDependency.npmModuleVarName || `module${moduleDependency.moduleId}`);
      },
    };
  }

  private generateModuleName(module: Module) {
    if (module.isNpmModule) {
      return module.moduleName;
    }
    if (module.isStatic && module) {
      return `./${module.moduleName}.css`;
    }
    return `./${module.moduleName}`;
  }
}
