import { Injectable, NgZone } from '@angular/core';

import { remote, ipcRenderer } from 'electron';
let { Menu, MenuItem, app } = remote;

@Injectable()
export class MenuService {
    private eventListeners: MenuEventListener[] = [];

    constructor(private _ngZone: NgZone) {
        // Initialize the system Menu
        let menu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(menu);

        ipcRenderer.on("new", () => this.callEvent(MenuEvent.NEW_FILE));
        ipcRenderer.on("save", () => this.callEvent(MenuEvent.SAVE_FILE));
        ipcRenderer.on("load", () => this.callEvent(MenuEvent.LOAD_FILE));
    }

    private callEvent(e: MenuEvent) {
        this._ngZone.run(() => {
            this.eventListeners.forEach((listener) => {
                listener.menuEvent(e);
            });
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
}

export enum MenuEvent {
    NEW_FILE,
    UNDO,
    REDO,
    SAVE_FILE,
    LOAD_FILE
}

export interface MenuEventListener {
    menuEvent: (e: MenuEvent) => void;
}

// This defines the template for our application Menu
// TODO: Might be nice to have this in its own file,
// TODO: Modify based on OS used.
const menuTemplate: any = [
    {
        label: 'Sinap',
        submenu: [
            {
                label: 'About Sinap',
                role: 'about'
            },
            {
                type: 'separator'
            },
            {
                label: 'Services',
                role: 'services',
                submenu: []
            },
            {
                type: 'separator'
            },
            {
                label: 'Hide ' + name,
                accelerator: 'Command+H',
                role: 'hide'
            },
            {
                label: 'Hide Others',
                accelerator: 'Command+Shift+H',
                role: 'hideothers'
            },
            {
                label: 'Show All',
                role: 'unhide'
            },
            {
                type: 'separator'
            },
            {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: function() { app.quit(); }
            },
        ]
    },
    {
        label: 'File',
        submenu: [
            {
                label: 'New',
                accelerator: 'CmdOrCtrl+n',
                click: function(item: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) {
                    focusedWindow.webContents.send("new");
                }
            },
            {
                label: 'Save',
                accelerator: 'CmdOrCtrl+s',
                click: function(item: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) {
                    focusedWindow.webContents.send("save");
                }
            },
            {
                label: 'Load',
                accelerator: 'CmdOrCtrl+o',
                click: function(item: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) {
                    focusedWindow.webContents.send("load");
                }
            }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo'
            },
            {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                role: 'redo'
            },
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click: function(item: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) {
                    if (focusedWindow)
                        focusedWindow.reload();
                }
            },
            {
                label: 'Toggle Full Screen',
                accelerator: (function() {
                    if (process.platform == 'darwin')
                        return 'Ctrl+Command+F';
                    else
                        return 'F11';
                })(),
                click: function(item: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) {
                    if (focusedWindow)
                        focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                }
            },
            {
                label: 'Toggle Developer Tools',
                accelerator: (function() {
                    if (process.platform == 'darwin')
                        return 'Alt+Command+I';
                    else
                        return 'Ctrl+Shift+I';
                })(),
                click: function(item: Electron.MenuItem, focusedWindow: any) { // TODO: toggleDevTools is not a member of BrowserWindow?
                    if (focusedWindow)
                        focusedWindow.toggleDevTools();
                }
            },
        ]
    },
    {
        label: 'Window',
        role: 'window',
        submenu: [
            {
                label: 'Minimize',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            },
            {
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            },
        ]
    },
    {
        label: 'Help',
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: function() { require('electron').shell.openExternal('https://github.com/2graphic/2graphic.github.io') }
            },
        ]
    },
];