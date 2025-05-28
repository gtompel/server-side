import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TableState, TableAction, DataItem } from '../types';
import { 
  fetchData, 
  getSelectedItems, 
  getSortOrder, 
  saveSelectedItems, 
  saveSortOrder 
} from '../api/dataService';

// Initial state
const initialState: TableState = {
  items: [],
  selected: new Set<number>(),
  loading: false,
  hasMore: true,
  total: 0,
  page: 0,
  sortOrder: [],
  searchQuery: '',
  isSearching: false,
};

// Reducer function
const tableReducer = (state: TableState, action: TableAction): TableState => {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...state,
        items: action.payload.items,
        hasMore: action.payload.hasMore,
        total: action.payload.total,
        loading: false,
      };
    case 'APPEND_DATA':
      return {
        ...state,
        items: [...state.items, ...action.payload.items],
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_HAS_MORE':
      return {
        ...state,
        hasMore: action.payload,
      };
    case 'SET_PAGE':
      return {
        ...state,
        page: action.payload,
      };
    case 'SELECT_ITEM': {
      const newSelected = new Set(state.selected);
      newSelected.add(action.payload);
      return {
        ...state,
        selected: newSelected,
      };
    }
    case 'DESELECT_ITEM': {
      const newSelected = new Set(state.selected);
      newSelected.delete(action.payload);
      return {
        ...state,
        selected: newSelected,
      };
    }
    case 'SELECT_MULTIPLE': {
      const newSelected = new Set(state.selected);
      action.payload.forEach(id => newSelected.add(id));
      return {
        ...state,
        selected: newSelected,
      };
    }
    case 'DESELECT_ALL':
      return {
        ...state,
        selected: new Set(),
      };
    case 'SET_SORT_ORDER':
      return {
        ...state,
        sortOrder: action.payload,
      };
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
        page: 0, // Reset page when search changes
      };
    case 'SET_IS_SEARCHING':
      return {
        ...state,
        isSearching: action.payload,
      };
    case 'RESET_STATE':
      return {
        ...initialState,
      };
    default:
      return state;
  }
};

// Context type
interface TableContextType {
  state: TableState;
  dispatch: React.Dispatch<TableAction>;
  loadMoreItems: () => Promise<void>;
  toggleItemSelection: (id: number) => void;
  saveState: () => Promise<void>;
  reorderItems: (startIndex: number, endIndex: number) => void;
  isItemLoaded: (index: number) => boolean;
}

// Create context
const TableContext = createContext<TableContextType | undefined>(undefined);

// Provider component
export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tableReducer, initialState);

  // Load initial data and saved state
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Load selections from server
        const { selected } = await getSelectedItems();
        if (selected && selected.length > 0) {
          dispatch({ type: 'SELECT_MULTIPLE', payload: selected });
        }
        
        // Load sort order from server
        const { order } = await getSortOrder();
        if (order && order.length > 0) {
          dispatch({ type: 'SET_SORT_ORDER', payload: order });
        }
        
        // Load first page of data
        const response = await fetchData(0);
        dispatch({
          type: 'LOAD_DATA',
          payload: {
            items: response.data,
            hasMore: response.hasMore,
            total: response.total,
          },
        });
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    loadInitialData();
  }, []);

  // Check if an item at a specific index is loaded
  const isItemLoaded = (index: number) => {
    return !!state.items[index];
  };

  // Load more items (for infinite scroll)
  const loadMoreItems = async () => {
    if (!state.hasMore || state.loading) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    const nextPage = state.page + 1;
    
    try {
      let response;
      if (state.isSearching && state.searchQuery) {
        // If searching, load more search results
        const { searchData } = await import('../api/dataService');
        response = await searchData(state.searchQuery, nextPage);
      } else {
        // Otherwise load regular data
        response = await fetchData(nextPage);
      }
      
      dispatch({
        type: 'APPEND_DATA',
        payload: { items: response.data },
      });
      
      dispatch({ type: 'SET_HAS_MORE', payload: response.hasMore });
      dispatch({ type: 'SET_PAGE', payload: nextPage });
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Toggle item selection
  const toggleItemSelection = (id: number) => {
    if (state.selected.has(id)) {
      dispatch({ type: 'DESELECT_ITEM', payload: id });
    } else {
      dispatch({ type: 'SELECT_ITEM', payload: id });
    }
  };

  // Save current state to server
  const saveState = async () => {
    try {
      // Save selected items
      await saveSelectedItems(Array.from(state.selected));
      
      // Save sort order
      await saveSortOrder(state.sortOrder.length > 0 ? state.sortOrder : state.items.map(item => item.id));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  };

  // Reorder items (for drag and drop)
  const reorderItems = (startIndex: number, endIndex: number) => {
    const items = [...state.items];
    const [removed] = items.splice(startIndex, 1);
    items.splice(endIndex, 0, removed);
    
    // Update sort order
    const newSortOrder = items.map(item => item.id);
    dispatch({ type: 'SET_SORT_ORDER', payload: newSortOrder });
    
    // Update items
    dispatch({
      type: 'LOAD_DATA',
      payload: {
        items,
        hasMore: state.hasMore,
        total: state.total,
      },
    });
    
    // Save the new sort order
    saveSortOrder(newSortOrder).catch(console.error);
  };

  return (
    <TableContext.Provider
      value={{
        state,
        dispatch,
        loadMoreItems,
        toggleItemSelection,
        saveState,
        reorderItems,
        isItemLoaded,
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

// Custom hook to use the table context
export const useTable = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
};