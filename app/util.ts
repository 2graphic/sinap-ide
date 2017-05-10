import * as fs from "fs";
import * as path from "path";
import { NodePromise, readdir, Program, ElementType, Plugin } from "sinap-core";
import { Value, Type } from "sinap-types";
import { SINAP_FILE_FILTER, ZIP_FILE_FILTER } from "./constants";
import * as zlib from "zlib";

import { remote } from "electron";
const { dialog } = remote;

import * as archiver from "archiver";
import * as tmp from "tmp";
import * as extract from "extract-zip";
import * as rimraf from "rimraf";



export function getInput(program: Program) {
    return getFromType(program, program.plugin.types.arguments[0]);
}

function getFromType(program: Program, type: Type.Type) {
    let inputForPlugin: Value.Value | undefined = undefined;

    if (type instanceof Value.MapType && isNodeType(program.plugin, type.keyType)) {
        const filtered = [...program.model.nodes.values()].filter((n) => Type.isSubtype(n.type, type.keyType));
        if (filtered.length === 0) {
            return undefined;
        }
        const map = program.model.environment.make(type) as Value.MapObject;
        filtered.forEach((n) => {
            map.set(n, program.model.environment.make(type.valueType));
        });
        return map;
    }

    if (isNodeType(program.plugin, type)) {
        inputForPlugin = program.model.nodes.values().next().value;
        return inputForPlugin;
    }


    return program.model.environment.make(type);
}

export function isNodeType(plugin: Plugin, type: Type.Type) {
    return [...plugin.types.nodes.types.values()].find((t) => Type.isSubtype(type, t.pluginType));
}

export function getExpected(program: Program) {
    return getFromType(program, program.plugin.types.result);
}



// Similar to Promise.all. However, this will always resolve and ignore rejected promises.
export async function somePromises<T>(promises: Iterable<Promise<T>>, logger: Logger): Promise<T[]> {
    const arr = [] as T[];
    for (const promise of promises) {
        try {
            arr.push(await promise);
        } catch (err) {
            logger.log(err);
        }
    }
    return Promise.resolve(arr);
}

export function getPath(name: string) {
    return path.resolve(path.normalize(name));
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
export async function dirFiles(dir: string): Promise<string[]> {
    return readdir(dir).then(names => promFilter(names, name =>
        fileStat(path.join(dir, name)).then(stats => stats.isFile())));
}

export async function dirFullFiles(dir: string): Promise<string[]> {
    return readdir(dir)
        .then(names => names.map(name => path.join(dir, name)))
        .then(names => promFilter(names, name =>
            fileStat(name).then(stats => stats.isFile())));
}

export function requestSaveFile(name?: string, filters = SINAP_FILE_FILTER): Promise<string> {
    const result = new NodePromise<string>();
    dialog.showSaveDialog(remote.BrowserWindow.getFocusedWindow(), {
        defaultPath: name,
        filters: filters
    }, name => result.cb(name ? null : "File selection cancelled", name));
    return result.promise;
}

export function requestFiles(name?: string, filters = SINAP_FILE_FILTER): Promise<string[]> {
    const result = new NodePromise<string[]>();
    dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        properties: ["openFile", "multiSelections"],
        filters: filters,
        defaultPath: name
    }, names => result.cb(names ? null : "File selection cancelled", names));
    return result.promise;
}

export async function requestOpenDirs(name?: string): Promise<string[]> {
    const result = new NodePromise<string[]>();
    dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        properties: ["openDirectory"],
        defaultPath: name
    }, names => result.cb(names ? null : "Directory selection cancelled", names));

    return await result.promise;
}

export async function requestDirectory(): Promise<string[]> {
    const result = new NodePromise<string[]>();
    dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        properties: ["openDirectory"],
    }, names => result.cb(names ? null : "Directory selection cancelled", names));

    return await result.promise;
}

export async function copyFile(src: string, dest: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let cbCalled = false;
        function done(err: any) {
            if (!cbCalled) {
                reject(err);
                cbCalled = true;
            }
        }

        const readStream = fs.createReadStream(src);
        readStream.on("err", done);

        const writeStream = fs.createWriteStream(dest);
        writeStream.on("err", done);
        writeStream.on("close", (_: any) => resolve());

        readStream.pipe(writeStream);
    });
}

export async function copy(src: string, dest: string): Promise<any> {
    const srcStats = await fileStat(src);
    if (srcStats.isDirectory()) {
        try {
            await fileStat(dest);
        } catch (err) {
            if (err.code === "ENOENT") {
                await createDir(dest);
            } else {
                throw err;
            }
        }

        const children = await readdir(src);
        await Promise.all(children.map(child => copy(path.join(src, child), path.join(dest, child))));
    } else if (srcStats.isFile()) {
        const name = path.basename(src);
        if (path.basename(dest) !== name) {
            dest = path.join(dest, name);
        }
        copyFile(src, dest);
    }
}

export function zipFiles(src: string, dest: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const output = fs.createWriteStream(dest);
        const result = archiver("zip", {
            zlib: { level: zlib.constants.Z_BEST_COMPRESSION }
        });

        output.on("close", () => resolve());
        result.on("error", reject);

        result.pipe(output);
        result.directory(src, path.basename(src));
        result.finalize();
    });
}

export function unzip(src: string, dest: string): Promise<void> {
    return new Promise<void>((resolve, reject) => extract(src, { dir: dest }, err => {
        if (err) reject(err);
        else resolve();
    }));
}

export interface Closeable {
    close(): Promise<any>;
}

export class TempDir implements Closeable {
    constructor(public readonly path: string) {
    }

    close(): Promise<void> {
        return removeDir(this.path);
    }
}

export function closeAfter(prom: Promise<any>, toClose: Closeable) {
    prom.then(_ => toClose.close()).catch(_ => toClose.close());
}

export function tempDir(): Promise<TempDir> {
    const result = new NodePromise<TempDir>();
    tmp.dir((err, path) => result.cb(err, new TempDir(path)));
    return result.promise;
}

export class Logger {
    constructor(public readonly domain: string) {
    }

    createMessage(original?: string) {
        return `${this.domain}: ${original}`;
    }

    assert(value: any, message?: any, ...args: any[]): void {
        console.assert(value, this.createMessage(message), ...args);
    }

    dir(obj: any) {
        console.log({
            logger: this.domain,
            data: obj
        });
    }

    error(data?: any, ...args: any[]): void {
        console.error(this.createMessage(data), ...args);
    }

    info(data?: any, ...args: any[]): void {
        console.info(this.createMessage(data), ...args);
    }

    log(data?: any, ...args: any[]): void {
        console.log(this.createMessage(data), ...args);
    }

    private timeLabel(label: string): string {
        return `${this.domain}.${label}`;
    }

    time(label: string): void {
        console.time(this.timeLabel(label));
    }

    timeEnd(label: string): void {
        console.timeEnd(this.timeLabel(label));
    }

    trace(message?: any, ...args: any[]): void {
        console.trace(this.createMessage(message), ...args);
    }

    warn(data?: any, ...args: any[]): void {
        console.warn(this.createMessage(data), ...args);
    }
}

export class NullLogger extends Logger {
    assert(value: any, message?: any, ...args: any[]): void {
        console.assert(value, this.createMessage(message), ...args);
    }

    dir(obj: any) {
        console.log({
            logger: this.domain,
            data: obj
        });
    }

    error(data?: any, ...args: any[]): void {
        console.error(this.createMessage(data), ...args);
    }

    info(data?: any, ...args: any[]): void {
        console.info(this.createMessage(data), ...args);
    }

    log(data?: any, ...args: any[]): void {
        console.log(this.createMessage(data), ...args);
    }

    time(label: string): void {
    }

    timeEnd(label: string): void {
    }

    trace(message?: any, ...args: any[]): void {
    }

    warn(data?: any, ...args: any[]): void {
    }
}

// This exists so that we can have different loggers/disabled loggers.
const LOGGER_MAP = new Map<string, Logger>();
LOGGER_MAP.set("null", new NullLogger("null"));
export function getLogger(domain: string): Logger {
    let result = LOGGER_MAP.get(domain);
    if (!result) {
        LOGGER_MAP.set(domain, new Logger(domain));
    }
    return LOGGER_MAP.get(domain)!;
}

export function removeDir(dir: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        rimraf(dir, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
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

export function createDir(name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => fs.mkdir(name, err => {
        if (err) reject(err);
        else resolve();
    }));
}

export async function ensureDir(name: string): Promise<void> {
    try {
        await fileStat(name);
    } catch (err) {
        if (err.code === "ENOENT") {
            await createDir(name);
        } else {
            throw err;
        }
    }
}

export function sleep(time: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => resolve(), time);
    });
}
