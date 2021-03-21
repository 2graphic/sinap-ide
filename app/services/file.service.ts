import {Injectable} from '@angular/core';
import {FileInfo, DirectoryInfo} from './file-info';

@Injectable()
export class FileService {
    private notAvailableError() {
        alert('Please enable #native-file-system-api in chrome://flags (Chrome 78) to use file system capabilities');
        throw new Error('Not Supported');
    }

    openFolder(): Promise<DirectoryInfo> {
        return this.notAvailableError() as any;
    }
    getSaveFile(): Promise<FileInfo> {
        return this.notAvailableError() as any;
    }
}