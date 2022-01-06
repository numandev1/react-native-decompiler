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
import CmdArgs from '../interfaces/cmdArgs';
import Module from '../module';
import FileParser from './fileParser';
import WebpackParser from './webpackParser';

export default class WebpackSingleParser extends WebpackParser implements FileParser {
  async canParse(args: CmdArgs): Promise<boolean> {
    try {
      const file = await fs.readFile(args.in, 'utf8');

      return this.fileIsWebpackEntry(file);
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

    this.parseAst(ast, modules);

    this.stopAndPrintTime('find-modules');

    return modules;
  }
}
