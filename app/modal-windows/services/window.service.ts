// File: window.service.ts
// Created by: Daniel James
// Date created: January 30, 2017
//

import { Injectable, NgZone } from '@angular/core';

import { remote, ipcRenderer } from 'electron';
import { ModalInfo, ModalService, ModalType } from './../../models/modal-window';
import { NodePromise } from "sinap-core";

@Injectable()
export class WindowService implements ModalService {
    private callbacks = new Map<Number, NodePromise<any>>();
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
        ipcRenderer.on("windowResult", (event, arg) => this.callback(null, arg as ModalInfo));
        ipcRenderer.on("newWindow", (event, arg) => {
            if (this._windowDelegate) {
                this._windowDelegate.newWindow(arg as ModalInfo);
            } else {
                this.queuedWindow = arg as ModalInfo;
            }
        });
        ipcRenderer.on("windowClosed", (event, arg) => this.callback("Window closed early.", arg));
    }

    public createModal(selector: string, type: ModalType, data?: any): [ModalInfo, Promise<any>] {
        const modal: ModalInfo = ipcRenderer.sendSync('createWindow', selector, type, data);
        const result = new NodePromise<any>();
        this.callbacks.set(modal.id, result);

        return [modal, result.promise];
    }

    /**
     * Asks the Electron process to close this window.
     * data can be null, and if so the Promise isn't resolved.
     */
    public closeModal(modal: ModalInfo, data?: any) {
        modal.data = data;
        ipcRenderer.send('windowResult', modal);
    }

    public showWindow(id: number) {
        const w = remote.BrowserWindow.fromId(id);
        if (w) {
            w.show();
        }
    }

    /**
     * A helper function for resolving the promises.
     */
    private callback(err: any, arg: ModalInfo) {
        let callback = this.callbacks.get(arg.id);
        if (callback) {
            this.callbacks.delete(arg.id);

            let c = callback; // hack
            this._ngZone.run(() => {
                c.cb(err, arg.data);
            });
        }
    }
}

export interface WindowDelegate {
    newWindow: (info: ModalInfo) => void;
}