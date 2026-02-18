export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface StatCardData {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
  trend?: {
    value: number;
    label: string;
  };
}

export type ConnectionStatus = "connected" | "disconnected" | "error" | "loading";

export interface QuickLinkData {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  status: ConnectionStatus;
}
