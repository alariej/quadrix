/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

let iconFile;
switch (process.platform) {
    case 'darwin':
        iconFile = 'icon.icns';
        break;
    case 'win32':
        iconFile = 'icon.ico';
        break;
    case 'linux':
        iconFile = 'icon.png';
        break;
    default:
        iconFile = 'icon.png';
        break;
}

let mainWindow;

let hasLock = true;
if (process.platform !== 'darwin') {
    const additionalData = { myKey: 'chat.quadrix.electron' };
    hasLock = app.requestSingleInstanceLock(additionalData);
}

if (!hasLock) {

    app.quit();

} else {

    const createWindow = () => {

        mainWindow = new BrowserWindow({
            width: 1024,
            height: 720,
            autoHideMenuBar: true,
            resizable: false,
            frame: true,
            movable: true,
            backgroundColor: '#fff',
            icon: path.join(__dirname, 'build-web', iconFile),
            webPreferences: {
                nodeIntegration: true, // not used in electron v12+
                contextIsolation: false, // required in electron v12+
                enableRemoteModule: true,
            }
        });

        const zoom = {
            label: 'Zoom',
            visible: false,
            acceleratorWorksWhenHidden: true,
            submenu: [
                {
                    label: 'Zoom In',
                    // role: 'zoomIn',
                    accelerator: 'CommandOrControl++',
                },
                {
                    label: 'Zoom Out',
                    // role: 'zoomOut',
                    accelerator: 'CommandOrControl+-',
                },
                {
                    label: 'Zoom Reset',
                    // role: 'resetZoom',
                    accelerator: 'CommandOrControl+0',
                },
            ]
        };

        const edit = {
            label: 'Edit',
            visible: true,
            submenu: [
                {
                    label: 'Cut',
                    accelerator: 'CmdOrCtrl+X',
                    selector: 'cut:'
                },
                {
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    selector: 'copy:'
                },
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    selector: 'paste:'
                },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    selector: 'selectAll:'
                }
            ]
        };

        mainWindow.loadFile('build-web/index.html').catch(_error => null);
        // mainWindow.loadURL('http://localhost:9999').catch(_error => null);
        // mainWindow.webContents.openDevTools()

        mainWindow.on('close', event => {
            event.preventDefault();

            if (mainWindow) {
                mainWindow.webContents.send('storeDataAndCloseApp')
            } else {
                app.quit();
            }
        });

        const topMenu = {
            label: app.getName(),
            submenu: [
                // { role: 'hide' },
                // { role: 'hideothers' },
                // { role: 'unhide' },
                // { type: 'separator' },
                { role: 'quit' }
            ]
        }

        const menuTemplate = [
            topMenu,
            zoom,
            edit
        ];

        const menu = Menu.buildFromTemplate(menuTemplate);

        Menu.setApplicationMenu(menu);
    }

    app.whenReady()
        .then(_response => createWindow() )
        .catch(_error => null);

    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) { mainWindow.restore(); }
            mainWindow.focus();
        }
    });

    ipcMain.handle('getLocale', () => { return app.getLocale() });

    ipcMain.handle('getPath', (_event, dir) => { return app.getPath(dir) });

    ipcMain.on('showSaveDialog', (event, options) => {
        event.returnValue = dialog.showSaveDialogSync(options);
    });

    ipcMain.on('closeApp', () => {
        if (mainWindow) { mainWindow.removeAllListeners('close') }
        mainWindow = undefined;
        app.quit();
    });
}
