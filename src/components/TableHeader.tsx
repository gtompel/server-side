import React from 'react';
import { useTable } from '../context/TableContext';

const TableHeader: React.FC = () => {
  const { state, dispatch } = useTable();
  const allItemsOnPageSelected = state.items.length > 0 && 
    state.items.every(item => state.selected.has(item.id));
  
  const toggleSelectAll = () => {
    if (allItemsOnPageSelected) {
      state.items.forEach(item => {
        dispatch({ type: 'DESELECT_ITEM', payload: item.id });
      });
    } else {
      dispatch({ 
        type: 'SELECT_MULTIPLE', 
        payload: state.items.map(item => item.id) 
      });
    }
  };

  return (
    <div className="flex items-center px-4 py-3 bg-gray-100 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <button
          className={`
            w-5 h-5 rounded border 
            ${allItemsOnPageSelected 
              ? 'bg-blue-600 border-blue-600 flex items-center justify-center' 
              : 'border-gray-300'
            }
          `}
          onClick={toggleSelectAll}
          aria-label={allItemsOnPageSelected ? "Снять выделение со всех" : "Выбрать все"}
        >
          {allItemsOnPageSelected && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-3 h-3 text-white"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </button>
        
        <div className="w-5"></div>
      </div>
      
      <div className="flex-1 ml-4">
        <span className="text-gray-700 font-medium">Значение</span>
      </div>
      
      <div className="text-gray-700 font-medium">
        Номер
      </div>
    </div>
  );
};

export default TableHeader;