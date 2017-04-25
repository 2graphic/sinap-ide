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
import { app, BrowserWindow, ipcMain, Menu, dialog } from "electron";
import { ModalInfo, ModalType } from './models/modal-window';
import { IS_DEBUG } from "./constants";
import * as process from "process";

app.setName('Sinap');

/**
 * win
 *   Keeps track of the main window so it does not accidentally get garbage
 *   collected while it is still being used.
 */
let win: Electron.BrowserWindow | undefined;

/**
 * createWindow
 *   Creates the main application window.
 */
function createWindow() {
    win = new BrowserWindow({
        width: 1080,
        height: 768,
        minWidth: 640,
        minHeight: 480,
        center: true,
        show: false
    });

    win.loadURL(`file://${__dirname}/index.html`);

    win.on("closed", () => {
        win = undefined;
        app.quit();
    });

    win.webContents.on("crashed", () => {
        console.log("Crashed");
        win = undefined;
        app.quit();
    });

    win.webContents.on("errorInWindow", (e: any) => {
        let result = dialog.showMessageBox({
            type: 'error',
            message: 'There was an error:\n' + e.toString(),
            buttons: ['Exit', 'Reload']
        });

        if (result === 1) {
            if (win) {
                win.webContents.reload();
            }
        }

        if (result === 0) {
            if (win) {
                win.destroy();
                win = undefined;
            }
            app.quit();
        }
    });

    win.on("unresponsive", () => {
        console.log("unresponsive");
        if (win) {
            win.destroy();
            win = undefined;
        }
        app.quit();
    });

    win.once("ready-to-show", () => {
        (win as Electron.BrowserWindow).show();
    });
}


//
// Create the window when the application is ready.
//
app.on("ready", () => {
    createWindow();
    bufferModalWindow();
});


//
// Terminates the application when all windows have been closed.
//
app.on("window-all-closed", () => {
    app.quit();
});

/**
 * Log the error and quit the app. (App is unresposive at this point.)
 */
process.on('uncaughtException', (e: Error) => {
    console.log(e);
    app.exit();
});




function killIfUnresponsive() {
    let result = dialog.showMessageBox({
        type: 'info',
        message: 'The application is unresponsive... reload window?',
        buttons: ['Exit', 'Keep Waiting', 'Reload']
    });

    if (result === 2) {
        if (win) {
            win.webContents.reload();
        }
    }

    if (result === 0) {
        if (win) {
            win.destroy();
            win = undefined;
        }
        app.quit();
    }

    if (result === 1) {
        if (!IS_DEBUG) {
            // Otherwise, you can't debug.
            timer = setTimeout(killIfUnresponsive, 5000) as any;
        }
    }
}
let timer: number | undefined = undefined;
ipcMain.on('heartbeat', () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(killIfUnresponsive, 5000) as any;
});



/** Managing Additional Windows **/
// TODO: probs should split this into it's own file.

let nextModal: Electron.BrowserWindow | undefined;

function bufferModalWindow() {
    const r = nextModal;

    nextModal = new BrowserWindow({
        parent: win,
        modal: true,
        width: 650,
        height: 450,
        center: true,
        resizable: true,
        show: false,
        autoHideMenuBar: true
    });

    nextModal.loadURL(`file://${__dirname}/modal.html`);

    return r;
}

ipcMain.on('createWindow', (event, selector, type, data) => {
    if (win) {
        event.returnValue = createNewWindow(selector, type, data);
    }
});

ipcMain.on('windowResult', (event, arg: ModalInfo) => {
    if (win) {
        win.webContents.send('windowResult', arg);
    }

    const modalWindow = BrowserWindow.fromId(arg.id);

    if (modalWindow) {
        modalWindow.close();
    }
});

function createNewWindow(selector: string, type: ModalType, data: any): ModalInfo {
    const modalWindow = bufferModalWindow();
    if (win && modalWindow) {
        let info: ModalInfo = {
            id: modalWindow.id,
            selector: selector,
            type: type,
            data: data
        };

        modalWindow.webContents.send("newWindow", info);
        modalWindow.on("closed", () => {
            if (win) {
                win.webContents.send("windowClosed", info);
            }
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