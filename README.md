# React Native Decompiler [ALPHA]
A CLI for React Native that allows you to decompile JS code of Android and IOS.

<!-- Title -->
<p align="center">
<img src="https://raw.githubusercontent.com/nomi9995/react-native-decompiler/HEAD/media/decompileIcon.png" alt="icon" width="150"/>
</p>

**DOES NOT SUPPORT ENCRYPTED/BINARY (FACEBOOK, INSTAGRAM) BUNDLES**

Decompiles React Native `index.android.bundle` JS files. Webpack files too!

Also tries to remove some compilation artifacts (via internal plugins, ESLint, and Prettier) to make it easier to read.

<!-- Body -->

### using npx
```sh
npx react-native-decompiler
```


### using npm
```sh
npm i -g react-native-decompiler
```

```sh
react-native-decompiler

# or you can write blow command

rnd
```

# Usage
Example 1: `npx react-native-decompiler -i ./index.android.bundle -o ./output`

Example 2: `npx react-native-decompiler -i ./main.jsbundle -o ./output`

Example 3: `react-native-decompiler -i ./index.android.bundle -o ./output`

Example 4: `rnd -i ./index.android.bundle -o ./output`

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

# Android
## Extract index.android.bundle from APK

### installation of apktool

#### For Macbook
```
brew install apktool
```

#### For Linux
```
apt-get install -y apktool
```

#### For Window

you can read installion step for window [DOCS](https://ibotpeaches.github.io/Apktool/install/ "DOCS")

after install `apktool`, unzip apk file by run this command on terminal like this:

```
apktool  d /pathOfApkFile.apk
```

After that you will get `index.android.bundle` file at `pathOfApkFile/assets/index.android.bundle`

than you can use `react-native-decompiler` for decompile `index.android.bundle` file
# IOS
## Extract main.jsbundle from IPA
you can unzip `ipa` by unzip command on terminal
```sh
$ unzip AppName.ipa
```
after unzip, you will get `Playload` folder, then you have to copy `main.jsbundle` file.
there are two ways to copy this file as follow below

1. run this command `cp ./Payload/AppName.app/main.jsbundle ./` to get get `main.jsbundle` file

2. Go to `Payload` folder and right click on `AppName.app` and choose `Show Package Contents` then you will find `main.jsbundle` file at root. you can copy this file to any location

after getting `main.jsbundle` you can use `react-native-decompiler` for decompile `main.jsbundle` file

## Valid inputs

The following input formats are currently supported:
- A single `index.android.bundle`/`main.jsbundle` file that contains all modules (most cases for React Native)
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

<!-- Footer -->

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/nomi9995"><img src="https://avatars2.githubusercontent.com/u/36044436?v=4" width="100px;" alt=""/><br /><sub><b>Numan</b></sub></a><br /><a href="https://github.com/nomi9995/react-native-decompiler/commits?author=nomi9995" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!