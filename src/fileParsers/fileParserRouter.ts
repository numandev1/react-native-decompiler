

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
