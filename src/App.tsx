import React, { useEffect, useState, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { arrayMove } from '@dnd-kit/sortable';
import DataListHeader from './components/DataListHeader';
import VirtualizedList from './components/VirtualizedList';
import { fetchData, saveSelections, getSelections, saveSortOrder, getSortOrder } from './api/dataService';
import type { DataItem } from './types';

function App() {
  const [items, setItems] = useState<DataItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [localSortOrder, setLocalSortOrder] = useState<number[]>([]);

  // Обработчик поиска с задержкой
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setItems([]);
      setPage(0);
      setHasMore(true);
      loadData(0, value);
    }, 300),
    []
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const loadData = async (pageNum: number, searchValue: string = search) => {
    if (!hasMore && pageNum !== 0) return;
    
    try {
      setIsLoading(true);
      const response = await fetchData(pageNum, 20, searchValue);
      
      if (response && response.items) {
        setItems(prev => pageNum === 0 ? response.items : [...prev, ...response.items]);
        setTotalItems(response.total || 0);
        setHasMore(response.hasMore || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      // Устанавливаем безопасные значения по умолчанию при ошибке
      setItems([]);
      setTotalItems(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadData(page + 1);
    }
  };

  const handleToggleSelect = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
    saveSelections(Array.from(newSelected));
  };

  const handleSortEnd = (oldIndex: number, newIndex: number) => {
    if (!items || items.length === 0) return;
    
    // Обновляем порядок элементов в массиве
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    
    // Обновляем локальный порядок сортировки и сохраняем на сервере
    const newSortOrder = [...localSortOrder];
    const itemIdsInCurrentView = items.map(item => item.id);
    
    // Удаляем элементы, которые находятся в текущем представлении
    const filteredSortOrder = newSortOrder.filter(id => !itemIdsInCurrentView.includes(id));
    
    // Добавляем все элементы в их новом порядке
    const updatedSortOrder = [...filteredSortOrder, ...newItems.map(item => item.id)];
    setLocalSortOrder(updatedSortOrder);
    saveSortOrder(updatedSortOrder);
  };

  // Загрузка начальных данных и сохраненного состояния
  useEffect(() => {
    const initialize = async () => {
      try {
        // Загружаем выбранные пользователем элементы
        const savedSelections = await getSelections();
        if (savedSelections && Array.isArray(savedSelections)) {
          setSelectedItems(new Set(savedSelections));
        }
        
        // Загружаем порядок сортировки
        const savedSortOrder = await getSortOrder();
        if (savedSortOrder && Array.isArray(savedSortOrder)) {
          setLocalSortOrder(savedSortOrder);
        }
        
        // Загружаем начальные данные
        await loadData(0);
      } catch (error) {
        console.error('Ошибка инициализации данных:', error);
        // Устанавливаем безопасные значения по умолчанию
        setItems([]);
        setTotalItems(0);
        setSelectedItems(new Set());
        setLocalSortOrder([]);
      }
    };
    
    initialize();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <DataListHeader 
          search={search}
          onSearchChange={handleSearchChange}
          totalItems={totalItems}
          selectedCount={selectedItems.size}
        />
        
        <VirtualizedList 
          items={items}
          hasMore={hasMore}
          isLoading={isLoading}
          selectedItems={selectedItems}
          onToggleSelect={handleToggleSelect}
          onLoadMore={handleLoadMore}
          onSortEnd={handleSortEnd}
        />
      </div>
    </div>
  );
}

export default App;