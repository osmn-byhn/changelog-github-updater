"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCurrentVersion = exports.getCurrentVersion = exports.getVersionFile = void 0;
// src/versionManager.ts
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var os_1 = __importDefault(require("os"));
var getVersionFile = function (customPath) {
    if (customPath)
        return path_1.default.resolve(customPath, "updater-version.json");
    return path_1.default.join(os_1.default.tmpdir(), "changelog-github-updater-version.json");
};
exports.getVersionFile = getVersionFile;
var getCurrentVersion = function (customPath) {
    var versionFile = (0, exports.getVersionFile)(customPath);
    if (!fs_1.default.existsSync(versionFile))
        return null;
    var data = fs_1.default.readFileSync(versionFile, "utf-8");
    try {
        return JSON.parse(data).currentVersion;
    }
    catch (_a) {
        return null;
    }
};
exports.getCurrentVersion = getCurrentVersion;
var setCurrentVersion = function (version, customPath) {
    var versionFile = (0, exports.getVersionFile)(customPath);
    fs_1.default.writeFileSync(versionFile, JSON.stringify({ currentVersion: version }, null, 2));
};
exports.setCurrentVersion = setCurrentVersion;
