// const CompressionPlugin = require('compression-webpack-plugin');
const { merge } = require('webpack-merge');
const { buildConfig, DIST_PATH, APP_PATH } = require('./common');
const path = require('path');

module.exports = (env, argv) => merge(buildConfig(env, argv), {
    entry: path.join(APP_PATH, 'index.tsx'),
    devtool: false,

    output: {
        filename: 'bundle-[fullhash].js',
        path: DIST_PATH,
    },
/* 
    plugins: [
        new CompressionPlugin({ algorithm: 'gzip', filename: '[path].gz' }),
    ],
*/
});
