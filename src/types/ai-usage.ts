export interface DailyUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost?: number;
}

export interface OpenAIUsageResponse {
  dailyUsage: DailyUsage[];
  totalTokens: number;
  error?: string;
}

export interface AnthropicUsageResponse {
  dailyUsage: DailyUsage[];
  totalTokens: number;
  error?: string;
}

export interface GeminiModel {
  name: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
}

export interface GeminiResponse {
  connected: boolean;
  models: GeminiModel[];
  error?: string;
}

export interface AIProviderStatus {
  name: string;
  connected: boolean;
  hasAdminKey: boolean;
  totalTokens?: number;
  error?: string;
}
