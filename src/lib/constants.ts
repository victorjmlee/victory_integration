export const APP_NAME = "Victory Integration";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" as const },
  { label: "GitHub", href: "/github", icon: "Github" as const },
  { label: "Vercel", href: "/vercel", icon: "Triangle" as const },
  { label: "AI Usage", href: "/ai-usage", icon: "Brain" as const },
] as const;

export const API_ENDPOINTS = {
  github: {
    repos: "/api/github/repos",
    events: "/api/github/events",
  },
  vercel: {
    projects: "/api/vercel/projects",
    deployments: "/api/vercel/deployments",
  },
  aiUsage: {
    openai: "/api/ai-usage/openai",
    anthropic: "/api/ai-usage/anthropic",
    gemini: "/api/ai-usage/gemini",
  },
} as const;
