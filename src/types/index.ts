// Data item type
export interface DataItem {
  id: number;
  value: string;
}

// Table state type
export interface TableState {
  items: DataItem[];
  selected: Set<number>;
  loading: boolean;
  hasMore: boolean;
  total: number;
  page: number;
  sortOrder: number[];
  searchQuery: string;
  isSearching: boolean;
}

// Table action types
export type TableAction =
  | { type: 'LOAD_DATA'; payload: { items: DataItem[]; hasMore: boolean; total: number } }
  | { type: 'APPEND_DATA'; payload: { items: DataItem[]; hasMore: boolean; total: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_HAS_MORE'; payload: boolean }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SELECT_ITEM'; payload: number }
  | { type: 'DESELECT_ITEM'; payload: number }
  | { type: 'SELECT_MULTIPLE'; payload: number[] }
  | { type: 'DESELECT_ALL' }
  | { type: 'SET_SORT_ORDER'; payload: number[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_IS_SEARCHING'; payload: boolean }
  | { type: 'RESET_STATE' };

// Table context type
export interface TableContextType {
  state: TableState;
  dispatch: React.Dispatch<TableAction>;
  loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
  toggleItemSelection: (id: number) => Promise<void>;
  saveState: () => Promise<void>;
  reorderItems: (startIndex: number, endIndex: number) => Promise<void>;
  isItemLoaded: (index: number) => boolean;
}