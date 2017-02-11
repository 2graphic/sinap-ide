// File: files-panel.component.ts
// Created by: Daniel James
// Date created: December 1, 2016
//
// Contributors: CJ Dimaano
//


import { Component, Input } from "@angular/core";
import { FileService, LocalFileService, Directory, File } from "../../services/files.service";
import { CollapsibleListComponent } from "../collapsible-list/collapsible-list.component";


@Component({
    selector: "sinap-files-panel",
    templateUrl: "./files-panel.component.html",
    styleUrls: ["../../styles/side-panel.component.css"],
    providers: [LocalFileService]
})
export class FilesPanelComponent {
    private directory?: Directory;
    private files: File[] = [];
    private openFiles: File[] = [];

    @Input("directory")
    setDirectory(value: string | null) {
        if (value) {
            this.fileService.directoryByName(value)
                .then((directory: Directory) => {
                    this.directory = directory;
                    directory.getFiles().then((files: File[]) => this.files = files)
                });
        }
        else {
            this.directory = undefined;
            this.directory = undefined;
            this.files = [];
        }
    }

    constructor(private fileService: FileService) {
        // TODO:
        // Replace this with a button that will ask the user to open a folder.
        this.setDirectory(".");
    }
}
