// File: files.service.ts
// Created by: Dyllon Gagnier
// Date created: January 16, 2017
//
// Contributors: CJ Dimaano
//
// Resources:
// https://nodejs.org/api/fs.html

import { Injectable } from '@angular/core';
import { FileService, AppLocations, Directory, File } from 'sinap-core';
import { IS_PRODUCTION } from "../constants";

// TODO: Add in a service that does not use electron for static website.
import { remote } from 'electron';
const fs = remote.require('fs');
const path = remote.require("path");
const { dialog, app } = remote;
const process = remote.require('process');

export const SINAP_FILE_FILTER = [
    { name: 'Sinap Files', extensions: ['sinap'] }
];

export const PLUGIN_DIRECTORY = IS_PRODUCTION ? path.join(app.getAppPath(), "..", "app", "plugins") : "../plugins";

function surroundSync<T>(func: () => T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        try {
            resolve(func());
        } catch (err) {
            reject(err);
        }
    });
}

function makeVoidPromise(resolve: () => void, reject: (err: any) => void): (err: any) => void {
    return (err: any) => {
        if (err) {
            reject(err);
        } else {
            resolve();
        }
    };
}

function ensureNull(shouldBeNull: any): Promise<void> {
    if (shouldBeNull) {
        return Promise.reject(shouldBeNull);
    } else {
        return Promise.resolve();
    }
}

@Injectable()
export class LocalFileService implements FileService {
    getAppLocations(): Promise<AppLocations> {
        const pluginDirectory = IS_PRODUCTION ?
            new LocalDirectory(PLUGIN_DIRECTORY) :
            new LocalDirectory("./plugins");

        const result: AppLocations = {
            currentDirectory: new LocalDirectory("."),
            pluginDirectory: pluginDirectory
        };

        return pluginDirectory.ensureCreated().then(() => result);
    }

    joinPath(...paths: string[]): string {
        return path.join(...paths);
    }

    getModuleFile(file: string): string {
        try {
            return fs.readFileSync(path.join('node_modules', file), "utf-8") as any;
        } catch (err) {
            return null as any;
        }
    }

    getCurrentDirectory(): Promise<Directory> {
        return surroundSync(() => process.cwd());
    }

    fileByName(fullName: string): Promise<LocalFile> {
        return surroundSync(() => new OpenedFile(fullName));
    }

    directoryByName(fullName: string): Promise<Directory> {
        return surroundSync(() => new LocalDirectory(fullName));
    }

    requestSaveFile(name?: string): Promise<LocalFile> {
        return new Promise<LocalFile>((resolve, reject) => dialog.showSaveDialog(remote.BrowserWindow.getFocusedWindow(), {
            defaultPath: name,
            filters: SINAP_FILE_FILTER
        }, (name) => resolve(new OpenedFile(name))));
    }

    requestFiles(): Promise<LocalFile[]> {
        return new Promise<LocalFile[]>((resolve, reject) => {
            dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
                properties: ['openFile', 'multiSelections'],
                filters: SINAP_FILE_FILTER
            }, (filenames: string[]) => {
                if (filenames) {
                    resolve(filenames.map((name) => new OpenedFile(name)));
                } else {
                    reject(new Error("No files were selected."));
                }
            });
        });
    }
}

export interface LocalFile extends File {
    dirty: boolean;
    markDirty: () => void;
    equals: (file: LocalFile) => boolean;
    getPath: () => string | undefined;
}

class AbstractFile {
    protected _name?: string;
    protected _dirty = false;

    constructor(name?: string) {
        this._name = name;
    }

    get name() {
        return this._name ? this._name : "Untitled";
    }

    get dirty() {
        return this._dirty;
    }

    markDirty() {
        this._dirty = true;
    }

    toString() {
        return this.name.replace(".sinap", "") + (this.dirty ? " ●" : "");
    }
}

export class UntitledFile extends AbstractFile implements LocalFile {
    protected _fullName?: string;

    constructor(name?: string) {
        super(name);
    }

    equals(file: LocalFile) {
        return (this._fullName !== undefined && (path.relative(".", this._fullName) === path.relative(".", file.fullName)));
    }

    getPath() {
        if (this._fullName !== undefined) {
            return this._fullName;
        }

        return undefined;
    }

    get fullName() {
        return this._fullName ? this._fullName : this.name;
    }

    readData(): Promise<string> {
        return Promise.reject("Can't read an Untitled file.");
    }

    writeData(data: string): Promise<{}> {
        return new Promise<LocalFile>((resolve, reject) => {
            const writeFile = () => {
                fs.writeFile(this._fullName, data, (err: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        this._dirty = false;
                        resolve();
                    }
                });
            };

            if (this._fullName) {
                writeFile();
            } else {
                dialog.showSaveDialog(remote.BrowserWindow.getFocusedWindow(), {
                    defaultPath: this.name,
                    filters: SINAP_FILE_FILTER
                }, (name) => {
                    if (name) {
                        this._fullName = name;
                        this._name = path.basename(this._fullName);
                        writeFile();
                    }
                });
            }
        });
    }
}

class OpenedFile extends AbstractFile implements LocalFile {
    constructor(readonly fullName: string) {
        super(path.basename(fullName));
    }

    equals(file: LocalFile) {
        return (path.relative(".", this.fullName) === path.relative(".", file.fullName));
    }

    getPath() {
        return "/" + path.relative("/", this.fullName);
    }

    readData(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(this.fullName, "utf-8", (err: any, data: string) => {
                ensureNull(err).then((_) => data).then(resolve).catch(reject);
            });
        });
    }

    writeData(data: string): Promise<{}> {
        return new Promise((resolve, reject) => {
            fs.writeFile(this.fullName, data, (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    this._dirty = false;
                    resolve();
                }
            });
        });
    }
}

export class LocalDirectory implements Directory {
    readonly name: string;

    constructor(readonly fullName: string) {
        this.name = path.basename(fullName);
    }

    public ensureCreated(): Promise<{}> {
        return new Promise<{}>((resolve, reject) => {
            fs.mkdir(this.fullName, makeVoidPromise(resolve, reject));
        }).catch((err) => {
            if (err.code === "EEXIST") {
                // Directory already exists.
                return Promise.resolve({});
            } else {
                return Promise.reject(err);
            }
        });
    }

    public exists(): Promise<{}> {
        return new Promise<{}>((resolve, reject) => {
            fs.access(this.fullName, fs.F_OK, (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public subdirByName(name: string): LocalDirectory {
        return new LocalDirectory(path.join(this.fullName, name));
    }

    public fileByName(name: string): LocalFile {
        return new OpenedFile(path.join(this.fullName, name));
    }

    public copyDirectory(destination: LocalDirectory): Promise<{}> {
        return destination.ensureCreated().then(() => {
            return this.traverseDirectoryWithType().then((children) => {
                const ops: Promise<{}>[] = children.map((child): Promise<{}> => {
                    if (child instanceof LocalDirectory) {
                        return child.copyDirectory(destination.subdirByName(child.name));
                    } else {
                        return child.readData().then((data) => destination.fileByName(child.name).writeData(data));
                    }
                });

                return Promise.all(ops);
            });
        });
    }

    private traverseDirectory(): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            fs.readdir(this.fullName, (err: any, names: string[]) => {
                ensureNull(err).then((_) => names.map((name) => path.join(this.fullName, name)))
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    private isDirectory(fullName: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            fs.stat(fullName, (err: any, stats: any) => {
                ensureNull(err).then((_) => stats.isDirectory()).then(resolve).catch(reject);
            });
        });
    }

    private traverseDirectoryWithType(): Promise<(OpenedFile | LocalDirectory)[]> {
        return this.traverseDirectory()
            .then((names) => {
                return Promise.all(names.map((name) => {
                    return this.isDirectory(name)
                        .then((isDirectory) => {
                            if (isDirectory) {
                                return new LocalDirectory(name);
                            } else {
                                return new OpenedFile(name);
                            }
                        });
                }));
            });
    }

    getSubDirectories(): Promise<Directory[]> {
        return this.traverseDirectoryWithType()
            .then((results) => {
                // this is typesafe even though TypeScript doesn't think it is.
                return results.filter((result) => result instanceof LocalDirectory) as any;
            });
    }

    getFiles(): Promise<LocalFile[]> {
        return this.traverseDirectoryWithType()
            .then((results) => {
                // this is typesafe even though TypeScript doesn't think it is.
                return results.filter((result) => result instanceof OpenedFile) as any;
            });
    }
}
