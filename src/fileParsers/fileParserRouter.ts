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

import CmdArgs from '../interfaces/cmdArgs';
import Module from '../module';
import CacheParser from './cacheParser';
import FileParser from './fileParser';
import ReactNativeFolderParser from './reactNativeFolderParser';
import ReactNativeSingleParser from './reactNativeSingleParser';
import WebpackFolderParser from './webpackFolderParser';
import WebpackSingleParser from './webpackSingleParser';

/**
 * Attempts to route the cmd args to a valid file parser
 */
export default class FileParserRouter {
  private readonly list: FileParser[] = [
    new CacheParser(),
    new ReactNativeSingleParser(),
    new ReactNativeFolderParser(),
    new WebpackSingleParser(),
    new WebpackFolderParser(),
  ];

  async route(args: CmdArgs): Promise<Module[] | null> {
    const fileParser = await Promise.all(this.list.map((router) => router.canParse(args)))
      .then((results) => this.list[results.findIndex((e) => e)]);

    if (!fileParser) return null;

    return fileParser.parse(args);
  }
}
