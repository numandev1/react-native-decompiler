

import { performance } from 'perf_hooks';
import { NodePath } from '@babel/traverse';
import { PluginConstructor, Plugin } from './plugin';
import Module from './module';
import CmdArgs from './interfaces/cmdArgs';

export default class Router<T extends Plugin, TConstructor extends PluginConstructor<T>> {
  static traverseTimeTaken = 0;
  static recrawlTimeTaken = 0;
  static timeTaken: { [index: string]: number } = {};

  readonly maxPass: number;
  private readonly module: Module;
  private readonly moduleList: Module[];
  private readonly list: T[];
  private readonly listConstructors: TConstructor[];
  private readonly args: CmdArgs;

  constructor(list: TConstructor[], module: Module, moduleList: Module[], args: CmdArgs) {
    this.listConstructors = list;
    this.args = args;
    this.list = list.map((PluginToLoad) => {
      if (this.args.performance && Router.timeTaken[PluginToLoad.name] == null) {
        Router.timeTaken[PluginToLoad.name] = 0;
      }
      return new PluginToLoad(args, module, moduleList);
    });
    this.maxPass = Math.max(...this.list.map((plugin) => plugin.pass));

    this.module = module;
    this.moduleList = moduleList;
  }

  runPass = (pass: number): void => {
    if (this.module.failedToDecompile) return;
    try {
      const passPlugins = this.list.map((plugin, index) => ({ plugin, index })).filter(({ plugin }) => plugin.pass === pass);

      if (this.args.debug === this.module.moduleId) {
        this.runDebugPass(passPlugins.map(({ plugin }) => plugin));
      }

      let startTime = performance.now();
      const visitorFunctions: { [index: string]: ((path: NodePath<unknown>) => void)[] } = {};

      passPlugins.forEach(({ plugin, index }) => {
        if (plugin.evaluate) {
          this.performanceTrack(this.listConstructors[index].name, () => plugin.evaluate && plugin.evaluate(this.module.rootPath, this.runPlugin));
        } else if (plugin.getVisitor) {
          // disable some eslint rules from object mapping
          /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
          const visitor: any = plugin.getVisitor(this.runPlugin);
          Object.keys(visitor).forEach((key) => {
            if (!visitorFunctions[key]) {
              visitorFunctions[key] = [];
            }
            if (this.args.performance) {
              visitorFunctions[key].push((path: NodePath<unknown>) => {
                Router.traverseTimeTaken += performance.now() - startTime;
                this.performanceTrack(this.listConstructors[index].name, () => visitor[key](path));
                startTime = performance.now();
              });
            } else {
              visitorFunctions[key].push(visitor[key]);
            }
          });
        } else {
          throw new Error('Plugin does not have getVisitor nor evaluate');
        }
      });

      const visitor: any = {};
      Object.keys(visitorFunctions).forEach((key) => {
        visitor[key] = this.processVisit(visitorFunctions[key]);
      });
      /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
      if (Object.keys(visitor).length > 0) {
        startTime = performance.now();
        this.module.rootPath.traverse(visitor);
        Router.traverseTimeTaken += performance.now() - startTime;
      }

      passPlugins.forEach(({ plugin, index }) => {
        this.performanceTrack(this.listConstructors[index].name, () => plugin.afterPass && plugin.afterPass(this.runPlugin));
      });
    } catch (e) {
      console.error(`An error occured parsing module ${this.module.moduleId}, it will be outputted as is!`);
      console.error(e);
      this.module.failedToDecompile = true;
    }
  };

  private runDebugPass = (passPlugins: Plugin[]): void => {
    let lastCode = '';
    passPlugins.forEach((plugin) => {
      if (plugin.evaluate) {
        plugin.evaluate(this.module.rootPath, this.runPlugin);
      } else if (plugin.getVisitor) {
        this.module.rootPath.traverse(plugin.getVisitor(this.runPlugin));
      } else {
        throw new Error('Plugin does not have getVisitor nor evaluate');
      }
    });
    passPlugins.forEach((plugin) => {
      if (plugin.afterPass) {
        plugin.afterPass(this.runPlugin);
      }
      console.log('after', plugin.name ?? 'unknown_name:');
      const newCode = this.module.debugToCode();
      if (lastCode !== newCode) {
        console.log(newCode);
        lastCode = newCode;
      } else {
        console.log('No change');
      }
    });
  };

  private performanceTrack = (key: string, cb: () => void): void => {
    if (!this.args.performance) {
      cb();
    } else {
      const startTime = performance.now();
      cb();
      Router.timeTaken[key] += performance.now() - startTime;
    }
  };

  private processVisit = (plugins: ((path: NodePath<unknown>) => void)[]) => (path: NodePath<unknown>): void => {
    plugins.forEach((fn) => fn(path));
  };

  private runPlugin = (PluginToRun: PluginConstructor): void => {
    const plugin = new PluginToRun(this.args, this.module, this.moduleList);
    if (plugin.evaluate) {
      plugin.evaluate(this.module.rootPath, this.runPlugin);
    } else if (plugin.getVisitor) {
      this.module.rootPath.traverse(plugin.getVisitor(this.runPlugin));
    } else {
      throw new Error('Plugin does not have getVisitor nor evaluate');
    }
    if (plugin.afterPass) {
      plugin.afterPass(this.runPlugin);
    }
  };
}
