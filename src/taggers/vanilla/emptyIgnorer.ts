

import { Plugin } from '../../plugin';

/**
 * Ignores empty files
 */
export default class EmptyIgnorer extends Plugin {
  readonly pass = 1;
  name = 'EmptyIgnorer';

  evaluate(): void {
    if (this.module.rootPath.node.body.body.length === 0) {
      this.debugLog(`Ignored ${this.module.moduleId} because it is empty`);
      this.module.ignored = true;
    }
  }
}
