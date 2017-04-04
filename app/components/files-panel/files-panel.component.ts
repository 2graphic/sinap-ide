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
import { LocalFileService, LocalFile, LocalDirectory } from "../../services/files.service";
import { CollapsibleListComponent } from "../collapsible-list/collapsible-list.component";
import { Directory } from "sinap-core";
import { PanelComponent } from "../dynamic-panel/dynamic-panel";


export class FilesPanelData {
    public directory?: Directory;
    public files: LocalFile[] = [];

    constructor(directoryToOpen: string, private fileService: LocalFileService) {
        this.setDirectory(directoryToOpen).catch(() => {
            this.setDirectory(".");
        });
    }

    private _selectedFile: LocalFile | undefined
    = undefined;

    get selectedFile() {
        return this._selectedFile;
    }

    set selectedFile(value: LocalFile | undefined) {
        this._selectedFile = value;
        this.selectedFileChanged.emit(value);
    }

    readonly selectedFileChanged
    = new EventEmitter<LocalFile | undefined>();

    readonly openFile
    = new EventEmitter<LocalFile>();

    private setDirectory(value?: string) {
        return new Promise<string[]>((resolve, reject) => {
            if (value) {
                this.fileService.directoryByName(value)
                    .then((directory: Directory) => {
                        if (directory instanceof LocalDirectory) {
                            directory.exists().then(() => {
                                this.directory = directory;
                                directory.getFiles().then((files: LocalFile[]) => {
                                    this.files = files;
                                    resolve();
                                });
                            }).catch((e) => {
                                reject(e);
                            });
                        } else {
                            reject("not implemented");
                        }
                    });
            }
            else {
                this.directory = undefined;
                this.files = [];
            }
        });
    }
}

@Component({
    selector: "sinap-files-panel",
    templateUrl: "./files-panel.component.html",
    styleUrls: ["./files-panel.component.scss"],
    providers: [LocalFileService]
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

    private updateSelectedFile = (value?: LocalFile) => {
        if (value) {
            const found = this._data.files.find(f => f.equals(value));
            this.filesList.selectedIndex = found ? this._data.files.indexOf(found) : -1;
        } else {
            this.filesList.selectedIndex = -1;
        }
    }

    private itemSelected(list: CollapsibleListComponent) {
        const file = this._data.files[list.selectedIndex];
        if (this._data)
            this._data.openFile.emit(file);
    }
}
