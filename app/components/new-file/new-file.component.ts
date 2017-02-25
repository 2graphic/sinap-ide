// File: new-file.component.ts
// Created by: Daniel James
// Date created: January 17, 2017


import { Component } from "@angular/core";
import { WindowService } from "./../../modal-windows/services/window.service";


@Component({
    selector: "sinap-new-file",
    templateUrl: "./new-file.component.html",
    styleUrls: ["./new-file.component.scss"],
    providers: [WindowService]
})

export class NewFileComponent {
    constructor(private windowService: WindowService) {
        // TODO: if we want to use a different ModalService then
        // when this component is created it needs to be passed a ModalInfo so
        // it can close itself.
    };

    public createNewFile(filename: string) {
        if (filename) {
            this.windowService.closeWindow(filename);
        }
    }

    public cancel() {
        this.windowService.closeWindow(null);
    }
}
