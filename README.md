[![Build Status](https://travis-ci.org/2graphic/sinap-ide.svg?branch=master)](https://travis-ci.org/2graphic/sinap-ide)

# Project: Sinap
[https://2graphic.github.io/](https://2graphic.github.io/)  
Created October 10, 2016

![Example BFS](https://2graphic.github.io/assets/tutorial/007_example_editing.png)

Founded by:
* Sheyne Anderson
* CJ Dimaano
* Dyllon Gagnier
* Daniel James


## Command Line Tools
[Sinap-CLI](https://www.github.com/2graphic/sinap-cli) provides command line tools that operate on Sinap plugins and graph files.

Installing Sinap-CLI:

    npm install -g sinap-cli

Sinap-CLI example:

    $ sinap-run plugins/nfa examples/SimpleNFA.sinap 111222
    true

More information can be found at [sinap-cli](https://www.github.com/2graphic/sinap-cli).

## Building and running Sinap-IDE

### Step 1: Installing npm
Sinap-IDE is developed using [Typescript](https://www.typescriptlang.org/), [Angular4](https://angular.io/), and [npm](https://www.npmjs.com/).
Make sure you have npm version 4.2 or greater installed:

    npm -v

If you don't have npm installed, you can find it along with nodejs here:

[https://nodejs.org/en/download/](https://nodejs.org/en/download/)

### Step 2: Installing dependencies and building
Navigate to the project root directory:

    cd /path/to/sinap-ide

Install dependencies:

    npm install

Build the vendor DLL:

    npm run build:dll

> Note: Every time dependencies in `vendor.ts` are updated or the build directory is cleaned out, the vendor DLL must be rebuilt.

Build the project:

    npm run build

It may be more convenient to have continuous building while actively coding:

    npm run build:watch

This rebuilds the project any time one of the source files is changed.

### Step 3: Running the development build
Run the development build with:

    npm start

> Note: other npm scripts exist such as `npm run build:start`, `npm run clean`, etc.
> Refer to `package.json` for a list of available npm scripts.

> Note: cloning the Sinap-IDE repository does not come bundled with any plugins. To include some of the plugins available from 2graphic, use git submodule.
> ```
> git submodule init
> git submodule update
> ```

## Packaging Sinap-IDE
Packaging Sinap-IDE requires at least nodejs 7.
Check your version of nodejs before attempting to package:

    node -v

If you don't have nodejs or don't have the correct version,
see the notes in Step 1 of [Building and running Sinap-IDE](#building-and-running-sinap-ide).

Package Sinap-IDE for deployment with:

    node package.js

This builds and packages production versions of Sinap-IDE for Linux, Mac, and Windows.
To package Sinap-IDE for a particular OS, use:

    node package.js PLATFORM

where `PLATFORM` is one of `linux`, `win32` (Windows), `darwin` (OSX), `mas`, or `all` (default).

> Note: it is possible to package Sinap-IDE with debugging but not recommended.
> Use the following to package with debugging:
> ```
> node package.js PLATFORM debug
> ```

# Development Notes

## Starting Points
`app/index.ts` = Starting point for Electron application.  
`app/main.ts` = Starting point for Angular 2 application.  
`app/main.module.ts` = Our module for the Sinap IDE  
`app/vendors.ts` = Import all libraries we're using. These are built into a Webpack DLL with `npm run build:dll`
