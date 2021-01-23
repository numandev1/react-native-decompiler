

import { Visitor } from '@babel/traverse';
import {
  isMemberExpression,
  isIdentifier,
} from '@babel/types';
import { Plugin } from '../../plugin';

/**
 * Resolves and bypasses modules that just export other modules.
 */
export default class PassthroughModuleRemapper extends Plugin {
  readonly pass = 2;
  name = 'PassthroughModuleRemapper';

  getVisitor(): Visitor {
    if (this.module.moduleCode.body.length !== 1) return {};

    return {
      AssignmentExpression: (path) => {
        if (!isMemberExpression(path.node.left) || !isIdentifier(path.node.left?.object) || !isIdentifier(path.node.left?.property)) return;
        if (path.scope.getBindingIdentifier(path.node.left.object.name)?.start !== this.module.moduleParam?.start) return;
        if (path.node.left.property.name !== 'exports') return;

        const right = path.get('right');
        if (!right.isCallExpression()) return;
        const rightCallee = right.get('callee');
        if (!rightCallee.isIdentifier() && !rightCallee.isCallExpression()) return;

        const dependency = this.getModuleDependency(rightCallee.isCallExpression() ? rightCallee : right);
        if (!dependency) return;
        if (rightCallee.isCallExpression() && !dependency.moduleStrings.find((str) => str.includes('Calling PropTypes validators directly is not supported'))) return;
        if (!this.moduleList.some((m) => m.dependencies.includes(this.module.moduleId))) return;

        this.debugLog(`bypassing ${this.module.moduleId} for ${dependency.moduleId} ${dependency.moduleName}`);

        const passthroughDependency = this.moduleList[dependency.moduleId];
        this.module.ignored = true;
        this.module.isNpmModule = true; // flag as NPM module in case this module pass through NPM module
        this.module.moduleName = `${this.module.moduleId} PASSTHROUGH TO ${passthroughDependency.moduleName}`;
        this.moduleList.forEach((module) => {
          module.dependencies = module.dependencies.map((dep) => (dep === this.module.moduleId ? passthroughDependency.moduleId : dep));
        });
      },
    };
  }
}
