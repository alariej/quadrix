const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

const createWindow = () => {

    mainWindow = new BrowserWindow({
        width: 1024,
        height: 720,
        autoHideMenuBar: true,
        resizable: false,
        frame: true,
        movable: true,
        backgroundColor: 'black',
        // icon: path.join(__dirname, 'dist-web', 'resources', 'images', 'logo.png'), // linux
        // icon: path.join(__dirname, 'dist-web', 'resources', 'images', 'logo.ico'), // windows
        icon: path.join(__dirname, 'dist-web', 'resources', 'images', 'logo.icns'), // mac
        webPreferences: {
            nodeIntegration: true, // not used in electron v12
            contextIsolation: false, // required in electron v12
            enableRemoteModule: true,
        }
    });

    const menuTemplate = [
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
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);

    Menu.setApplicationMenu(menu);

    // mainWindow.loadURL('http://localhost:9999').catch(_error => null);
    mainWindow.loadFile('dist-web/index.html').catch(_error => null);
    // mainWindow.webContents.openDevTools()

    mainWindow.on('close', event => {
        event.preventDefault();

        if (mainWindow) {
            mainWindow.webContents.send('storeDataAndCloseApp') // eslint-disable-line
        } else {
            app.quit();
        }
    });
}

app.whenReady()
    .then(_response => { createWindow() })
    .catch(_error => null);

/* 
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) { createWindow() }
});
*/

ipcMain.on('closeApp', () => {
    if (mainWindow) { mainWindow.removeAllListeners('close') } // eslint-disable-line
    mainWindow = undefined;
    app.quit();
});
