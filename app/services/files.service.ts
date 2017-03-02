// File: files.service.ts
// Created by: Dyllon Gagnier
// Date created: January 16, 2017
//
// Contributors: CJ Dimaano
//
// Resources:
// https://nodejs.org/api/fs.html

import { Injectable } from '@angular/core';
import { FileService, AppLocations } from 'sinap-core';

// TODO: Add in a service that does not use electron for static website.
import { remote } from 'electron';
const fs = remote.require('fs');
const path = remote.require("path");
const {dialog} = remote;
const process = remote.require('process');

export interface NamedEntity {
    name: string;
    fullName: string;
}

export interface File extends NamedEntity {
    readData(): Promise<string>;
    writeData(data: string): Promise<{}>;
}

export interface Directory extends NamedEntity {
    getSubDirectories(): Promise<Directory[]>;
    getFiles(): Promise<File[]>;
}

function surroundSync<T>(func: () => T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        try {
            resolve(func());
        } catch (err) {
            reject(err);
        }
    });
}

@Injectable()
export class LocalFileService implements FileService {
    getAppLocations(): Promise<AppLocations> {
        const pluginPath = path.join('.', 'plugins');
        const result: AppLocations = {
            currentDirectory: new LocalDirectory('.'),
            pluginDirectory: new LocalDirectory(pluginPath)
        };

        return Promise.resolve(result);
    }

    joinPath(...paths: string[]): string {
        return path.join(...paths);
    }

    getModuleFile(file: string): string {
        return fs.readFileSync(path.join('node_modules', file), "utf-8") as any;
    }

    getCurrentDirectory(): Promise<Directory> {
        return surroundSync(() => process.cwd());
    }

    fileByName(fullName: string): Promise<File> {
        return surroundSync(() => new LocalFile(fullName));
    }

    directoryByName(fullName: string): Promise<Directory> {
        return surroundSync(() => new LocalDirectory(fullName));
    }

    requestSaveFile(): Promise<File> {
        return new Promise<File>((resolve, reject) => dialog.showSaveDialog({}, (name) => resolve(new LocalFile(name))));
    }

    requestFiles(): Promise<File[]> {
        return new Promise<File[]>((resolve, reject) => {
            const options: any = {
                properties: ['openFile', 'multiSelections']
            };
            dialog.showOpenDialog(options, (filenames: string[]) => resolve(filenames.map((name) => new LocalFile(name))));
        });
    }
}

export class UntitledFile implements File {
    readonly _name?: string;
    readonly _fullName?: string;

    constructor(name?: string) {
        this._name = this._fullName = name;
    }

    get name() {
        return this._name ? this._name : "Untitled";
    }

    get fullName() {
        return this.name;
    }

    toString() {
        return this.name;
    }

    readData(): Promise<string> {
        return Promise.reject("Can't read an Untitled file.");
    }

    writeData(data: string): Promise<{}> {
        return Promise.reject("Not implemented");
    }
}

class LocalFile implements File {
    readonly name: string;

    constructor(readonly fullName: string) {
        this.name = path.basename(fullName);
    }

    toString() {
        return this.name;
    }

    readData(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(this.fullName, "utf-8", (err: any, data: string) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    writeData(data: string): Promise<{}> {
        return new Promise((resolve, reject) => {
            fs.writeFile(this.fullName, data, (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(err);
                }
            });
        });
    }
}

class LocalDirectory implements Directory {
    readonly name: string;

    constructor(readonly fullName: string) {
        this.name = path.basename(fullName);
    }

    private traverseDirectory(): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            fs.readdir(this.fullName, (err: any, names: string[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(names.map((name) => path.join(this.fullName, name)));
                }
            });
        });
    }

    private isDirectory(fullName: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            fs.stat(fullName, (err: any, stats: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stats.isDirectory());
                }
            });
        });
    }

    private traverseDirectoryWithType(): Promise<(LocalFile | LocalDirectory)[]> {
        return this.traverseDirectory()
            .then((names) => {
                return Promise.all(names.map((name) => {
                    return this.isDirectory(name)
                        .then((isDirectory) => {
                            if (isDirectory) {
                                return new LocalDirectory(name);
                            } else {
                                return new LocalFile(name);
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

    getFiles(): Promise<File[]> {
        return this.traverseDirectoryWithType()
            .then((results) => {
                // this is typesafe even though TypeScript doesn't think it is.
                return results.filter((result) => result instanceof LocalFile) as any;
            });
    }
}
