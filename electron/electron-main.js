/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

const { app, BrowserWindow, Menu, ipcMain, dialog, screen, MenuItem } = require('electron');
const path = require('path');

const disableSpellcheck = {
    en: 'Disable spell checking',
    de: 'Rechtschreibprüfung deaktivieren',
    fr: 'Désactiver la correction orthographique'
}

const enableSpellcheck = {
    en: 'Enable spell checking',
    de: 'Rechtschreibprüfung aktivieren',
    fr: 'Activer la correction orthographique'
}

const selectLanguage = {
    en: 'Select language...',
    de: 'Sprache auswählen...',
    fr: 'Choisir la langue...'
}

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

let appLocale;
let appLanguage;
let spellcheckLabel = '';
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

        const primaryDisplay = screen.getPrimaryDisplay()
        const { width, height } = primaryDisplay.workAreaSize

        mainWindow = new BrowserWindow({
            width: width < height ? width : Math.min(width, 1024),
            height: width < height ? height : Math.min(height, 720),
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
                spellcheck: true
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

        const selectSpellLanguage = () => {

            const menuLanguages = new Menu();

            const languages = ['en-US', 'en-GB', 'de', 'es', 'fr', 'it', 'nl', 'pt', 'sv'];

            // for (const language of mainWindow.webContents.session.availableSpellCheckerLanguages) {
            for (const language of languages) {
                menuLanguages.append(new MenuItem({
                    label: language.toUpperCase(),
                    click: () => mainWindow.webContents.session.setSpellCheckerLanguages([language])
                }));
            }

            menuLanguages.popup();
        }

        const toggleSpellChecking = () => {
            if (mainWindow.webContents.session.spellCheckerEnabled) {
                spellcheckLabel = enableSpellcheck[appLanguage];
                mainWindow.webContents.session.spellCheckerEnabled = false;
            } else {
                spellcheckLabel = disableSpellcheck[appLanguage];
                mainWindow.webContents.session.spellCheckerEnabled = true;
            }
        }

        mainWindow.webContents.on('context-menu', (event, params) => {

            if (!params.isEditable) { return }

            // console.log(params)
            // console.log(mainWindow.webContents.session)

            const menu = new Menu()

            for (const suggestion of params.dictionarySuggestions) {
                menu.append(new MenuItem({
                    label: suggestion,
                    click: () => mainWindow.webContents.replaceMisspelling(suggestion)
                }))
            }

            if (params.dictionarySuggestions.length > 0) {
                menu.append(new MenuItem({
                    type: 'separator'
                }));
            }

            if (process.platform !== 'darwin') {
                menu.append(new MenuItem({
                    label: selectLanguage[appLanguage],
                    click: () => selectSpellLanguage()
                }));
            }

            menu.append(new MenuItem({
                label: spellcheckLabel || disableSpellcheck[appLanguage],
                click: () => toggleSpellChecking()
            }));

            /*
            // Allow users to add the misspelled word to the dictionary
            if (params.misspelledWord) {
                menu.append(
                    new MenuItem({
                        label: 'Add to dictionary',
                        click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
                    })
                )
            }
            */

            menu.popup()
        });

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
        .then(_response => {
            createWindow()

            appLocale = app.getLocale();
            appLanguage = appLocale.slice(0, 2);
            if (!['en', 'de', 'fr'].includes(appLanguage)) { appLanguage = 'en' }

            mainWindow.webContents.session.setSpellCheckerLanguages([appLocale])
        })
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
