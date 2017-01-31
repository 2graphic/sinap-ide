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
import { app, BrowserWindow, ipcMain } from "electron";
import { ModalInfo } from './models/modal-window'


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
        icon: require("./images/icons/icon.png"),
        width: 1150,
        height: 720,
        center: true,
        show: false
    });

    win.loadURL(`file://${__dirname}/index.html`);

    win.on("closed", () => {
        win = null
    });

    win.maximize();

    win.once("ready-to-show", () => {
        (win as Electron.BrowserWindow).show();
    })
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
    //if (process.platform !== "darwin") {
    //    app.quit();
    //}


    // It's becoming more common in macOS to just quit the application and 
    // Save state between launches.
    app.quit();
});


//
// Recreates the window if it has been lost while the application was inactive.
// This will likely occur on mobile devices with limited resources.
//
// app.on("activate", () => {
//     if (win === null) {
//         createWindow();
//     }
// });





/** Managing Additional Windows **/
// TODO: probs should split this into it's own file.

var windows = new Map<Number, [Electron.BrowserWindow, ModalInfo]>();

ipcMain.on('createWindow', (event, arg) => {
    event.returnValue = createNewWindow(arg);
});

ipcMain.on('windowResult', (event, arg: ModalInfo) => {
    if (win) {
        win.webContents.send('windowResult', arg);
    }

    var window = windows.get(arg.id);
    if (window) { // TODO: I think there's syntax sugar to make this more readable. 
        window[0].close();
    }
});

ipcMain.on('getWindowInfo', (event, arg: Number) => {
    var window = windows.get(arg);
    event.returnValue = window ? window[1] : null;
});

function createNewWindow(kind: string): Number {
    var newWindow = new BrowserWindow({
        width: 550,
        height: 400,
        center: true,
        show: false,
    });

    var info: ModalInfo = {
        id: newWindow.id,
        kind: kind,
        data: null
    }
    windows.set(info.id, [newWindow, info]);

    console.log(info);

    newWindow.loadURL(`file://${__dirname}/modal.html`);

    newWindow.on("closed", () => {
        windows.delete(info.id);
    });

    newWindow.once("ready-to-show", () => {
        newWindow.show();
    })

    return info.id;
}

/***********************************/