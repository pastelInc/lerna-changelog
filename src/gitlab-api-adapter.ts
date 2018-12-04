import GitlabAPI, { GitLabMergeRequestResponse, GitLabUserResponse } from "./gitlab-api";
import { GitHubAPIInterface, GitHubIssueResponse, GitHubUserResponse } from "./github-api";

export interface Options {
  repo: string;
  rootPath: string;
  gitlab?: { host: string; https: boolean };
  cacheDir?: string;
}

export default class GitlabAPIAdapter implements GitHubAPIInterface {
  private gitlab: GitlabAPI;

  constructor(config: Options) {
    this.gitlab = new GitlabAPI(config);
  }

  public getBaseIssueUrl(repo: string): string {
    return this.gitlab.getBaseMergeRequestUrl(repo);
  }

  public async getIssueData(repo: string, issue: string): Promise<GitHubIssueResponse> {
    return this.gitlab.getMergeRequestData(repo, issue).then(this.translateToGitHubIssueData);
  }

  public async getUserData(login: string): Promise<GitHubUserResponse> {
    return this.gitlab.getUserData(login).then(this.translateToGitHubUserData);
  }

  public async getPullRequestId(repo: string, sha: string): Promise<string | null> {
    return this.gitlab.getMergeRequestsByCommit(repo, sha).then(this.translateToPullRequestId);
  }

  private translateToGitHubIssueData(data: GitLabMergeRequestResponse): GitHubIssueResponse {
    const labels = data.labels || [];
    const labelsForGitHub: Array<{ name: string }> = labels.map(label => {
      return { name: label };
    });
    return {
      number: data.iid,
      title: data.title,
      pull_request: {
        html_url: data.web_url,
      },
      labels: labelsForGitHub,
      user: {
        login: data.author.username,
        html_url: data.author.web_url,
      },
    };
  }

  private translateToGitHubUserData(data: GitLabUserResponse[]): GitHubUserResponse {
    const user = data[0];
    return {
      login: user.username,
      name: user.name,
      html_url: user.web_url,
    };
  }

  private translateToPullRequestId(data: GitLabMergeRequestResponse[]): string | null {
    const mergeRequest = data[0];
    if (!mergeRequest) {
      return null;
    }
    return `${mergeRequest.iid}`;
  }
}
