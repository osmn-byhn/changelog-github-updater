import fs from 'fs';
import path from 'path';
import os from 'os';
import { getCurrentVersion, setCurrentVersion, getVersionFile } from '../src/versionManager';

jest.mock('fs');

describe('versionManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getVersionFile', () => {
        it('should return path using os.tmpdir when customPath is not provided', () => {
            const expectedPath = path.join(os.tmpdir(), "changelog-github-updater-version.json");
            expect(getVersionFile()).toBe(expectedPath);
        });

        it('should return path using customPath when provided', () => {
            const custom = '/custom/path';
            const expectedPath = path.resolve(custom, "updater-version.json");
            expect(getVersionFile(custom)).toBe(expectedPath);
        });
    });

    describe('getCurrentVersion', () => {
        it('should return null if version file does not exist', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            expect(getCurrentVersion()).toBeNull();
        });

        it('should return the version if file exists and is valid JSON', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ currentVersion: '1.2.3' }));
            expect(getCurrentVersion()).toBe('1.2.3');
        });

        it('should return null if file exists but contains invalid JSON', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');
            expect(getCurrentVersion()).toBeNull();
        });
    });

    describe('setCurrentVersion', () => {
        it('should write the version to the file', () => {
            setCurrentVersion('1.2.3');
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                getVersionFile(),
                JSON.stringify({ currentVersion: '1.2.3' }, null, 2)
            );
        });

        it('should write the version to the custom path if provided', () => {
            const custom = '/my/custom';
            setCurrentVersion('1.2.3', custom);
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                getVersionFile(custom),
                JSON.stringify({ currentVersion: '1.2.3' }, null, 2)
            );
        });
    });
});
