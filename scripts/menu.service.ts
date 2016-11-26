import { Injectable, NgZone } from '@angular/core';

import { remote, ipcRenderer } from 'electron';
let { Menu, MenuItem, app } = remote;

// TODO: Does this need to be a provider to prevent the injector from making mutliple instances of this?
@Injectable()
export class MenuService {
    private delegates:MenuDelegate[] = [];

    constructor( private _ngZone: NgZone) {
        // Initialize the system Menu
        let menu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(menu);

        ipcRenderer.on("new", () => {
            this.newFile();
        });
    }

    private newFile() {
        this._ngZone.run(() => {
            this.delegates.forEach((delegate)=>{
                if (delegate.newFile) {
                    delegate.newFile();
                }
            });
        });
    }

    public setDelegate(obj: MenuDelegate) {
       if (this.delegates.indexOf(obj) < 0) {
           this.delegates.push(obj);
       }
    }

    public removeDelegate(obj: MenuDelegate) {
        var index = this.delegates.indexOf(obj);
        if (index >= 0) {
            this.delegates.splice(index, 1);
        }
    }
}

export interface MenuDelegate {
    newFile?:() => void;
}

// This defines the template for our applicaiton Menu
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
                click: function () { app.quit(); }
            },
        ]
    },
    {
        label: 'File',
        submenu: [
            {
                label: 'New',
                accelerator: 'CmdOrCtrl+n',
                click: function (item, focusedWindow) {
                    focusedWindow.webContents.send("new");
                }
            },
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
                click: function (item, focusedWindow) {
                    if (focusedWindow)
                        focusedWindow.reload();
                }
            },
            {
                label: 'Toggle Full Screen',
                accelerator: (function () {
                    if (process.platform == 'darwin')
                        return 'Ctrl+Command+F';
                    else
                        return 'F11';
                })(),
                click: function (item, focusedWindow) {
                    if (focusedWindow)
                        focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                }
            },
            {
                label: 'Toggle Developer Tools',
                accelerator: (function () {
                    if (process.platform == 'darwin')
                        return 'Alt+Command+I';
                    else
                        return 'Ctrl+Shift+I';
                })(),
                click: function (item, focusedWindow) {
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
                click: function () { require('electron').shell.openExternal('https://github.com/2graphic/2graphic.github.io') }
            },
        ]
    },
];