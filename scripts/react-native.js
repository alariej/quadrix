if (process.argv.includes('run-ios')) {
	process.argv.push('--device');
}

require('react-native/cli').run(); // eslint-disable-line
