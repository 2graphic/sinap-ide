import { remote } from 'electron';
let { app } = remote;

export enum MenuEventAction {
    NEW_FILE,
    UNDO,
    REDO,
    CUT,
    COPY,
    PASTE,
    DELETE,
    SELECT_ALL,
    SAVE_FILE,
    LOAD_FILE,
    CLOSE,
    PREVIOUS_TAB,
    NEXT_TAB,
}

function clickHandlerMake(event: MenuEventAction) {
    let id = remote.getCurrentWindow().id;

    return function(item: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) {
        remote.BrowserWindow.fromId(id).webContents.send("MenuEvent", event);
    };
}

let fileMenu: Electron.MenuItemOptions = {
    label: 'File',
    submenu: [
        {
            label: 'New',
            accelerator: 'CmdOrCtrl+n',
            click: clickHandlerMake(MenuEventAction.NEW_FILE)
        },
        {
            label: 'Save',
            accelerator: 'CmdOrCtrl+s',
            click: clickHandlerMake(MenuEventAction.SAVE_FILE)
        },
        {
            label: 'Load',
            accelerator: 'CmdOrCtrl+o',
            click: clickHandlerMake(MenuEventAction.LOAD_FILE)
        }
    ]
};

let editMenu: Electron.MenuItemOptions = {
    label: 'Edit',
    submenu: [
        {
            label: 'Undo',
            accelerator: 'CmdOrCtrl+z',
            click: clickHandlerMake(MenuEventAction.UNDO)
        },
        {
            label: 'Redo',
            accelerator: 'CmdOrCtrl+' + (process.platform === 'win32' ? 'y' : 'shift+z'),
            click: clickHandlerMake(MenuEventAction.REDO)
        },
        {
            type: 'separator'
        },
        {
            label: 'Cut',
            accelerator: 'CmdOrCtrl+x',
            click: clickHandlerMake(MenuEventAction.CUT)
        },
        {
            label: 'Copy',
            accelerator: 'CmdOrCtrl+c',
            click: clickHandlerMake(MenuEventAction.COPY)
        },
        {
            label: 'Paste',
            accelerator: 'CmdOrCtrl+v',
            click: clickHandlerMake(MenuEventAction.PASTE)
        },
        {
            label: 'Delete',
            accelerator: (process.platform === 'darwin' ? 'Backspace' : 'Delete'),
            click: clickHandlerMake(MenuEventAction.DELETE)
        },
        {
            label: 'Select All',
            accelerator: 'CmdOrCtrl+a',
            click: clickHandlerMake(MenuEventAction.SELECT_ALL)
        },
    ]
};

let viewMenu: Electron.MenuItemOptions = {
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
                if (process.platform === 'darwin')
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
            type: 'separator'
        },
        {
            role: 'resetzoom'
        },
        {
            role: 'zoomin'
        },
        {
            role: 'zoomout'
        },
    ]
};

let windowMenu: Electron.MenuItemOptions = {
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
            click: clickHandlerMake(MenuEventAction.CLOSE)
        },
        {
            label: 'Zoom',
            role: 'zoom'
        },
        {
            type: 'separator'
        },
        {
            label: 'Show Previous Tab',
            accelerator: 'CmdOrCtrl+Shift+Left',
            click: clickHandlerMake(MenuEventAction.PREVIOUS_TAB)
        },
        {
            label: 'Show Next Tab',
            accelerator: 'CmdOrCtrl+Shift+Right',
            click: clickHandlerMake(MenuEventAction.NEXT_TAB)
        },
    ]
};

let helpMenu: Electron.MenuItemOptions = {
    label: 'Help',
    role: 'help',
    submenu: [
        {
            label: 'Learn More',
            click: function() { require('electron').shell.openExternal('https://github.com/2graphic/2graphic.github.io'); }
        },
    ]
};


let menu: [Electron.MenuItemOptions] = [
    fileMenu,
    editMenu,
    viewMenu,
    windowMenu,
    helpMenu
];

/**
 * macOS specific Menu items.
 */
if (process.platform === 'darwin') {
    menu.unshift({
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
                label: 'Hide Sinap',
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
    });

    (windowMenu.submenu as Electron.MenuItemOptions[]).concat([

        {
            type: 'separator'
        },
        {
            label: 'Bring All to Front',
            role: 'front'
        }
    ]);
}

/**
 * Only allow the Developer Tools to be triggered in a development build.
 */
if (process.env.ENV === 'development') {
    let viewSubmenu = viewMenu.submenu;
    if (viewSubmenu && viewSubmenu instanceof Array) {
        viewSubmenu.push({
            role: 'toggledevtools',
        });
    }
}

/**********************************************************************************/

export const MENU_TEMPLATE = menu;