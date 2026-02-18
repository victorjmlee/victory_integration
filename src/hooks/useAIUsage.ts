import { API_ENDPOINTS } from "@/lib/constants";
import { useApiData } from "./useApiData";
import type { OpenAIUsageResponse, AnthropicUsageResponse, GeminiResponse } from "@/types/ai-usage";

export function useOpenAIUsage(start: string, end: string) {
  return useApiData<OpenAIUsageResponse>(`${API_ENDPOINTS.aiUsage.openai}?start=${start}&end=${end}`);
}

export function useAnthropicUsage(start: string, end: string) {
  return useApiData<AnthropicUsageResponse>(`${API_ENDPOINTS.aiUsage.anthropic}?start=${start}&end=${end}`);
}

export function useGeminiStatus() {
  return useApiData<GeminiResponse>(API_ENDPOINTS.aiUsage.gemini);
}
