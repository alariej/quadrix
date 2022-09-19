if (process.argv.includes('run-ios')) {
	process.argv.push('--device');
	// process.argv.push('--simulator=iPhone 14');
}

require('react-native/cli').run(); // eslint-disable-line
