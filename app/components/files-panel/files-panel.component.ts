// File: files-panel.component.ts
// Created by: Daniel James
// Date created: December 1, 2016
//
// Contributors: CJ Dimaano
//


import { Component, Input, EventEmitter, Output, ViewChild } from "@angular/core";
import { LocalFileService } from "../../services/files.service";
import { CollapsibleListComponent } from "../collapsible-list/collapsible-list.component";
import { File as SinapFile, Directory } from "sinap-core";


@Component({
    selector: "sinap-files-panel",
    templateUrl: "./files-panel.component.html",
    styleUrls: ["./files-panel.component.scss"],
    providers: [LocalFileService]
})
export class FilesPanelComponent {
    private directory?: Directory;
    private files: SinapFile[] = [];
    private openFiles: string[] = [];

    @ViewChild('filesList') filesList: CollapsibleListComponent;

    @Output()
    openFile = new EventEmitter<SinapFile>();

    @Input()
    set selectedFile(file: SinapFile | undefined) {
        this.filesList.selectedIndex = file ? this.files.indexOf(file) : -1;
    }

    @Input("directory")
    setDirectory(value: string | null) {
        if (value) {
            this.fileService.directoryByName(value)
                .then((directory: Directory) => {
                    this.directory = directory;
                    directory.getFiles().then((files: SinapFile[]) => {
                        this.files = files;
                    });
                });
        }
        else {
            this.directory = undefined;
            this.directory = undefined;
            this.files = [];
        }
    }

    itemSelected(list: CollapsibleListComponent) {
        const file = this.files[list.selectedIndex];
        this.openFile.emit(file);
    }

    constructor(private fileService: LocalFileService) {
        // TODO: Keep this in sync with the directory for a loaded file, and remember last opened directory.
        this.setDirectory("./examples");
    }
}
