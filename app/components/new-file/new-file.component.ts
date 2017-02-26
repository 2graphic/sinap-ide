// File: new-file.component.ts
// Created by: Daniel James
// Date created: January 17, 2017


import { Component, Input } from "@angular/core";
import { WindowService } from "./../../modal-windows/services/window.service";
import { ModalInfo, ModalComponent } from "./../../models/modal-window";


@Component({
    selector: "sinap-new-file",
    templateUrl: "./new-file.component.html",
    styleUrls: ["./new-file.component.scss"],
    providers: [WindowService]
})

export class NewFileComponent implements ModalComponent {
    set modalInfo(modalInfo: ModalInfo) {
        this.plugins = modalInfo.data;
    }

    private plugins: any;


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
        this.windowService.closeWindow();
    }
}
