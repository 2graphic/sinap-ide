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
    constructor(private _directory: string | undefined) { }

    private _selectedFile: LocalFile | undefined
    = undefined;

    get directory() {
        return this._directory;
    }

    set directory(value: string | undefined) {
        this._directory = value;
        this.directoryChanged.emit(value);
    }

    get selectedFile() {
        return this._selectedFile;
    }

    set selectedFile(value: LocalFile | undefined) {
        this._selectedFile = value;
        this.selectedFileChanged.emit(value);
    }

    readonly directoryChanged
    = new EventEmitter<string | undefined>();

    readonly selectedFileChanged
    = new EventEmitter<LocalFile | undefined>();

    readonly openFile
    = new EventEmitter<LocalFile>();

}

@Component({
    selector: "sinap-files-panel",
    templateUrl: "./files-panel.component.html",
    styleUrls: ["./files-panel.component.scss"],
    providers: [LocalFileService]
})
export class FilesPanelComponent implements PanelComponent<FilesPanelData> {
    constructor(private fileService: LocalFileService) { }

    private _data: FilesPanelData;

    private directory?: Directory;
    private files: LocalFile[] = [];
    private openFiles: LocalFile[] = [];

    set data(value: FilesPanelData) {
        if (value) {
            value.directoryChanged
                .asObservable()
                .subscribe(v => this.updateDirectory(v)
                    .catch(() => value.directory = "."));
            value.selectedFileChanged
                .asObservable()
                .subscribe(this.updateSelectedFile);
            this._data = value;
            this.updateDirectory(value.directory);
            this.updateSelectedFile(value.selectedFile);
        }
    }

    @ViewChild('filesList') filesList: CollapsibleListComponent;

    private updateDirectory = (value?: string) => {
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

    private updateSelectedFile = (value?: LocalFile) => {
        if (value) {
            const found = this.files.find(f => value.fullName === f.fullName);
            this.filesList.selectedIndex = found ? this.files.indexOf(found) : -1;
        } else {
            this.filesList.selectedIndex = -1;
        }
    }

    private itemSelected(list: CollapsibleListComponent) {
        const file = this.files[list.selectedIndex];
        if (this._data)
            this._data.openFile.emit(file);
    }

}
