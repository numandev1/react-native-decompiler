/**
  React Native Decompiler
  Copyright (C) 2020-2022 Richard Fu, Numan and contributors
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.
  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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

      return fileNames.some((fileName) => {
        const file = fs.readFileSync(path.join(args.in, fileName), 'utf8');
        return /__d\(function\([a-z],[a-z],[a-z],[a-z],[a-z],[a-z],[a-z]\)/.test(file)
          || /__d\(function\([a-z],[a-z],[a-z],[a-z],[a-z],[a-z]\)/.test(file)
          || /__d\(function\([a-z],[a-z],[a-z],[a-z],[a-z]\)/.test(file);
      });
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
