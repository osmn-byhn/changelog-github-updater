// src/updater.ts
import { ChangelogCore } from "@osmn-byhn/changelog-github-core";
import { getCurrentVersion, setCurrentVersion } from "./versionManager";
import { MiddlewareFn, UpdaterOptions } from "./types";
import os from "os";
import https from "https";
import fs from "fs";
import path from "path";
import { exec, spawn } from "child_process";
import process from "process";

export const downloadAsset = (url: string, dest: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response: any) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle redirection
                return downloadAsset(response.headers.location!, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on("finish", () => {
                file.close();
                resolve();
            });
        }).on("error", (err: any) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

export const getOSAssetExtension = (): string[] => {
    const platform = os.platform();
    if (platform === "win32") return [".exe"];
    if (platform === "darwin") return [".dmg", ".zip"];
    if (platform === "linux") return [".deb", ".AppImage", ".rpm", ".tar.gz"];
    return [];
};

export const installUpdate = (filePath: string): void => {
    const platform = os.platform();
    try {
        if (platform === "win32") {
            // Windows: Run exe
            spawn(filePath, { detached: true, stdio: 'ignore' }).unref();
            process.exit();
        } else if (platform === "darwin") {
            // macOS: Open dmg/zip
            exec(`open "${filePath}"`);
        } else if (platform === "linux") {
            // Linux: Deb or AppImage
            if (filePath.endsWith('.deb')) {
                exec(`pkexec dpkg -i "${filePath}"`, (err: any, stdout: any, stderr: any) => {
                    if (err) console.error("Update failed:", err);
                });
            } else if (filePath.endsWith('.AppImage')) {
                exec(`chmod +x "${filePath}" && "${filePath}"`);
                process.exit();
            } else {
                exec(`xdg-open "${filePath}"`);
            }
        }
    } catch (e: any) {
        console.error("Install step failed", e);
    }
};

export const updateIfNeeded = async (
    options: UpdaterOptions,
    middleware?: MiddlewareFn
): Promise<{ updated: boolean; from?: string | null; to?: string }> => {
    const { owner, repo, currentVersion: passedVersion, tempPath, autoInstall } = options;
    const changelog = new ChangelogCore({ owner, repo });

    const releases = await changelog.releases();
    if (!releases || releases.length === 0) return { updated: false };

    const latestRelease = releases[0];
    const latestVersion = latestRelease.tag_name;
    const currentVersion = passedVersion || getCurrentVersion(tempPath);

    if (currentVersion !== latestVersion) {
        if (middleware) {
            try {
                await middleware(currentVersion || "none", latestVersion);
            } catch (err) {
                console.error("Middleware çalıştırılırken hata:", err);
            }
        }

        let updateTriggered = false;

        if (autoInstall !== false && latestRelease.assets && latestRelease.assets.length > 0) {
            const exts = getOSAssetExtension();
            // Find the best matching asset
            const asset = latestRelease.assets.find((a: any) => exts.some(ext => a.name.endsWith(ext)));

            if (asset && asset.browser_download_url) {
                console.log(`Downloading update: ${asset.name}...`);
                const downloadDir = tempPath || os.tmpdir();
                const destPath = path.join(downloadDir, asset.name);

                try {
                    await downloadAsset(asset.browser_download_url, destPath);
                    console.log(`Download complete: ${destPath}`);
                    installUpdate(destPath);
                    updateTriggered = true;
                } catch (err) {
                    console.error("İndirme sırasında hata:", err);
                }
            } else {
                console.warn("Uygun bir kurulum dosyası (asset) bulunamadı.");
            }
        }

        setCurrentVersion(latestVersion, tempPath);
        return { updated: true, from: currentVersion, to: latestVersion };
    }

    return { updated: false, from: currentVersion };
};