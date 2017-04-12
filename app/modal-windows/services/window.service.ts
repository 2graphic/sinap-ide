// File: window.service.ts
// Created by: Daniel James
// Date created: January 30, 2017
//

import { Injectable, NgZone } from '@angular/core';

import { remote, ipcRenderer } from 'electron';
import { ModalInfo, ModalService, ModalType } from './../../models/modal-window';

@Injectable()
export class WindowService implements ModalService {
    private callbacks = new Map<Number, (data: any) => void>();
    private _windowDelegate?: WindowDelegate;

    public set windowDelegate(delegate: WindowDelegate | undefined) {
        this._windowDelegate = delegate;

        if (this._windowDelegate && this.queuedWindow) {
            this._windowDelegate.newWindow(this.queuedWindow);
            this.queuedWindow = undefined;
        }
    }

    private queuedWindow?: ModalInfo;

    constructor(private _ngZone: NgZone) {
        ipcRenderer.on("windowResult", (event, arg) => this.callback(arg as ModalInfo));
        ipcRenderer.on("newWindow", (event, arg) => {
            if (this._windowDelegate) {
                this._windowDelegate.newWindow(arg as ModalInfo);
            } else {
                this.queuedWindow = arg as ModalInfo;
            }
        });
    }

    public createModal(selector: string, type: ModalType, data?: any): [ModalInfo, Promise<any>] {
        let modal: ModalInfo = ipcRenderer.sendSync('createWindow', selector, type, data);

        return [modal, new Promise((resolve, reject) => {
            this.callbacks.set(modal.id, resolve);
        })];
    }

    /**
     * Asks the Electron process to close this window.
     * data can be null, and if so the Promise isn't resolved.
     */
    public closeModal(modal: ModalInfo, data?: any) {
        modal.data = data;
        ipcRenderer.send('windowResult', modal);
    }

    /**
     * A helper function for resolving the promises.
     */
    private callback(arg: ModalInfo) {
        let callback = this.callbacks.get(arg.id);
        if (callback) {
            this.callbacks.delete(arg.id);

            let c = callback; // hack
            this._ngZone.run(() => {
                if (arg.data) {
                    c(arg.data);
                } // else cancel or error?
            });
        }
    }
}

export interface WindowDelegate {
    newWindow: (info: ModalInfo) => void;
}