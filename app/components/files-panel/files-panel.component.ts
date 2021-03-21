/**
 * @file `files-panel.component.ts`
 *   Created on December 1, 2016
 *
 * @author Daniel James
 *   <daniel.s.james@icloud.com>
 *
 * @author CJ Dimaano
 *   <c.j.s.dimaano@gmail.com>
 *
 * @see {@link https://angular.io/docs/ts/latest/cookbook/dynamic-component-loader.html}
 */
import { Component, Input, EventEmitter, Output, ViewChild } from "@angular/core";
import { CollapsibleListComponent } from "../collapsible-list/collapsible-list.component";
import { PanelComponent } from "../dynamic-panel/dynamic-panel";
import {FileInfo, DirectoryInfo} from '../../services/file-info';
import {FileService} from '../../services/file.service';



export class FilesPanelData {
    public directory?: DirectoryInfo;
    public files: FileInfo[] = [];

    constructor() {
    }

    private _selectedFile: FileInfo | undefined = undefined;

    get selectedFile() {
        return this._selectedFile;
    }

    set selectedFile(value: FileInfo | undefined) {
        this._selectedFile = value;
        this.selectedFileChanged.emit(value);
    }

    readonly selectedFileChanged = new EventEmitter<FileInfo | undefined>();
    readonly openFile = new EventEmitter<FileInfo>();
}

@Component({
    selector: "sinap-files-panel",
    templateUrl: "./files-panel.component.html",
    styleUrls: ["./files-panel.component.scss"]
})
export class FilesPanelComponent implements PanelComponent<FilesPanelData> {
    constructor(private fileService: FileService) { }

    private _data: FilesPanelData;

    set data(value: FilesPanelData) {
        if (value) {
            value.selectedFileChanged
                .asObservable()
                .subscribe(this.updateSelectedFile);
            this._data = value;
            this.updateSelectedFile(value.selectedFile);
        }
    }

    private async openFolder() {
        this._data.directory = await this.fileService.openFolder();
        this._data.files = await this._data.directory.getFiles('.sinap');
    }

    @ViewChild('filesList') filesList: CollapsibleListComponent;

    private updateSelectedFile = (file?: FileInfo) => {
        if (file) {
            const found = this._data.files.find(f => f == file);
            this.filesList.selectedIndex = found ? this._data.files.indexOf(found) : -1;
        } else {
            this.filesList.selectedIndex = -1;
        }
    }

    private itemSelected(list: CollapsibleListComponent) {
        const fileInfo = this._data.files[list.selectedIndex];
        if (this._data)
            this._data.openFile.emit(fileInfo);
    }
}
