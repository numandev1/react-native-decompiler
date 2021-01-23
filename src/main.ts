

import fsExtra from 'fs-extra';
import { performance } from 'perf_hooks';
import prettier from 'prettier';
import generator from '@babel/generator';
import commandLineArgs from 'command-line-args';
import chalk from 'chalk';
import crypto from 'crypto';
import { ESLint } from 'eslint';
import Module from './module';
import taggerList from './taggers/taggerList';
import editorList from './editors/editorList';
import Router from './router';
import decompilerList from './decompilers/decompilerList';
import CacheParse from './cacheParse';
import eslintConfig from './eslintConfig';
import CmdArgs from './interfaces/cmdArgs';
import FileParserRouter from './fileParsers/fileParserRouter';
import PerformanceTracker from './util/performanceTracker';
import ProgressBar from './util/progressBar';

function calculateModulesToIgnore(argValues: CmdArgs, modules: Module[]): Module[] {
  if (argValues.agressiveCache) return [];
  return modules.filter((mod) => {
    const dependentModules = modules.filter((otherMod) => otherMod.dependencies.includes(mod.moduleId));
    return !mod.ignored && dependentModules.length > 0 && dependentModules.every((otherMod) => otherMod.ignored || mod.dependencies.includes(otherMod.moduleId));
  });
}

const argValues = commandLineArgs<CmdArgs>([
  { name: 'in', alias: 'i' },
  { name: 'out', alias: 'o' },
  { name: 'entry', alias: 'e', type: Number },
  { name: 'performance', alias: 'p', type: Boolean },
  { name: 'verbose', alias: 'v', type: Boolean },
  { name: 'es6', type: Boolean },
  { name: 'noEslint', type: Boolean },
  { name: 'noPrettier', type: Boolean },
  { name: 'decompileIgnored', type: Boolean },
  { name: 'agressiveCache', type: Boolean },
  { name: 'unpackOnly', type: Boolean },
  { name: 'noProgress', type: Boolean },
  { name: 'debug', type: Number },
]);
if (!argValues.in || !argValues.out) {
  console.log(`react-native-decompiler
Example command: react-native-decompiler -i index.android.bundle -o ./output

Command params:

-i (required) - the path to the input file/folder
-o (required) - the path to the output folder
-e - a module ID, if specified will only decompile that module & it's dependencies. also creates cache file to speed up future load times (useful for developing new plugins)
-p - performance monitoring flag, will print out runtime for each decompiler plugin
-v - verbose flag, does not include debug logging (use DEBUG=react-native-decompiler:* env flag for that)
--es6 - attempts to decompile to ES6 module syntax.
--noEslint - does not run ESLint after doing decompilation
--noPrettier - does not run Prettier after doing decompilation
--unpackOnly - only unpacks the app with no other adjustments
--decompileIgnored - decompile ignored modules(modules are generally ignored if they are flagged as an NPM module)
--agressiveCache - skips some cache checks at the expense of possible cache desync`);
  process.exit(0);
}
if (argValues.performance) {
  PerformanceTracker.enable();
}
if (argValues.noProgress) {
  ProgressBar.disable();
}

async function start() {
  try {
    const progressBar = ProgressBar.getInstance();
    const cacheFileName = `${argValues.out}/${argValues.entry ?? 'null'}.cache`;
    let startTime = performance.now();

    fsExtra.ensureDirSync(argValues.out);

    console.log('Reading file...');

    const fileParserRouter = new FileParserRouter();
    const modules = await fileParserRouter.route(argValues);

    if (modules == null || modules.length === 0) {
      console.error(`${chalk.red('[!]')} No modules were found!`);
      console.error(`${chalk.red('[!]')} Possible reasons:`);
      console.error(`${chalk.red('[!]')} - The React Native app is unbundled. If it is, export the "js-modules" folder from the app and provide it as the --js-modules argument`);
      console.error(`${chalk.red('[!]')} - The bundle is a binary/encrypted file (ex. Facebook, Instagram). These files are not supported`);
      console.error(`${chalk.red('[!]')} - The provided Webpack bundle input is not or does not contain the entrypoint bundle`);
      console.error(`${chalk.red('[!]')} - The file provided is not a React Native or Webpack bundle.`);
      process.exit(1);
    }

    if (argValues.entry != null && (!argValues.agressiveCache)) {
      console.log('Entry module provided, filtering out unused modules');
      const entryModuleDependencies = new Set<number>();
      let lastDependenciesSize = 0;

      entryModuleDependencies.add(argValues.entry);

      while (lastDependenciesSize !== entryModuleDependencies.size) {
        lastDependenciesSize = entryModuleDependencies.size;
        entryModuleDependencies.forEach((moduleId) => {
          const module = modules.find((mod) => mod?.moduleId === moduleId);
          if (module) {
            module.dependencies.forEach((dep) => entryModuleDependencies.add(dep));
          }
        });
      }

      modules.forEach((mod, i) => {
        if (!entryModuleDependencies.has(mod.moduleId)) {
          delete modules[i];
        }
      });
    }

    let nonIgnoredModules = modules.filter((mod) => argValues.decompileIgnored || !mod.ignored);

    console.log(`Took ${performance.now() - startTime}ms`);
    startTime = performance.now();
    console.log('Pre-parsing modules...');

    progressBar.start(0, nonIgnoredModules.length);
    nonIgnoredModules.forEach((module) => {
      module.validate();
      module.unpack();

      progressBar.increment();
    });

    progressBar.stop();
    console.log(`Took ${performance.now() - startTime}ms`);

    if (!argValues.unpackOnly) {
      startTime = performance.now();
      console.log('Tagging...');
      progressBar.start(0, nonIgnoredModules.length);

      const taggerRouters = nonIgnoredModules.map((m) => new Router(taggerList, m, modules, argValues));
      for (let pass = 1; pass <= taggerRouters[0].maxPass; pass += 1) {
        taggerRouters.forEach((r) => r.runPass(pass));
        if (pass === taggerRouters[0].maxPass) {
          progressBar.increment();
        }
      }

      progressBar.stop();
      if (argValues.performance) {
        console.log(`Traversal took ${Router.traverseTimeTaken}ms`);
        console.log(Router.timeTaken);
        Router.timeTaken = {};
        Router.traverseTimeTaken = 0;
      }
      console.log(`Took ${performance.now() - startTime}ms`);
      startTime = performance.now();

      console.log('Filtering out modules only depended on ignored modules...');

      let modulesToIgnore: Module[] = [];

      modulesToIgnore = calculateModulesToIgnore(argValues, modules);
      while (modulesToIgnore.length) {
        modulesToIgnore.forEach((mod) => {
          mod.ignored = true;
        });
        modulesToIgnore = calculateModulesToIgnore(argValues, modules);
      }

      if (argValues.verbose) {
        console.table(modules.map((mod) => {
          const dependentModules = modules.filter((otherMod) => otherMod.dependencies.includes(mod.moduleId));
          return {
            // moduleId: mod.moduleId,
            moduleName: mod.moduleName,
            ignored: mod.ignored,
            dependencies: mod.dependencies.filter((e) => e != null),
            dependents: dependentModules.map((m) => m.moduleId),
          };
        }));
        console.table(modules.filter((m) => !m.ignored || m.isNpmModule).map((mod) => {
          const dependentModules = modules.filter((otherMod) => otherMod.dependencies.includes(mod.moduleId));
          if (mod.isNpmModule && !dependentModules.filter((m) => !m.ignored).length) return null;
          return {
            // moduleId: mod.moduleId,
            moduleName: mod.moduleName,
            ignored: mod.ignored,
            dependencies: mod.dependencies.filter((e) => e != null),
            dependents: dependentModules.filter((m) => !m.ignored).map((m) => m.moduleId),
          };
        }).filter((e) => e != null));
      }

      nonIgnoredModules = modules.filter((mod) => argValues.decompileIgnored || !mod.ignored);

      console.log(`${nonIgnoredModules.length} remain to be decompiled`);

      console.log(`Took ${performance.now() - startTime}ms`);
      startTime = performance.now();
      console.log('Decompiling...');
      progressBar.start(0, nonIgnoredModules.length);

      const editorRouters = nonIgnoredModules.map((m) => new Router(editorList, m, modules, argValues));
      for (let pass = 1; pass <= editorRouters[0].maxPass; pass += 1) {
        editorRouters.forEach((r) => r.runPass(pass));
      }

      const decompilerRouter = nonIgnoredModules.map((m) => new Router(decompilerList, m, modules, argValues));
      for (let pass = 1; pass <= decompilerRouter[0].maxPass; pass += 1) {
        decompilerRouter.forEach((r) => r.runPass(pass));
        if (pass === decompilerRouter[0].maxPass) {
          progressBar.increment();
        }
      }

      progressBar.stop();
      if (argValues.performance) {
        console.log(`Traversal took ${Router.traverseTimeTaken}ms`);
        console.log(`Recrawl took ${Router.recrawlTimeTaken}ms`);
        console.log(Router.timeTaken);
      }
      console.log(`Took ${performance.now() - startTime}ms`);
    }

    startTime = performance.now();
    console.log('Generating code...');
    progressBar.start(0, nonIgnoredModules.length);

    const eslint = new ESLint({
      fix: true,
      ignore: false,
      useEslintrc: false,
      extensions: ['.js', '.jsx'],
      overrideConfig: eslintConfig,
    });

    const generatedFiles = await Promise.all(nonIgnoredModules.map(async (module) => {
      if (module.previousRunChecksum === crypto.createHash('md5').update(JSON.stringify(module.moduleCode.body)).digest('hex')) return null;
      const returnValue = {
        name: module.moduleId,
        extension: module.tags.includes('jsx') ? 'jsx' : 'js',
        code: generator({
          ...module.originalFile.program,
          type: 'Program',
          body: module.moduleCode.body,
        }).code,
      };
      if (!argValues.noEslint && !argValues.unpackOnly) {
        try {
          const lintedCode = await eslint.lintText(returnValue.code);
          returnValue.code = lintedCode[0].output ?? returnValue.code;
        } catch (e) {}
      }
      if (!argValues.noPrettier) {
        try {
          returnValue.code = prettier.format(returnValue.code, { parser: 'babel', singleQuote: true, printWidth: 180 });
        } catch (e) {}
      }
      progressBar.increment();
      return returnValue;
    }));

    progressBar.stop();
    console.log(`Took ${performance.now() - startTime}ms`);
    startTime = performance.now();
    console.log('Saving...');
    progressBar.start(0, nonIgnoredModules.length);

    generatedFiles.forEach((file) => {
      if (file == null) return;
      const filePath = `${argValues.out}/${file.name}.${file.extension}`;
      if (!fsExtra.existsSync(filePath) || fsExtra.readFileSync(filePath, 'utf-8') !== file.code) {
        fsExtra.writeFileSync(filePath, file.code);
      }
      progressBar.increment();
    });
    modules.forEach((m) => {
      if (!m.isStatic) return;
      const filePath = `${argValues.out}/${m.moduleId}.${m.tags.includes('css') ? 'css' : '?'}`;
      if (!fsExtra.existsSync(filePath) || fsExtra.readFileSync(filePath, 'utf-8') !== m.staticContent) {
        fsExtra.writeFileSync(filePath, m.staticContent);
      }
    });

    progressBar.stop();

    if (!fsExtra.existsSync(cacheFileName) || !argValues.agressiveCache) {
      console.log('Writing to cache...');
      await new CacheParse(argValues).writeCache(cacheFileName, modules);
    }

    console.log(`Took ${performance.now() - startTime}ms`);
    console.log('Done!');
  } catch (e) {
    console.error(`${chalk.red('[!]')} Error occurred! You should probably report this.`);
    console.error(e);
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start();
