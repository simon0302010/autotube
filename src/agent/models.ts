export interface ModelInfo {
  id: string;
  name: string;
  created: number;
  context_length: number;
  description: string;
}

export interface ModelList {
  data: ModelInfo[];
  total_count: number;
}
