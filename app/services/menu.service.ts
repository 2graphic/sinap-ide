import { Injectable, NgZone } from '@angular/core';

import { remote, ipcRenderer, webFrame } from 'electron';
let { Menu, MenuItem, app } = remote;

import { MENU_TEMPLATE, MenuEventAction } from '../models/menu'

@Injectable()
export class MenuService {
    private eventListeners: MenuEventListener[] = [];

    constructor(private _ngZone: NgZone) {
        // Initialize the system Menu
        let menu = Menu.buildFromTemplate(MENU_TEMPLATE);
        Menu.setApplicationMenu(menu);

        // Prevent users from incrementing the visual zoom (only regular zoom.)
        webFrame.setVisualZoomLevelLimits(1, 1);

        let id = remote.getCurrentWindow().id;;

        ipcRenderer.on("MenuEvent", (event, action: MenuEventAction) => {
            if (remote.BrowserWindow.getFocusedWindow().id == id) {
                this.callEvent(action);
            } else {
                this.getDefaultAction(action)();
            }
        });
    }

    private callEvent(action: MenuEventAction) {
        this._ngZone.run(() => {
            let event = new MenuEvent(action);

            this.eventListeners.forEach((listener) => {
                listener.menuEvent(event);
            });

            if (!event._preventDefault) {
                this.getDefaultAction(action)();
            }
        });
    }

    public addEventListener(obj: MenuEventListener) {
        if (this.eventListeners.indexOf(obj) < 0) {
            this.eventListeners.push(obj);
        }
    }

    public removeEventListener(obj: MenuEventListener) {
        var index = this.eventListeners.indexOf(obj);
        if (index >= 0) {
            this.eventListeners.splice(index, 1);
        }
    }

    /**
     * If using 'role' in the menu template, you shouldn't need to supply a default action.
     */
    private getDefaultAction(action: MenuEventAction): () => void {
        function getWebContents() {
            if (remote.getCurrentWebContents().isDevToolsFocused()) {
                return remote.getCurrentWebContents().devToolsWebContents;
            } else {
                return remote.getCurrentWebContents();
            }
        }

        function makeAction(selector: string): () => void {
            if (process.platform === 'darwin') {
                return () => {
                    // this function expects a ObjC method selector ie 'copy:' not 'copy'
                    Menu.sendActionToFirstResponder(selector + ":");
                }
            } else {
                return (getWebContents() as any)[selector];
            }
        }

        switch (action) {
            case MenuEventAction.UNDO:
                return makeAction("undo");
            case MenuEventAction.REDO:
                return makeAction("redo");
            case MenuEventAction.CUT:
                return makeAction("cut");
            case MenuEventAction.COPY:
                return makeAction("copy");
            case MenuEventAction.PASTE:
                return makeAction("paste");
        }

        return () => { };
    }
}

export class MenuEvent {
    _preventDefault = false;
    constructor(public readonly action: MenuEventAction) { }

    public preventDefault() {
        this._preventDefault = true;
    }
}

export interface MenuEventListener {
    menuEvent: (e: MenuEvent) => void;
}
