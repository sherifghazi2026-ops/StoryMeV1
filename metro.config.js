const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// إزالة الحجب العام للسماح لـ Metro بقراءة ملفات الـ SHA-1 المطلوبة
config.resolver.blockList = [
  /.*\.npm-cache.*/,
  /.*\.git.*/
];

// حل إضافي لبيئة Termux لزيادة استقرار البحث عن الملفات
config.resolver.nodeModulesPaths = [
  'node_modules',
  '/data/data/com.termux/files/home/StoryMe/node_modules'
];

module.exports = config;
