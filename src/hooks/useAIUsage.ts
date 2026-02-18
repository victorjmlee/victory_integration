import { API_ENDPOINTS } from "@/lib/constants";
import { useApiData } from "./useApiData";
import type { OpenAIUsageResponse, AnthropicUsageResponse, GeminiResponse } from "@/types/ai-usage";

export function useOpenAIUsage() {
  return useApiData<OpenAIUsageResponse>(API_ENDPOINTS.aiUsage.openai);
}

export function useAnthropicUsage() {
  return useApiData<AnthropicUsageResponse>(API_ENDPOINTS.aiUsage.anthropic);
}

export function useGeminiStatus() {
  return useApiData<GeminiResponse>(API_ENDPOINTS.aiUsage.gemini);
}
