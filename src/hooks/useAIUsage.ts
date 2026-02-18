import { API_ENDPOINTS } from "@/lib/constants";
import { useApiData } from "./useApiData";
import type { OpenAIUsageResponse, AnthropicUsageResponse, GeminiResponse } from "@/types/ai-usage";

function defaultStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

function defaultEnd(): string {
  return new Date().toISOString().split("T")[0];
}

export function useOpenAIUsage(start: string = defaultStart(), end: string = defaultEnd()) {
  return useApiData<OpenAIUsageResponse>(`${API_ENDPOINTS.aiUsage.openai}?start=${start}&end=${end}`);
}

export function useAnthropicUsage(start: string = defaultStart(), end: string = defaultEnd()) {
  return useApiData<AnthropicUsageResponse>(`${API_ENDPOINTS.aiUsage.anthropic}?start=${start}&end=${end}`);
}

export function useGeminiStatus() {
  return useApiData<GeminiResponse>(API_ENDPOINTS.aiUsage.gemini);
}
