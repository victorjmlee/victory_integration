import { API_ENDPOINTS } from "@/lib/constants";
import { useApiData } from "./useApiData";
import type { VercelProjectsResponse, VercelDeploymentsResponse } from "@/types/vercel";

export function useVercelProjects() {
  return useApiData<VercelProjectsResponse>(API_ENDPOINTS.vercel.projects);
}

export function useVercelDeployments() {
  return useApiData<VercelDeploymentsResponse>(API_ENDPOINTS.vercel.deployments);
}
