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
import { app, BrowserWindow } from "electron";


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
        center: true
    });

    win.loadURL(`file://${__dirname}/index.html`);

    win.on("closed", () => {
        win = null
    });

    win.maximize();
}


//
// Create the window when the application is ready.
//
app.on("ready", createWindow);


//
// Terminates the application when all windows have been closed.
//
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});


//
// Recreates the window if it has been lost while the application was inactive.
// This will likely occur on mobile devices with limited resources.
//
app.on("activate", () => {
    if (win === null) {
        createWindow();
    }
});
