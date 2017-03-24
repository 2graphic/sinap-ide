// File: files-panel.component.ts
// Created by: Daniel James
// Date created: December 1, 2016
//
// Contributors: CJ Dimaano
//


import { Component, Input, EventEmitter, Output, ViewChild } from "@angular/core";
import { LocalFileService, LocalFile, LocalDirectory } from "../../services/files.service";
import { CollapsibleListComponent } from "../collapsible-list/collapsible-list.component";
import { Directory } from "sinap-core";


@Component({
    selector: "sinap-files-panel",
    templateUrl: "./files-panel.component.html",
    styleUrls: ["./files-panel.component.scss"],
    providers: [LocalFileService]
})
export class FilesPanelComponent {
    private directory?: Directory;
    private files: LocalFile[] = [];
    private openFiles: LocalFile[] = [];

    @ViewChild('filesList') filesList: CollapsibleListComponent;

    @Output()
    openFile = new EventEmitter<LocalFile>();

    @Input()
    set selectedFile(file: LocalFile | undefined) {
        if (file) {
            const found = this.files.find((f) => file.equals(f));
            this.filesList.selectedIndex = found ? this.files.indexOf(found) : -1;
        } else {
            this.filesList.selectedIndex = -1;
        }
    }

    @Input("directory")
    setDirectory(value: string | null) {
        return new Promise<string[]>((resolve, reject) => {
            if (value) {
                this.fileService.directoryByName(value)
                    .then((directory: Directory) => {
                        console.log(directory, directory instanceof LocalDirectory);

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
                this.directory = undefined;
                this.files = [];
            }
        });
    }

    itemSelected(list: CollapsibleListComponent) {
        const file = this.files[list.selectedIndex];
        this.openFile.emit(file);
    }

    constructor(private fileService: LocalFileService) {
        // TODO: Keep this in sync with the directory for a loaded file, and remember last opened directory.
        this.setDirectory("./examples").catch(() => {
            this.setDirectory(".");
        });
    }
}
