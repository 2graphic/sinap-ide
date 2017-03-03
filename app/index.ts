// File: index.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// Resources:
// http://electron.atom.io/docs/tutorial/quick-start/
//
// This is the main entry point for Electron.
//



//
// References to app and BrowserWindow are needed in order to start an Electron
// application.
//
import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { ModalInfo, ModalType } from './models/modal-window';

app.setName('Sinap');


/**
 * win
 *   Keeps track of the main window so it does not accidentally get garbage
 *   collected while it is still being used.
 */
let win: Electron.BrowserWindow | null;

/**
 * createWindow
 *   Creates the main application window.
 */
function createWindow() {
    win = new BrowserWindow({
        width: 1150,
        height: 720,
        center: true,
        show: false
    });

    win.loadURL(`file://${__dirname}/index.html`);

    win.on("closed", () => {
        win = null;
    });

    win.maximize();

    win.once("ready-to-show", () => {
        (win as Electron.BrowserWindow).show();
    });
}


//
// Create the window when the application is ready.
//
app.on("ready", () => {
    createWindow();
});


//
// Terminates the application when all windows have been closed.
//
app.on("window-all-closed", () => {
    app.quit();
});




/** Managing Additional Windows **/
// TODO: probs should split this into it's own file.

let childWindows = new Map<Number, [Electron.BrowserWindow, ModalInfo]>();

ipcMain.on('createWindow', (event, selector, type, data) => {
    if (win) {
        event.returnValue = createNewWindow(selector, type, data);
    }
});

ipcMain.on('windowResult', (event, arg: ModalInfo) => {
    if (win) {
        win.webContents.send('windowResult', arg);
    }

    let window = childWindows.get(arg.id);
    if (window) {
        window[0].close();
    }
});

ipcMain.on('getWindowInfo', (event, arg: Number) => {
    let window = childWindows.get(arg);
    event.returnValue = window ? window[1] : null;
});

function createNewWindow(selector: string, type: ModalType, data: any): ModalInfo {
    if (win) {
        let newWindow = new BrowserWindow({
            parent: win,
            modal: (type === ModalType.MODAL),
            width: 600,
            height: 450,
            center: true,
            resizable: false
        });
        if (process.env.ENV === 'production') {
            newWindow.setMenu(null as any);
        }

        let info: ModalInfo = {
            id: newWindow.id,
            selector: selector,
            type: type,
            data: data
        };
        childWindows.set(info.id, [newWindow, info]);

        newWindow.loadURL(`file://${__dirname}/modal.html`);

        newWindow.on("closed", () => {
            childWindows.delete(info.id);
        });

        newWindow.once("ready-to-show", () => {
            newWindow.show();
        });

        return info;
    }

    // This shouldn't ever fail, it can only fail if the main window hasn't been created yet.
    // However if stuff changes and this does fail, I'd rather avoid a null exception.
    return {
        id: -1,
        selector: selector,
        type: type,
        data: undefined
    };
}

/***********************************/