const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reduce the number of file watchers to prevent EMFILE on macOS
config.watchFolders = [__dirname];

// Exclude directories that don't need watching
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/react-native\/.*/,
];

// Limit workers to reduce open file handles
config.maxWorkers = 2;

// Reduce watcher polling to lower file handle usage
config.watcher = {
  ...config.watcher,
  watchman: {
    deferStates: ['hg.update'],
  },
  healthCheck: {
    enabled: false,
  },
};

module.exports = config;
