// src/versionManager.ts
import fs from "fs";
import path from "path";
import os from "os";

export const getVersionFile = (customPath?: string): string => {
    if (customPath) return path.resolve(customPath, "updater-version.json");
    return path.join(os.tmpdir(), "changelog-github-updater-version.json");
};

export const getCurrentVersion = (customPath?: string): string | null => {
    const versionFile = getVersionFile(customPath);
    if (!fs.existsSync(versionFile)) return null;
    const data = fs.readFileSync(versionFile, "utf-8");
    try {
        return JSON.parse(data).currentVersion;
    } catch {
        return null;
    }
};

export const setCurrentVersion = (version: string, customPath?: string): void => {
    const versionFile = getVersionFile(customPath);
    fs.writeFileSync(versionFile, JSON.stringify({ currentVersion: version }, null, 2));
};