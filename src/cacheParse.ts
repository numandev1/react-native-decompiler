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
