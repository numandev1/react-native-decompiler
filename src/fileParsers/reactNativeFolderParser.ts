

import fs from 'fs-extra';
import path from 'path';
import * as babylon from '@babel/parser';
import traverse from '@babel/traverse';
import { isIdentifier, isNumericLiteral } from '@babel/types';
import CmdArgs from '../interfaces/cmdArgs';
import Module from '../module';
import FileParser from './fileParser';
import PerformanceTracker from '../util/performanceTracker';
import ParamMappings from '../interfaces/paramMappings';
import ProgressBar from '../util/progressBar';

export default class ReactNativeFolderParser extends PerformanceTracker implements FileParser {
  private readonly SEVEN_PARAM_MAPPING: ParamMappings = {
    globals: 0,
    require: 1,
    module: 4,
    exports: 5,
  };
  private readonly progressBar = ProgressBar.getInstance();

  async canParse(args: CmdArgs): Promise<boolean> {
    try {
      const fileNames = await fs.readdir(args.in);

      return fileNames.some((fileName) => fs.readFileSync(path.join(args.in, fileName), 'utf8').includes('__d(function(g,r,i,a,m,e,d)'));
    } catch (e) {
      return false;
    }
  }

  async parse(args: CmdArgs): Promise<Module[]> {
    const fileNames = (await fs.readdir(args.in)).filter((fileName) => fileName.endsWith('.js'));

    console.log('Parsing folder...');
    this.startTimer('parse');
    this.progressBar.start(0, fileNames.length);

    const modules: Module[] = [];

    await Promise.all(fileNames.map(async (fileName) => {
      const file = await fs.readFile(path.join(args.in, fileName), 'utf8');
      const ast = babylon.parse(file);

      traverse(ast, {
        CallExpression: (nodePath) => {
          if (isIdentifier(nodePath.node.callee) && nodePath.node.callee.name === '__d') {
            const functionArg = nodePath.get('arguments')[0];
            const moduleId = nodePath.get('arguments')[1];
            const dependencies = nodePath.get('arguments')[2];
            if (functionArg.isFunctionExpression() && moduleId.isNumericLiteral() && dependencies.isArrayExpression() && functionArg.node.body.body.length) {
              const dependencyValues = dependencies.node.elements.map((e) => {
                if (!isNumericLiteral(e)) throw new Error('Not numeric literal');
                return e.value;
              });
              const newModule = new Module(ast, functionArg, moduleId.node.value, dependencyValues, this.SEVEN_PARAM_MAPPING);
              newModule.calculateFields();
              modules[newModule.moduleId] = newModule;
            }
          }
          nodePath.skip();
        },
      });

      this.progressBar.increment();
    }));

    this.progressBar.stop();
    this.stopAndPrintTime('parse');

    return modules;
  }
}
