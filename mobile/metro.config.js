const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Watch the shared core/ folder outside this project root
config.watchFolders = [workspaceRoot];

// Resolve @/core/* to ../core/*
config.resolver.extraNodeModules = {
  '@/core': path.resolve(workspaceRoot, 'core'),
};

module.exports = config;
