import api from "./api";

export type AITone = "positive" | "negative" | "warning" | "neutral";

export interface AICard {
  label: string;
  value: string;
  tone?: AITone;
}

export interface AILink {
  label: string;
  href: string;
  kind: "project" | "running-bill" | "vendor" | "measurement-book" | "dpr" | "generic";
}

export interface AITableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
}

export interface AITable {
  columns: AITableColumn[];
  rows: Record<string, string>[];
}

export interface AIResponse {
  intentId: string;
  intentLabel: string;
  summary: string;
  cards?: AICard[];
  table?: AITable;
  links?: AILink[];
}

export interface AISuggestion {
  id: string;
  label: string;
  example: string;
  category: string;
}

export async function askAI(message: string): Promise<AIResponse> {
  const response = await api.post<{ success: boolean; data: AIResponse }>("/ai/query", { message });
  return response.data.data;
}

export async function getAISuggestions(): Promise<AISuggestion[]> {
  const response = await api.get<{ success: boolean; data: AISuggestion[] }>("/ai/suggestions");
  return response.data.data;
}
