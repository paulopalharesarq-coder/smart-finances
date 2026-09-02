/**
 * Automated Build & Cache Versioning Script
 * Runs automatically on Vercel or manual deploy.
 * Injects a unique CACHE_NAME identifier into sw.js and generates version.json.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const swPath = path.join(rootDir, 'sw.js');
const versionPath = path.join(rootDir, 'version.json');

// Determine build ID
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || null;
const now = new Date();
const formattedDate = now.toISOString().replace(/[-:T.]/g, '').substring(0, 12);
const buildVersion = commitSha ? `${formattedDate}-${commitSha.substring(0, 7)}` : `${formattedDate}`;
const cacheName = `minhas-compras-v${buildVersion}`;

console.log(`[BUILD] Generating automated cache version: ${cacheName}`);

// 1. Update sw.js CACHE_NAME
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  swContent = swContent.replace(/const CACHE_NAME = ['"][^'"]+['"];/, `const CACHE_NAME = '${cacheName}';`);
  fs.writeFileSync(swPath, swContent, 'utf8');
  console.log(`[BUILD] Updated sw.js with CACHE_NAME = '${cacheName}'`);
}

// 2. Generate version.json
const versionData = {
  appName: 'Minhas Compras',
  version: buildVersion,
  cacheName: cacheName,
  buildTime: now.toISOString(),
  commit: commitSha || 'local-build'
};
fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2), 'utf8');
console.log(`[BUILD] Generated version.json with version '${buildVersion}'`);

console.log(`[BUILD] Build finished successfully! Preserved all custom icon assets.`);


