

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
