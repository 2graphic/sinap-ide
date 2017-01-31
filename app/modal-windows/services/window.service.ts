// File: window.service.ts
// Created by: Daniel James
// Date created: January 30, 2017
//

import { Injectable, NgZone } from '@angular/core';

import { remote, ipcRenderer } from 'electron';
import { ModalInfo, ModalService } from './../../models/modal-window'

@Injectable()
export class WindowService implements ModalService {
    private callbacks = new Map<Number, (data: any) => void>();
    public windowInfo: ModalInfo | null; // Main window will be null

    constructor(private _ngZone: NgZone) {
        ipcRenderer.on("windowResult", (event, arg) => this.callback(arg as ModalInfo));

        // TODO: sending synchronous IPC here could be a bad idea, a better idea would be to send it async and store windowInfo as a Promise
        this.windowInfo = ipcRenderer.sendSync("getWindowInfo", remote.getCurrentWindow().id);
    }

    public createModal(selector: string): [ModalInfo, Promise<any>] {
        var modal = {
            id: ipcRenderer.sendSync('createWindow', selector) as number,
            selector: selector,
            data: null,
        }

        return [modal, new Promise((resolve, reject) => {
            this.callbacks.set(modal.id, resolve);
        })];
    }

    /**
     * Asks the Electron process to close this window.
     * data can be null, and if so the Promise isn't resolved.
     */
    public closeModal(modal: ModalInfo, data: any | null) {
        if (modal) {
            modal.data = data;
            ipcRenderer.send('windowResult', modal);
        }
    }

    /**
     * Closes the currently open window (wrapper for closeModal)
     */
    public closeWindow(data: any | null) {
        if (this.windowInfo) {
            this.closeModal(this.windowInfo, data);
        }
    }

    /**
     * A helper function for resolving the promises.
     */
    private callback(arg: ModalInfo) {
        var callback = this.callbacks.get(arg.id);
        if (callback) {
            this.callbacks.delete(arg.id);

            var c = callback; // hack
            this._ngZone.run(() => {
                if (arg.data) {
                    c(arg.data);
                } // else cancel or error?   
            });
        }
    }
}