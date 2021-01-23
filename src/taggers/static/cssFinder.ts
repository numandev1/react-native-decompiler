

import { Plugin } from '../../plugin';

/**
 * Finds CSS files loaded by css-loader & style-loader
 */
export default class CssFinder extends Plugin {
  readonly pass = 2;
  name = 'CssFinder';

  evaluate(): void {
    if (this.module.dependencies.filter((e) => e != null).length !== 2) return;

    const styleLoaderDep = this.module.dependencies.find((dep) => this.moduleList[dep] && this.moduleList[dep].moduleName === 'style-loader');
    if (styleLoaderDep == null) return;

    const cssDep = this.module.dependencies.find((dep) => dep != null && dep !== styleLoaderDep);
    if (cssDep == null) return;

    this.module.isStatic = true;
    this.module.ignored = true;
    this.module.staticContent = this.moduleList[cssDep].moduleStrings[0];
    this.module.tags.push('css');

    this.moduleList[cssDep].ignored = true;
  }
}
