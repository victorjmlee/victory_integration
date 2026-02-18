import { API_ENDPOINTS } from "@/lib/constants";
import { useApiData } from "./useApiData";
import type { GitHubApiResponse, GitHubEventsResponse } from "@/types/github";

export function useGitHubRepos() {
  return useApiData<GitHubApiResponse>(API_ENDPOINTS.github.repos);
}

export function useGitHubEvents() {
  return useApiData<GitHubEventsResponse>(API_ENDPOINTS.github.events);
}
