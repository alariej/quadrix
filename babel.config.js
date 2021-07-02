module.exports = function(api) {

    api.cache.forever(); // eslint-disable-line

    const presets = [
        ['module:metro-react-native-babel-preset'],
    ];

    const plugins = [
        ['@babel/proposal-decorators', { legacy: true }],
        ["@babel/plugin-proposal-private-methods", { "loose": true }],
    ];

    if (process.env.platform === 'web') {
        return {
            presets: ['@babel/env', ...presets],
            plugins,
        }
    }

    return { presets, plugins };
};
