if (process.argv.includes('run-ios')) {
  process.argv.push('--device');
}

require('@react-native-community/cli').run();
