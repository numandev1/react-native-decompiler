# React Native Decompiler [ALPHA]

**DOES NOT SUPPORT ENCRYPTED/BINARY (FACEBOOK, INSTAGRAM) BUNDLES**

Decompiles React Native `index.android.bundle` JS files. Webpack files too!

Also tries to remove some compilation artifacts (via internal plugins, ESLint, and Prettier) to make it easier to read.

# Usage

1. Download
2. `npm i`
3. Build or use ts-node (your choice).

Example command: `node ./out/main.js -i index.android.bundle -o ./output`, `ts-node ./src/main.js -i index.android.bundle -o ./output`

Command params:
- `-i` (required) - input file/folder
- `-o` (required) - the path to the output folder
- `-e` - a module ID, if specified will only decompile that module & it's dependencies.
- `-p` - performance monitoring flag, will print out runtime for each decompiler plugin
- `-v` - verbose flag, does not include debug logging (use `DEBUG=react-native-decompiler:*` env flag for that)
- `--es6` - attempts to decompile to ES6 module syntax.
- `--noEslint` - does not run ESLint after doing decompilation
- `--prettier` - does not run Prettier after doing decompilation
- `--unpackOnly` - only unpacks the app with no other adjustments
- `--decompileIgnored` - decompile ignored modules (modules are generally ignored if they are flagged as an NPM module)
- `--agressiveCache` - skips some cache checks at the expense of possible cache desync
- `--noProgress` - don't show progress bar
- `--debug` - when also given a module ID, will print out that modules code after any plugin handles the app.

## Valid inputs

The following input formats are currently supported:
- A single `index.android.bundle` file that contains all modules (most cases for React Native)
- A folder containing React Native modules (usually called `js-modules`) in "unbundled" apps
- A single Webpack entrypoint bundle file (entrypoint bundles begin with `!function(e)`, chunked bundles start with `window.webpackJsonp`)
- A folder containg Webpack chunks, where at least one file is the entrypoint

# Extending

The decompiler operates on a tagger -> editor -> decompiler system.

* Taggers - Manipulates the module metadata
* Editors - Manipulates the module lines (add, move, or remove).
* Decompilers - Manipulates the module code.

To add a new plugin, add it into the represpective list.

The plugins are initialized per module, so any data you store in your plugins will only persist for the current module.

If your plugin needs to be run before or after other plugins, adjust the ordering in the list, or modify it's pass position.

Guidelines:

* When doing any modifications to the AST, use the NodePath methods.
* When you are only doing reading, directly reading from `.node` is acceptable.