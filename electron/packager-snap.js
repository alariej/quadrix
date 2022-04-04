/* eslint-disable */
const packager = require('electron-packager');
const setLanguages = require('electron-packager-languages');
const package = require('../package.json');

const options = {
    dir: './',
    appBundleId: 'chat.quadrix',
    out: './dist',
    platform: 'linux',
    arch: 'arm64', // x64, arm64, armv7l
    overwrite: true,
    icon: './resources/linux/icon256.png',
    appVersion: package.version,
    prune: true,
    derefSymlinks: false,
    ignore: ['^\/(?!(build-web|electron-main\.js|package\.json))'],
    extraResource: [
        './resources/linux/icon256.png'
    ],
};

packager(options)
    .then(path => console.log('Snap package available at ' + path))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
