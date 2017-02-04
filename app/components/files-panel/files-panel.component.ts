// File: files-panel.component.ts
// Created by: Daniel James
// Date created: December 1, 2016
//
// Contributors: CJ Dimaano
//


import { Component, Input } from "@angular/core";
import { FileService } from "../../services/files.service";
import { CollapsibleListComponent } from "../collapsible-list/collapsible-list.component";


@Component({
    selector: "sinap-files-panel",
    templateUrl: "./files-panel.component.html",
    styleUrls: ["../../styles/side-panel.component.css"],
    providers: [FileService]
})
export class FilesPanelComponent {

    private fullPath?: string;
    private directory?: string;
    private files: string[] = [];
    private openFiles: string[] = [];

    @Input("directory")
    setDirectory(value: string | null) {
        if (value) {
            this.fullPath = this.fileService.resolve(value);
            this.directory = this.fullPath.split(this.fileService.sep).pop();
            this.fileService.readDirectory(this.fullPath)
                .then((data: { directories: string[], files: string[] }) => {
                    data.directories.sort();
                    data.files.sort();
                    this.files = data.files;
                });
        }
        else {
            this.fullPath = undefined;
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
