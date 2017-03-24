const packager = require("electron-packager");
const ncp = require("ncp").ncp;
const rimraf = require("rimraf");
const webpack = require("webpack");
const dllConfig = require("./webpack.dll.config");
const mainConfig = require("./webpack.config.js");
const fs = require("fs");
const process = require("process");

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

function main() {
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
    const copyStuff = cleanBuild.then(() => Promise.all([copyProm("./package.json", "./build/package.json"), copyProm("./plugins", "./build/plugins")]));

    const buildDll = cleanDll.then(() => webpackProm(dllConfig));
    let env = {
        ENV: "production",
        DEBUG: false
    };
    if (args.length > 3) {
        env.DEBUG = true;
    }

    const mainBuild = Promise.all([cleanBuild, buildDll]).then(() => webpackProm(mainConfig(env)));
    mainBuild.then(() => runPackage(packageOpts)).then(() => {
        deleteDir("./build");
        deleteDir("./dll");
    });
}

main();
