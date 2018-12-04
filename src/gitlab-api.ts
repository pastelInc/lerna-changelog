const path = require("path");

import ConfigurationError from "./configuration-error";
import fetch from "./fetch";

export interface GitLabUserResponse {
  username: string;
  name: string;
  web_url: string;
}

export interface GitLabMergeRequestResponse {
  iid: number;
  title: string;
  web_url: string;
  labels: string[];
  author: {
    username: string;
    web_url: string;
  };
}

export interface Options {
  repo: string;
  rootPath: string;
  gitlab?: { host: string; https: boolean };
  cacheDir?: string;
}

export default class GitlabAPI {
  private cacheDir: string | undefined;
  private auth: string;
  private url: string;

  constructor(config: Options) {
    this.cacheDir = config.cacheDir && path.join(config.rootPath, config.cacheDir, "gitlab");
    this.auth = this.getAuthToken();
    if (!this.auth) {
      throw new ConfigurationError("Must provide GITLAB_AUTH");
    }
    if (!config.gitlab) {
      throw new ConfigurationError('Could not infer "gitlab" from the "package.json" file.');
    }
    this.url = this.getURL(config.gitlab.host, config.gitlab.https);
  }

  public getBaseMergeRequestUrl(repo: string): string {
    return `${this.url}/api/v4/projects/${encodeURIComponent(repo)}/merge_requests/`;
  }

  public async getMergeRequestData(repo: string, mr: string): Promise<GitLabMergeRequestResponse> {
    return this._fetch(`${this.url}/api/v4/projects/${encodeURIComponent(repo)}/merge_requests/${mr}`);
  }

  public async getUserData(login: string): Promise<GitLabUserResponse[]> {
    return this._fetch(`${this.url}/api/v4/users?username=${login}`);
  }

  public async getMergeRequestsByCommit(repo: string, sha: string): Promise<GitLabMergeRequestResponse[]> {
    return this._fetch(
      `${this.url}/api/v4/projects/${encodeURIComponent(repo)}/repository/commits/${sha}/merge_requests`
    );
  }

  private async _fetch(url: string): Promise<any> {
    const res = await fetch(url, {
      cacheManager: this.cacheDir,
      headers: {
        "Private-Token": `${this.auth}`,
      },
    });
    return res.json();
  }

  private getAuthToken(): string {
    return `${process.env.GITLAB_AUTH}`;
  }

  private getURL(host: string, https: boolean): string {
    if (!https) {
      return `http://${host}`;
    }
    return `https://${host}`;
  }
}
