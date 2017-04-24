const packager = require("electron-packager");
const ncp = require("ncp").ncp;
const rimraf = require("rimraf");
const webpack = require("webpack");
const dllConfig = require("./webpack.dll.config");
const mainConfig = require("./webpack.config.js");
const fs = require("fs");
const exec = require("child_process").exec;
const process = require("process");
const path = require("path");
const glob = require("glob");
const signAsync = require('electron-osx-sign').signAsync;

ncp.limit = 16;

function makeCb(resolve, reject) {
    return (err, obj) => {
        if (err) reject(err);
        else resolve(obj);
    }
}

function deleteDir(dirName) {
    return new Promise((resolve, reject) => rimraf(dirName, makeCb(resolve, reject)));
}

function webpackProm(options) {
    return new Promise((resolve, reject) => webpack(options, makeCb(resolve, reject)));
}

function globProm(options) {
    return new Promise((resolve, reject) => glob(options, makeCb(resolve, reject)));
}

function copyProm(source, destination) {
    return new Promise((resolve, reject) => ncp(source, destination, makeCb(resolve, reject)));
}

function runPackage(options) {
    return new Promise((resolve, reject) => packager(options, makeCb(resolve, reject)));
}

function createDir(path) {
    return new Promise((resolve, reject) => fs.mkdir(path, makeCb(resolve, reject)))
        .catch((err) => {
            if (err.code === "EEXIST") {
                return Promise.resolve();
            } else {
                return Promise.reject(err);
            }
        });
}

function createMultDir(base, ...toMake) {
    let current = Promise.resolve(base);
    let curPath = base;
    for(const part of toMake) {
        const nextPath = path.join(curPath, part)
        current = current.then(() => {
            return createDir(nextPath).then(() => nextPath);
        });
        curPath = nextPath;
    }

    return current;
}

function moveTsFiles(buildLoc) {
    const nodePath = ["node_modules", "typescript", "lib"];
    const srcPath = path.join(".", ...nodePath);
    return createMultDir(buildLoc, ...nodePath).then((destPath) => {
        return copyProm(srcPath, destPath);
    });
}

async function main() {
    const args = process.argv;
    let packageOpts = {
        all: true,
        dir: "./build",
        out: "./dist",
        overwrite: true,
        icon: "./app/images/icons/icon",
        prune: false,
        name: "Sinap"
    };
    if (args.length > 2) {
        packageOpts.platform = args[2];
        packageOpts.all = false;
        packageOpts.arch = "all";
    }

    const cleanBuild = deleteDir("./build").then(() => {createDir("./build")});
    const cleanDll = deleteDir("./dll");
    const cleanDist = deleteDir("./dist");
    const copyStuff = cleanBuild.then(() => Promise.all([
        copyProm("./app/package.json", "./build/package.json"),
        copyProm("./plugins", "./build/plugins"),
        moveTsFiles("./build")]));

    const buildDll = cleanDll.then(() => webpackProm(dllConfig));
    let env = {
        ENV: "production",
        DEBUG: false
    };

    if (args.length > 3) {
        console.log("Debug enabled.");
        env.DEBUG = true;
    }

    await Promise.all([cleanBuild, buildDll]);
    await webpackProm(mainConfig(env));
    await runPackage(packageOpts);
    console.log("Finished building, begining signing");
    if (packageOpts.all || packageOpts.platform === "darwin") {
        await signAsync({app: 'dist/Sinap-darwin-x64/Sinap.app', "keychain": "build.keychain", "provisioning-profile": "Sinap.provisionprofile"});
    }
    console.log("Finished Signing, begining zipping");

    const files = await globProm("dist/*");
    for (const dir of files) {
        exec(`zip --symlinks -r ${dir}.zip ${dir}`);
    }
}

main().then(() => {
    console.log("finished");
});
