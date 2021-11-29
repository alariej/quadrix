/* eslint-disable */
const packager = require('electron-packager');
const setLanguages = require('electron-packager-languages');
const package = require('../package.json');

const options = {
    dir: './',
    appBundleId: 'chat.quadrix.mac',
    out: './dist-mac',
    platform: 'mas',
    arch: 'x64',
    overwrite: true,
    icon: './macos/resources/icon.icns',
    appVersion: package.version,
    prune: true,
    derefSymlinks: false,
    ignore: ['^\/(?!(dist-web|macos|electron-main-mac\.js|package\.json))'],
    extendInfo: './macos/custom.plist',
    extraResource: [
        './macos/de.lproj',
        './macos/en.lproj',
        './macos/fr.lproj'
    ],
    afterCopy: [setLanguages([
        'en', 'en-US', 'de', 'fr'
    ])]
};

packager(options)
    .then(path => console.log('MAS package available at ' + path))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
