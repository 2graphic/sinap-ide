// File: new-file.component.ts
// Created by: Daniel James
// Date created: January 17, 2017


import { Component, Input } from "@angular/core";
import { WindowService } from "./../../modal-windows/services/window.service";
import { ModalInfo, ModalComponent } from "./../../models/modal-window";

export class NewFile {
    constructor(readonly name: string, readonly kind: string[]) {
    }
}

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

    private plugins: string[][];
    private selectedPlugin: string[];

    constructor(private windowService: WindowService) {
        // TODO: if we want to use a different ModalService then
        // when this component is created it needs to be passed a ModalInfo so
        // it can close itself.
    };

    ngOnInit() {
        this.selectedPlugin = this.plugins[0];
    }

    public createNewFile(filename: string) {
        if (filename) {
            this.windowService.closeWindow(new NewFile(filename, this.selectedPlugin));
        }
    }

    public cancel() {
        this.windowService.closeWindow();
    }
}
