import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { getCurrentVersion, setCurrentVersion, getVersionFile } from '../src/versionManager';

async function runTests() {
    console.log('--- Running versionManager Tests ---');
    try {
        const testCustomPath = path.join(os.tmpdir(), "test-updater-custom");
        if (!fs.existsSync(testCustomPath)) {
            fs.mkdirSync(testCustomPath, { recursive: true });
        }

        // 1. getVersionFile
        const def = getVersionFile();
        assert.ok(def.includes('changelog-github-updater-version.json'), 'getVersionFile default failed');

        const cust = getVersionFile(testCustomPath);
        assert.ok(cust.includes('test-updater-custom'), 'getVersionFile custom failed');

        // 2. setCurrentVersion & getCurrentVersion
        const version = '1.5.0';
        setCurrentVersion(version, testCustomPath);
        const read = getCurrentVersion(testCustomPath);
        assert.strictEqual(read, version, 'getCurrentVersion failed to read saved version');

        // Cleanup test data
        const filePath = getVersionFile(testCustomPath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        if (fs.existsSync(testCustomPath)) {
            fs.rmdirSync(testCustomPath);
        }
        console.log('✅ versionManager.ts tests passed.');

    } catch (error) {
        console.error('❌ Tests failed:', error);
        process.exit(1);
    }
}

runTests();
