const webpack = require('webpack');
const { merge } = require('webpack-merge');
const path = require('path');
const { buildConfig, WEB_PATH } = require('./common');

module.exports = (env, argv) => (
    merge(buildConfig(env, argv), {
        entry: path.join(WEB_PATH, 'index.hmr.js'),
        devtool: 'inline-source-map',

        plugins: [
            new webpack.HotModuleReplacementPlugin(),
        ],

        devServer: {
            port: 9999,
            hot: true,
            client: {
                overlay: false,
            },
        },
    })
);
