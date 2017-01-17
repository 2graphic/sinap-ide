import { Injectable, NgZone } from '@angular/core';

import { remote, ipcRenderer } from 'electron';
//let { BrowserWindow } = remote;

@Injectable()
export class WindowService {
    private callbacks = new Map<Number, (data: any) => void>();
    public windowInfo: WindowInfo|null; // Main window will be null

    constructor(private _ngZone: NgZone) {
        ipcRenderer.on("windowResult", (event, arg) => this.callback(arg as WindowInfo));
        this.windowInfo = ipcRenderer.sendSync("getWindowInfo", remote.getCurrentWindow().id);
    }

    public createWindow(component: String): Promise<any> {
        return new Promise((resolve, reject) => {
            var id = ipcRenderer.sendSync('createWindow', component) as Number;
            this.callbacks.set(id, resolve);
        });
    }

    /**
     * Asks the Electron process to close this window, 
     * so don't plan on doing much else after calling this.
     * 
     */
    public closeWindow(data: any) {
        if (this.windowInfo) {
            this.windowInfo.data = data;
            ipcRenderer.send('windowResult', this.windowInfo);
        }
    }

    private callback(arg: WindowInfo) {
        var callback = this.callbacks.get(arg.id);
        if (callback) {
            this.callbacks.delete(arg.id);

            var c = callback; // hack
            this._ngZone.run(() => {
                c(arg.data);
            });
        }
    }
}

export interface WindowInfo {
    readonly id: Number;
    readonly kind: String;
    data: any;
}