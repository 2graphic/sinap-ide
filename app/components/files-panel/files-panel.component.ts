// File: files-panel.component.ts
// Created by: Daniel James
// Date created: December 1, 2016


import { Component, AfterViewInit } from "@angular/core";

import { FileService } from "../../services/files.service";


@Component({
    selector: "sinap-files-panel",
    templateUrl: "./files-panel.component.html",
    styleUrls: ["../../styles/side-panel.component.css"],
    providers: [FileService]
})
export class FilesPanelComponent implements AfterViewInit {
    private directory: string = ".";
    private files: string[] = [];
    constructor(private fileService: FileService) { }
    ngAfterViewInit() {
        this.fileService.readDirectory(this.directory)
            .then((data: { directories: string[], files: string[] }) => {
                data.directories.sort();
                data.files.sort();
                let list = [...data.directories, ...data.files];
                this.files = list;
            })
    }
}
