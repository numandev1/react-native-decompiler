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
import * as babylon from '@babel/parser';
import traverse from '@babel/traverse';
import { isIdentifier, isNumericLiteral } from '@babel/types';
import CmdArgs from '../interfaces/cmdArgs';
import Module from '../module';
import FileParser from './fileParser';
import PerformanceTracker from '../util/performanceTracker';
import ParamMappings from '../interfaces/paramMappings';

export default class ReactNativeSingleParser extends PerformanceTracker implements FileParser {
  private readonly SEVEN_PARAM_MAPPING: ParamMappings = {
    globals: 0,
    require: 1,
    module: 4,
    exports: 5,
  };

  async canParse(args: CmdArgs): Promise<boolean> {
    try {
      const file = await fs.readFile(args.in, 'utf8');

      return /__d\(function\([a-z],[a-z],[a-z],[a-z],[a-z],[a-z],[a-z]\)/.test(file)
        || /__d\(function\([a-z],[a-z],[a-z],[a-z],[a-z],[a-z]\)/.test(file)
        || /__d\(function\([a-z],[a-z],[a-z],[a-z],[a-z]\)/.test(file);
    } catch (e) {
      return false;
    }
  }

  async parse(args: CmdArgs): Promise<Module[]> {
    console.log('Parsing JS...');
    this.startTimer('parse-js');

    const file = await fs.readFile(args.in, 'utf8');
    const ast = babylon.parse(file);

    this.stopAndPrintTime('parse-js');

    const modules: Module[] = [];

    console.log('Finding modules...');
    this.startTimer('find-modules');

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

    this.stopAndPrintTime('find-modules');

    return modules;
  }
}
