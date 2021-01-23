

import fs from 'fs-extra';
import path from 'path';
import * as babylon from '@babel/parser';
import CmdArgs from '../interfaces/cmdArgs';
import Module from '../module';
import FileParser from './fileParser';
import WebpackParser from './webpackParser';

export default class WebpackFolderParser extends WebpackParser implements FileParser {
  async canParse(args: CmdArgs): Promise<boolean> {
    try {
      const fileNames = await fs.readdir(args.in);

      return fileNames.some((fileName) => this.fileIsWebpackEntry(fs.readFileSync(path.join(args.in, fileName), 'utf8')));
    } catch (e) {
      return false;
    }
  }

  async parse(args: CmdArgs): Promise<Module[]> {
    console.log('Parsing JS...');
    this.startTimer('parse-js');

    const fileNames = await fs.readdir(args.in);
    const files = await Promise.all(fileNames.map((fileName) => fs.readFile(path.join(args.in, fileName), 'utf8')));
    const asts = files.map((file) => babylon.parse(file));

    this.stopAndPrintTime('parse-js');

    const modules: Module[] = [];

    console.log('Finding modules...');
    this.startTimer('find-modules');

    asts.forEach((ast) => this.parseAst(ast, modules));

    this.stopAndPrintTime('find-modules');

    return modules;
  }
}
