import React from 'react';
import { Search, Info } from 'lucide-react';

interface DataListHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  totalItems: number;
  selectedCount: number;
}

const DataListHeader: React.FC<DataListHeaderProps> = ({ 
  search, 
  onSearchChange, 
  totalItems = 0,
  selectedCount = 0
}) => {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Визуализация данных</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Info size={16} />
            Всего {(totalItems || 0).toLocaleString()} элементов
          </span>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="search"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Поиск элементов..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        {selectedCount > 0 && (
          <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Выбрано {selectedCount} элемент{selectedCount === 1 ? '' : selectedCount < 5 ? 'а' : 'ов'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataListHeader;