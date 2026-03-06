const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { getCurrentVersion, setCurrentVersion, getVersionFile } = require('./dist/index.js');
const { getOSAssetExtension } = require('./dist/index.js');

async function runTests() {
    console.log('--- Running Tests ---');
    try {
        const testCustomPath = path.join(os.tmpdir(), "test-updater-custom");
        if (!fs.existsSync(testCustomPath)) {
            fs.mkdirSync(testCustomPath, { recursive: true });
        }

        console.log('[1/4] getVersionFile()');
        const def = getVersionFile();
        assert.ok(def.includes('changelog-github-updater-version.json'), 'getVersionFile default failed');

        const cust = getVersionFile(testCustomPath);
        assert.ok(cust.includes('test-updater-custom'), 'getVersionFile custom failed');

        console.log('[2/4] setCurrentVersion() & getCurrentVersion()');
        const version = '1.5.0';
        setCurrentVersion(version, testCustomPath);
        const read = getCurrentVersion(testCustomPath);
        assert.strictEqual(read, version, 'getCurrentVersion failed to read saved version');

        console.log('[3/4] getOSAssetExtension()');
        const exts = getOSAssetExtension();
        assert.ok(Array.isArray(exts) && exts.length > 0, 'OS extensions should be an array with items');

        // Cleanup test data
        const filePath = getVersionFile(testCustomPath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        if (fs.existsSync(testCustomPath)) {
            fs.rmdirSync(testCustomPath);
        }
        console.log('✅ All native JS tests passed.');

    } catch (error) {
        console.error('❌ Tests failed:', error);
        process.exit(1);
    }
}

runTests();
