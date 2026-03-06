declare module '@osmn-byhn/changelog-github-core' {
    export class GithubFetcher {
        constructor(owner: string, repo: string);
        fetchAndProcessReleases(): Promise<any[]>;
    }
}
