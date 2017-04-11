import * as fs from "fs";
import * as path from "path";
import { NodePromise, readdir } from "sinap-core";
import { SINAP_FILE_FILTER } from "./constants";

import { remote } from "electron";
const { dialog } = remote;

// Similar to Promise.all. However, this will always resolve and ignore rejected promises.
export function somePromises<T>(promises: Iterable<Promise<T>>): Promise<T[]> {
    let result: Promise<T[]> = Promise.resolve([]);

    for (const promise of promises) {
        result = result.then((arr) => {
            return promise.then((ele) => {
                arr.push(ele);
                return arr;
            }).catch((err) => {
                console.log(err);
                return arr;
            });
        });
    }

    return result;
}

export function getBasename(name: string, ext?: string) {
    return path.basename(name, ext);
}

export function getPath(name: string) {
    return path.normalize("/" + path.relative("/", name));
}

export function compareFiles(file1: string, file2: string) {
    return getPath(file1) === getPath(file2);
}

export function writeData(file: string, data: string) {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, data, (err: any) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export function fileStat(name: string): Promise<fs.Stats> {
    const result = new NodePromise<fs.Stats>();
    fs.stat(name, result.cb);
    return result.promise;
}

export function promFilter<T>(arr: T[], func: (item: T) => Promise<boolean>): Promise<T[]> {
    return Promise.all(arr.map(func)).then((preds) => {
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            if (preds[i]) result.push(arr[i]);
        }
        return result;
    });
}

// Returns full paths.
export function subdirs(dir: string): Promise<string[]> {
    return readdir(dir)
        .then(names => names.map(name => path.join(dir, name)))
        .then(names => promFilter(names, name => fileStat(name).then(stats => stats.isDirectory())));
}

// Only returns file names.
export function dirFiles(dir: string): Promise<string[]> {
    return readdir(dir)
        .then(names => names.map(name => path.join(dir, name)))
        .then(names => promFilter(names, name => fileStat(name).then(stats => stats.isFile())));
}

export function requestSaveFile(name?: string): Promise<string> {
    const result = new NodePromise<string>();
    dialog.showSaveDialog(remote.BrowserWindow.getFocusedWindow(), {
        defaultPath: name,
        filters: SINAP_FILE_FILTER
    }, name => result.cb(name ? null : "File selection cancelled", name));
    return result.promise;
}

export function requestFiles(name?: string): Promise<string[]> {
    const result = new NodePromise<string[]>();
    dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        properties: ["openFile", "multiSelections"],
        filters: SINAP_FILE_FILTER,
        defaultPath: name
    }, names => result.cb(names ? null : "File selection cancelled", names));
    return result.promise;
}

export function arrayEquals<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
}