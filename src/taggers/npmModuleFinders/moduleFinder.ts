

import { NodePath } from '@babel/traverse';
import { FunctionExpression } from '@babel/types';
import { Plugin } from '../../plugin';

export default abstract class ModuleFinder extends Plugin {
  readonly pass = 1;

  protected tagAsNpmModule(moduleName: string, varName?: string): void {
    if (this.module.isNpmModule && this.module.moduleName !== moduleName) {
      throw new Error(`Module #${this.module.moduleId} is already the ${this.module.moduleName} module but tried to re-tag as ${moduleName}`);
    }

    this.module.isNpmModule = true;
    this.module.ignored = true;
    this.module.moduleName = moduleName;
    this.module.npmModuleVarName = varName;
  }

  abstract evaluate(path: NodePath<FunctionExpression>): void;
}
