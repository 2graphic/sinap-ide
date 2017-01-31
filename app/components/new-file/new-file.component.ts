// File: new-file.component.ts
// Created by: Daniel James
// Date created: January 17, 2017


import { Component } from "@angular/core";
import { WindowService } from "./../../modal-windows/services/window.service"


@Component({
    selector: "sinap-new-file",
    templateUrl: "./new-file.component.html",
    styleUrls: ["./new-file.component.css"],
    providers: [WindowService]
})

export class NewFileComponent {
    constructor(private windowService: WindowService) { };

    public createNewFile(filename: string) {
        if (filename) {
            this.windowService.closeWindow(filename);
        }
    }

    public cancel() {
        this.windowService.closeWindow(null);
    }
}
