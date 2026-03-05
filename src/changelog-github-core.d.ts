declare module '@osmn-byhn/changelog-github-core' {
    export class ChangelogCore {
        constructor(options: { owner: string; repo: string });
        releases(): Promise<any[]>;
    }
}
