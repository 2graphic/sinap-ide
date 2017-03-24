# Project: Sinap
### Authors: Sheyne Anderson, CJ Dimaano, Dyllon Gagnier, Daniel James
#### Date created: October 10, 2016


## Getting Started

Navigate to the project root directory before running any commands. E.g.: `cd /path/to/sinap-ide`   
Download all the dependencies with `npm install` and build the vendor DLL with `npm run build:dll`
> Note: Everytime you update angular or other dependencies in `vendors.ts`, or clean out the build directory, you should rebuild the DLL with `npm run build:dll` 


To build the project use: `npm run build`  
You can watch for file changes and quickly rebuild using: `npm run build:watch`  
Quickly run the project without packaging it with: `npm run start`   
To build and package the apps inside of electron use: `node package.js`

In order to build for a single platform, simply run `node package.js PLATFORM` where PLATFORM is one of "linux", "win32" (Windows), "darwin" (OSX), "mas", or "all" for all systems (default). For debugging capabilities, run `node package.js PLATFORM debug`.

> Note: There are some combinations of these such as `npm run build:start`, `npm run build:watch:start`, `npm run clean`, etc... Refer to `package.json` for a list of all available scripts.

### System Dependencies

You must have a version of npm >= 4.2 and a version of node >= 6.9.1.

## Starting Points
`app/index.ts` = Starting point for Electron application.  
`app/main.ts` = Starting point for Angular 2 application.  
`app/main.module.ts` = Our module for the Sinap IDE  
`app/vendors.ts` = Import all libraries we're using. These are built into a Webpack DLL with `npm run build:dll`
