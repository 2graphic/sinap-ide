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
    // Don't pop up while debugging.
    if (win && win.webContents.isDevToolsOpened) {
        timer = setTimeout(killIfUnresponsive, 5000) as any;
        return;
    }

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
