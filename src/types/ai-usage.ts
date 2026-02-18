export interface ModelCost {
  model: string;
  cost: number;
}

export interface DailyUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost?: number;
  modelCosts?: ModelCost[];
  estimated?: boolean;
}

export interface OpenAIUsageResponse {
  dailyUsage: DailyUsage[];
  totalTokens: number;
  totalCost: number;
  error?: string;
}

export interface AnthropicUsageResponse {
  dailyUsage: DailyUsage[];
  totalTokens: number;
  totalCost: number;
  costByModel?: { model: string; cost: number }[];
  costByWorkspace?: { workspace: string; cost: number }[];
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
