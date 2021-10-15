/* eslint-disable */

const blocklist = require('metro-config/src/defaults/exclusionList');

module.exports = {
    transformer: {
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: true
            },
        }),
        maxWorkers: 2,
        resolver: {
            blocklistRE: blocklist([/ios\/Pods\/JitsiMeetSDK\/Frameworks\/JitsiMeet.framework\/assets\/node_modules\/react-native\/.*/])
        }
    },
};
