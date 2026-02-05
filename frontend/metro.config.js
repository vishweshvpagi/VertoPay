const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure project root is always this folder (frontend) so ../../hooks resolves correctly
config.projectRoot = path.resolve(__dirname);
config.watchFolders = [path.resolve(__dirname)];

module.exports = config;
