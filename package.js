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

glob("dist/*", function(er, files){
    for (const dir of files) {
        exec(`zip --symlinks -r ${dir}.zip ${dir}`);
    }
});
