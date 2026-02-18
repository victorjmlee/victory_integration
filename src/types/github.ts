export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  pushed_at: string;
  visibility: string;
  topics: string[];
}

export interface GitHubEvent {
  id: string;
  type: string;
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload: {
    action?: string;
    ref?: string;
    ref_type?: string;
    commits?: Array<{
      sha: string;
      message: string;
    }>;
    pull_request?: {
      title: string;
      number: number;
    };
  };
  created_at: string;
}

export interface GitHubApiResponse {
  repos: GitHubRepo[];
  error?: string;
}

export interface GitHubEventsResponse {
  events: GitHubEvent[];
  error?: string;
}
