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
import { dirFullFiles, compareFiles } from "../../util";

import * as path from "path";

class FileInfo {
    public readonly name: string;

    constructor(public readonly file: string) {
        this.name = path.basename(file, ".sinap");
    };

    toString() {
        return this.name;
    }
}

export class FilesPanelData {
    public directory?: string;
    public files: FileInfo[] = [];

    constructor(directoryToOpen: string) {
        this.setDirectory(directoryToOpen).catch(err => {
            console.log(err);
            this.setDirectory(".");
        });
    }

    private _selectedFile: string | undefined = undefined;

    get selectedFile() {
        return this._selectedFile;
    }

    set selectedFile(value: string | undefined) {
        this._selectedFile = value;
        this.selectedFileChanged.emit(value);
    }

    readonly selectedFileChanged = new EventEmitter<string | undefined>();

    readonly openFile = new EventEmitter<string>();

    private setDirectory(value?: string): Promise<void> {
        if (value) {
            return dirFullFiles(value).then(files => {
                this.files = files.filter((file => file.indexOf(".sinap") > -1)).map(file => new FileInfo(file));
            });
        }
        else {
            this.directory = undefined;
            this.files = [];
            return Promise.resolve();
        }
    }
}

@Component({
    selector: "sinap-files-panel",
    templateUrl: "./files-panel.component.html",
    styleUrls: ["./files-panel.component.scss"]
})
export class FilesPanelComponent implements PanelComponent<FilesPanelData> {
    constructor() { }

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

    @ViewChild('filesList') filesList: CollapsibleListComponent;

    private updateSelectedFile = (value?: string) => {
        if (value) {
            const found = this._data.files.find(f => compareFiles(f.file, value));
            this.filesList.selectedIndex = found ? this._data.files.indexOf(found) : -1;
        } else {
            this.filesList.selectedIndex = -1;
        }
    }

    private itemSelected(list: CollapsibleListComponent) {
        const fileInfo = this._data.files[list.selectedIndex];
        if (this._data)
            this._data.openFile.emit(fileInfo.file);
    }
}
