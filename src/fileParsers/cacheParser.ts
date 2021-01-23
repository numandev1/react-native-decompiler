

import fs from 'fs-extra';
import crypto from 'crypto';
import path from 'path';
import * as babylon from '@babel/parser';
import traverse from '@babel/traverse';
import { CachedFile } from '../interfaces/cachedFile';
import CmdArgs from '../interfaces/cmdArgs';
import Module from '../module';
import FileParser from './fileParser';
import ProgressBar from '../util/progressBar';

export default class CacheParser implements FileParser {
  private readonly progressBar = ProgressBar.getInstance();

  async canParse(args: CmdArgs): Promise<boolean> {
    try {
      const cacheFilename = `${args.out}/${args.entry ?? 'null'}.cache`;
      const file: CachedFile = await fs.readJSON(cacheFilename);

      console.log('Cache detected, validating it...');
      const currentChecksums = await this.generateInputChecksums(args.in);
      if (file.inputChecksum.some((checksum, i) => checksum !== currentChecksums[i])) {
        console.log('Cache invalidated due to checksum mismatch');
        await fs.remove(cacheFilename);
        throw new Error('Cache was invalidated');
      }
      console.log('Cache validated');

      return true;
    } catch (e) {
      if (args.agressiveCache) throw new Error('A cache file must be generated before using --agressiveCache');
      return false;
    }
  }

  private async generateInputChecksums(input: string): Promise<string[]> {
    if ((await fs.lstat(input)).isDirectory()) {
      return fs.readdir(input)
        .then((fileNames) => Promise.all(fileNames.map((file) => fs.readFile(path.join(input, file)))))
        .then((files) => files.map((file) => crypto.createHash('md5').update(file).digest('hex')));
    }

    return [crypto.createHash('md5').update(await fs.readFile(input)).digest('hex')];
  }

  async parse(args: CmdArgs): Promise<Module[]> {
    console.log('Loading cache...');

    const cacheFilename = `${args.out}/${args.entry ?? 'null'}.cache`;
    const cacheFile: CachedFile = await fs.readJSON(cacheFilename);

    const validCachedModules = cacheFile.modules.map((cachedModule) => {
      if (!args.agressiveCache || !cachedModule.ignored || cachedModule.isNpmModule) {
        return cachedModule;
      }
      return null;
    });

    const modules: Module[] = [];
    this.progressBar.start(0, validCachedModules.length);

    validCachedModules.forEach((cached) => {
      if (cached == null) return;
      const canIgnoreModuleBody = args.agressiveCache && cached.isNpmModule && cached.code.length > 128;
      const originalFile = babylon.parse(canIgnoreModuleBody ? '(function(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p){})' : cached.code);
      traverse(originalFile, {
        FunctionExpression(nodePath) {
          const module = new Module(originalFile, nodePath, cached.moduleId, args.agressiveCache ? cached.dependencies : cached.originalDependencies, cached.paramMappings);
          if (args.agressiveCache) {
            module.ignored = cached.ignored;
            module.isNpmModule = cached.isNpmModule;
            module.isPolyfill = cached.isPolyfill;
            module.isStatic = cached.isStatic;
            module.staticContent = cached.staticContent;
            module.moduleName = cached.moduleName;
            module.npmModuleVarName = cached.npmModuleVarName;
          }
          module.moduleStrings = cached.moduleStrings;
          module.moduleComments = cached.moduleComments;
          module.variableNames = new Set(cached.variableNames);
          module.originalCode = cached.code;
          module.previousRunChecksum = cached.previousRunChecksum;

          modules[cached.moduleId] = module;

          nodePath.skip();
        },
      });
      this.progressBar.increment();
    });

    this.progressBar.stop();

    return modules;
  }
}
