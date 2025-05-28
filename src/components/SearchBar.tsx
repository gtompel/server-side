import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useTable } from '../context/TableContext';
import { searchData } from '../api/dataService';

const SearchBar: React.FC = () => {
  const { state, dispatch } = useTable();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timerId);
  }, [searchTerm]);
  
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm) {
        dispatch({ type: 'SET_IS_SEARCHING', payload: false });
        dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
        dispatch({ type: 'SET_PAGE', payload: 0 });
        
        const { fetchData } = await import('../api/dataService');
        dispatch({ type: 'SET_LOADING', payload: true });
        
        try {
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
          console.error('Ошибка поиска:', error);
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        
        return;
      }
      
      dispatch({ type: 'SET_IS_SEARCHING', payload: true });
      dispatch({ type: 'SET_SEARCH_QUERY', payload: debouncedSearchTerm });
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const response = await searchData(debouncedSearchTerm, 0);
        
        dispatch({
          type: 'LOAD_DATA',
          payload: {
            items: response.data,
            hasMore: response.hasMore,
            total: response.total,
          },
        });
      } catch (error) {
        console.error('Ошибка поиска:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    performSearch();
  }, [debouncedSearchTerm, dispatch]);
  
  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };
  
  return (
    <div className="relative mb-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        
        <input
          type="text"
          className="
            block w-full p-3 pl-10 pr-10
            text-gray-800 border border-gray-300 rounded-lg
            bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          "
          placeholder="Поиск значений..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        {searchTerm && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={clearSearch}
            aria-label="Очистить поиск"
          >
            <X size={18} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      
      {state.isSearching && (
        <div className="mt-2 text-sm text-gray-500">
          {state.loading ? 'Поиск...' : `Найдено результатов: ${state.total}`}
        </div>
      )}
    </div>
  );
};

export default SearchBar;