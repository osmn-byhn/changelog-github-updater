// src/types.ts
export type MiddlewareFn = (oldVersion: string, newVersion: string) => Promise<void> | void;

export interface UpdaterOptions {
    owner: string;
    repo: string;
    currentVersion?: string;
    tempPath?: string;
    autoInstall?: boolean;
}