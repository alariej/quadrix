/* eslint-disable */
const exclusionList = require('metro-config/src/defaults/exclusionList');

module.exports = {
    transformer: {
        getTransformOptions: async () => ({
            transform: { experimentalImportSupport: false, inlineRequires: true },
        }),
    },
    resolver:{
        blockList: exclusionList([
            /electron\/.*/,
        ]),
    }
};
