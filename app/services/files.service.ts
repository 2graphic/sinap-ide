import { Injectable, NgZone } from '@angular/core';

// TODO: Add in a service that does not use electron for static website.
import { remote } from 'electron';
const fs = remote.require('fs');
const {dialog} = remote;

@Injectable()
export class FileService {
    constructor() {
    }

    writeFile(filename: string, data: string): Promise<{}> {
        return new Promise((resolve, reject) => {
            fs.writeFile(filename, data, 'utf8', (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    readFile(filename: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(filename, 'utf8', (err: any, data: string) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    requestFilename(forSave: boolean): Promise<string> {
        return new Promise((resolve, reject) => {
            if (forSave) {
                dialog.showSaveDialog({}, resolve);
            } else {
                dialog.showOpenDialog({}, (filenames) => {
                    if (filenames.length == 0) {
                        reject("User selected no files.");
                    } else if (filenames.length > 1) {
                        reject("User selected multiple files.");
                    } else {
                        resolve(filenames[0]);
                    }
                })
            }
        });
    }
}