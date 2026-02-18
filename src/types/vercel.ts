export interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  latestDeployments?: Array<{
    id: string;
    readyState: string;
    createdAt: number;
  }>;
  updatedAt: number;
  createdAt: number;
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: "BUILDING" | "ERROR" | "INITIALIZING" | "QUEUED" | "READY" | "CANCELED";
  created: number;
  ready?: number;
  meta?: {
    githubCommitMessage?: string;
    githubCommitRef?: string;
    githubCommitSha?: string;
  };
  creator?: {
    username: string;
  };
}

export interface VercelProjectsResponse {
  projects: VercelProject[];
  error?: string;
}

export interface VercelDeploymentsResponse {
  deployments: VercelDeployment[];
  error?: string;
}
