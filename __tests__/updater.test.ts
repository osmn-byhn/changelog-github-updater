import { updateIfNeeded, downloadAsset, getOSAssetExtension, installUpdate } from '../src/updater';
import { GithubFetcher } from '@osmn-byhn/changelog-github-core';
import { getCurrentVersion, setCurrentVersion } from '../src/versionManager';
import os from 'os';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import { EventEmitter } from 'events';

jest.mock('@osmn-byhn/changelog-github-core');
jest.mock('../src/versionManager');
jest.mock('os');
jest.mock('fs');
jest.mock('child_process');

// Mock https.get
jest.mock('https', () => ({
    get: jest.fn(),
}));

describe('updater', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getOSAssetExtension', () => {
        it('should return .exe for win32', () => {
            (os.platform as jest.Mock).mockReturnValue('win32');
            expect(getOSAssetExtension()).toEqual(['.exe']);
        });

        it('should return darwin extensions for mac', () => {
            (os.platform as jest.Mock).mockReturnValue('darwin');
            expect(getOSAssetExtension()).toEqual(['.dmg', '.zip']);
        });

        it('should return linux extensions', () => {
            (os.platform as jest.Mock).mockReturnValue('linux');
            expect(getOSAssetExtension()).toEqual(['.deb', '.AppImage', '.rpm', '.tar.gz']);
        });
    });

    describe('installUpdate', () => {
        it('should spawn process for win32', () => {
            (os.platform as jest.Mock).mockReturnValue('win32');
            const mockUnref = jest.fn();
            (spawn as jest.Mock).mockReturnValue({ unref: mockUnref });
            const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

            installUpdate('test.exe');
            expect(spawn).toHaveBeenCalledWith('test.exe', { detached: true, stdio: 'ignore' });
            expect(mockUnref).toHaveBeenCalled();
            expect(exitSpy).toHaveBeenCalled();
            exitSpy.mockRestore();
        });

        it('should exec open for darwin', () => {
            (os.platform as jest.Mock).mockReturnValue('darwin');
            installUpdate('test.dmg');
            expect(exec).toHaveBeenCalledWith('open "test.dmg"');
        });

        it('should handle linux deb', () => {
            (os.platform as jest.Mock).mockReturnValue('linux');
            installUpdate('test.deb');
            expect(exec).toHaveBeenCalledWith(expect.stringContaining('pkexec dpkg -i "test.deb"'), expect.any(Function));
        });
    });

    describe('updateIfNeeded', () => {
        const mockReleases = jest.fn();

        beforeEach(() => {
            (GithubFetcher as jest.Mock).mockImplementation(() => ({
                fetchAndProcessReleases: mockReleases,
            }));
            (os.tmpdir as jest.Mock).mockReturnValue('/tmp');
        });

        it('should return updated: false if no releases', async () => {
            mockReleases.mockResolvedValue([]);
            const result = await updateIfNeeded({ owner: 'foo', repo: 'bar' });
            expect(result).toEqual({ updated: false });
        });

        it('should return updated: false if current version matches latest', async () => {
            mockReleases.mockResolvedValue([{ tag_name: 'v1.0.0' }]);
            (getCurrentVersion as jest.Mock).mockReturnValue('v1.0.0');
            const result = await updateIfNeeded({ owner: 'foo', repo: 'bar' });
            expect(result).toEqual({ updated: false, from: 'v1.0.0' });
        });

        it('should update and install when autoInstall is true', async () => {
            const asset = { name: 'app.exe', browser_download_url: 'http://example.com/app.exe' };
            mockReleases.mockResolvedValue([{ tag_name: 'v1.0.1', assets: [asset] }]);
            (getCurrentVersion as jest.Mock).mockReturnValue('v1.0.0');
            (os.platform as jest.Mock).mockReturnValue('win32');

            // Mock https get to avoid actual network call
            const mockStream = new EventEmitter();
            (mockStream as any).pipe = jest.fn();
            (mockStream as any).close = jest.fn();
            (fs.createWriteStream as jest.Mock).mockReturnValue(mockStream);

            const req = new EventEmitter();
            (https.get as jest.Mock).mockImplementation((url, cb) => {
                const res = new EventEmitter();
                (res as any).statusCode = 200;
                (res as any).pipe = jest.fn();
                cb(res);
                res.emit('finish'); // Trigger finish callback in our mock stream? The mock in updater is file.on('finish')

                // wait a tick then emit finish on file
                setTimeout(() => mockStream.emit('finish'), 0);
                return req;
            });

            const middleware = jest.fn();
            const result = await updateIfNeeded({ owner: 'foo', repo: 'bar', autoInstall: true }, middleware);

            expect(middleware).toHaveBeenCalledWith('v1.0.0', 'v1.0.1');
            expect(setCurrentVersion).toHaveBeenCalledWith('v1.0.1', undefined);
            expect(result).toEqual({ updated: true, from: 'v1.0.0', to: 'v1.0.1' });
        });
    });
});
