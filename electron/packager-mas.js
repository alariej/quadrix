/* eslint-disable */
const packager = require('electron-packager');
const setLanguages = require('electron-packager-languages');
const package = require('../package.json');

const options = {
    dir: './',
    appBundleId: 'chat.quadrix.mac',
    out: './dist',
    platform: 'mas',
    arch: 'x64',
    overwrite: true,
    icon: './resources/mac/icon.icns',
    appVersion: package.version,
    prune: true,
    derefSymlinks: false,
    ignore: ['^\/(?!(build-web|electron-main\.js|package\.json))'],
    extendInfo: './macos/custom.plist',
    extraResource: [
        './resources/mac/icon.icns',
        './macos/de.lproj',
        './macos/en.lproj',
        './macos/fr.lproj'
    ],
    afterCopy: [setLanguages([
        'en', 'en-US', 'de', 'fr', 'es'
    ])]
};

packager(options)
    .then(path => console.log('MAS package available at ' + path))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
