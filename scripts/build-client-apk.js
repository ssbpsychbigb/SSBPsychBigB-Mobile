/**
 * Client-test APK: JS bundled in the APK (no Metro), API = Render production.
 * Usage: yarn apk:client
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ANDROID = path.join(ROOT, 'android');
const isWin = process.platform === 'win32';
const gradle = isWin ? 'gradlew.bat' : './gradlew';

const result = spawnSync(gradle, ['assembleRelease'], {
  cwd: ANDROID,
  stdio: 'inherit',
  shell: isWin,
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const apkDir = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'release');
const files = fs.existsSync(apkDir)
  ? fs.readdirSync(apkDir).filter((name) => name.endsWith('.apk'))
  : [];

if (files.length) {
  console.log('\nClient APK ready (Render API, no Metro):');
  for (const name of files) {
    console.log(`  ${path.join(apkDir, name)}`);
  }
} else {
  console.log('\nGradle finished. Look under android/app/build/outputs/apk/release/');
}
