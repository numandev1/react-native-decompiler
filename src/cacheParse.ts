

import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import Module from './module';
import { CachedFile } from './interfaces/cachedFile';
import CmdArgs from './interfaces/cmdArgs';

export default class CacheParse {
  cmdArgs: CmdArgs;

  constructor(cmdArgs: CmdArgs) {
    this.cmdArgs = cmdArgs;
  }

  async writeCache(filename: string, moduleList: Module[]): Promise<void> {
    return fs.writeJSON<CachedFile>(filename, {
      inputChecksum: await this.generateInputChecksums(this.cmdArgs.in),
      modules: moduleList.filter((ele) => ele != null).map((e) => e.toCache()),
    });
  }

  private async generateInputChecksums(input: string): Promise<string[]> {
    if ((await fs.lstat(input)).isDirectory()) {
      return fs.readdir(input)
        .then((fileNames) => Promise.all(fileNames.map((file) => fs.readFile(path.join(input, file)))))
        .then((files) => files.map((file) => crypto.createHash('md5').update(file).digest('hex')));
    }

    return [crypto.createHash('md5').update(await fs.readFile(input)).digest('hex')];
  }
}
