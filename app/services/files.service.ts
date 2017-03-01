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

// TODO: Add in a service that does not use electron for static website.
import { remote } from 'electron';
const fs = remote.require('fs');
const path = remote.require("path");
const { dialog, app } = remote;
const process = remote.require('process');

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
        const currentDirectory = new LocalDirectory(app.getAppPath());
        const pluginDirectory = new LocalDirectory(path.join(app.getPath("userData"), 'plugins'));
        const result: AppLocations = {
            currentDirectory: currentDirectory,
            pluginDirectory: pluginDirectory
        };

        return new Promise<AppLocations>((resolve, reject) => {
            fs.stat(pluginDirectory.fullName, (err: any, stats: any) => {
                ensureNull(err)
                    .then(() => resolve(result))
                    .catch(() => {
                        // TODO: Copy instead of symlink.
                        return this.directoryByName(path.join('.', 'plugins'))
                            .then((concreteDir: LocalDirectory) => concreteDir.copyDirectory(pluginDirectory));
                    })
                    .then(() => resolve(result))
                    .catch((err) => reject(err));
            });
        });
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
                ensureNull(err).then((_) => data).then(resolve).catch(reject);
            });
        });
    }

    writeData(data: string): Promise<{}> {
        return new Promise((resolve, reject) => {
            fs.writeFile(this.fullName, data, makeVoidPromise(resolve, reject));
        });
    }
}

class LocalDirectory implements Directory {
    readonly name: string;

    constructor(readonly fullName: string) {
        this.name = path.basename(fullName);
    }

    public ensureCreated(): Promise<{}> {
        return new Promise<{}>((resolve, reject) => {
            fs.mkdir(this.fullName, makeVoidPromise(resolve, reject));
        });
    }

    public subdirByName(name: string): LocalDirectory {
        return new LocalDirectory(path.join(this.fullName, name));
    }

    public fileByName(name: string): LocalFile {
        return new LocalFile(path.join(this.fullName, name));
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
