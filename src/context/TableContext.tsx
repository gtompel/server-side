import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TableState, TableAction, DataItem, TableContextType } from '../types';
import { 
  fetchData, 
  getSelectedItems, 
  getSortOrder, 
  saveSelectedItems, 
  saveSortOrder,
  searchData 
} from '../api/dataService';

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
        hasMore: action.payload.hasMore,
        total: action.payload.total,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
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
        page: 0,
        items: [], // Очищаем items при новом поиске
      };
    case 'SET_IS_SEARCHING':
      return {
        ...state,
        isSearching: action.payload,
        page: 0,
        items: [], // Очищаем items при изменении режима поиска
      };
    default:
      return state;
  }
};

const TableContext = createContext<TableContextType | undefined>(undefined);

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tableReducer, initialState);

  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Загружаем сохраненные выделенные элементы
        const { selected } = await getSelectedItems();
        if (selected && selected.length > 0) {
          dispatch({ type: 'SELECT_MULTIPLE', payload: selected });
        }
        
        // Загружаем сохраненный порядок сортировки
        const { order } = await getSortOrder();
        if (order && order.length > 0) {
          dispatch({ type: 'SET_SORT_ORDER', payload: order });
        }
        
        // Загружаем первую страницу данных
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
        console.error('Ошибка загрузки начальных данных:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    loadInitialData();
  }, []);

  const isItemLoaded = (index: number) => {
    return !!state.items[index];
  };

  const loadMoreItems = async (startIndex: number, stopIndex: number) => {
    if (state.loading) return;
    
    const currentPage = Math.floor(startIndex / 20);
    if (currentPage === state.page) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = state.isSearching
        ? await searchData(state.searchQuery, currentPage)
        : await fetchData(currentPage);
      
      dispatch({
        type: 'APPEND_DATA',
        payload: {
          items: response.data,
          hasMore: response.hasMore,
          total: response.total,
        },
      });
      
      dispatch({ type: 'SET_PAGE', payload: currentPage });
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const toggleItemSelection = async (id: number) => {
    if (state.selected.has(id)) {
      dispatch({ type: 'DESELECT_ITEM', payload: id });
    } else {
      dispatch({ type: 'SELECT_ITEM', payload: id });
    }
    
    // Сохраняем выбранные элементы на сервере
    const newSelected = state.selected.has(id)
      ? Array.from(state.selected).filter(itemId => itemId !== id)
      : [...Array.from(state.selected), id];
    
    await saveSelectedItems(newSelected);
  };

  const saveState = async () => {
    try {
      await saveSelectedItems(Array.from(state.selected));
      await saveSortOrder(state.items.map(item => item.id));
    } catch (error) {
      console.error('Ошибка сохранения состояния:', error);
    }
  };

  const reorderItems = async (startIndex: number, endIndex: number) => {
    const items = [...state.items];
    const [removed] = items.splice(startIndex, 1);
    items.splice(endIndex, 0, removed);
    
    const newSortOrder = items.map(item => item.id);
    
    dispatch({
      type: 'LOAD_DATA',
      payload: {
        items,
        hasMore: state.hasMore,
        total: state.total,
      },
    });
    
    dispatch({ type: 'SET_SORT_ORDER', payload: newSortOrder });
    
    await saveSortOrder(newSortOrder);
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

export const useTable = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTable должен использоваться внутри TableProvider');
  }
  return context;
};