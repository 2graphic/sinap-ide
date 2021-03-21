import {FileInfo, DirectoryInfo} from './file-info';
import {Injectable} from '@angular/core';

class PWAFileInfo implements FileInfo {
    public readonly name: string;

    constructor(public readonly file: any) {
        this.name = file.name;
    };

    toString() {
        return this.name.replace('.sinap', '');
    }

    async save(contents: string) {
        // Create a writer (request permission if necessary).
        const writer = await this.file.createWriter();
        // Make sure we start with an empty file
        await writer.truncate(0);
        // Write the full length of the contents
        await writer.write(0, contents);
        // Close the file and write the contents to disk
        await writer.close();
    }

    async open() {
        const file = await this.file.getFile();
        return await file.text();
    }
}

class PWADirectory implements DirectoryInfo {
    public readonly name: string;

    constructor(public readonly directory: any) {
        this.name = directory.name;
    }

    async getFiles(suffix?: string) {
        const filesIter = this.directory.values();
        const files = [] as FileInfo[];

        while(true) {
            const {value,done} = await filesIter.next();
            if (done) {
                break;
            }
            if (!suffix || value.name.includes(suffix)) {
                files.push(new PWAFileInfo(value));
            }
        }

        return files;
    }
}

const nativeFileSystemAccess = window as Window&{showDirectoryPicker?: any, showSaveFilePicker?: any};
export function isNativeFileSystemAccessEnabled() {
    return !!nativeFileSystemAccess.showDirectoryPicker;
}

@Injectable()
export class PWAFileService {
    private async openFolder() {
        const directory = await nativeFileSystemAccess.showDirectoryPicker();
        return new PWADirectory(directory);
    }

    private async getSaveFile() {
        const opts = {
            accepts: [{
                description: 'Sinap file',
                extensions: ['sinap'],
            }],
        };
        const handle = await nativeFileSystemAccess.showSaveFilePicker(opts);
        return new PWAFileInfo(handle);
    }
}