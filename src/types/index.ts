export interface DataItem {
  id: number;
  value: string;
}

export interface ApiResponse {
  items: DataItem[];
  total: number;
  page: number;
  hasMore: boolean;
}