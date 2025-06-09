import React, { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ArrowDown } from 'lucide-react';
import DataListItem from './DataListItem';
import type { DataItem } from '../types';

interface VirtualizedListProps {
  items: DataItem[];
  hasMore: boolean;
  isLoading: boolean;
  selectedItems: Set<number>;
  onToggleSelect: (id: number) => void;
  onLoadMore: () => void;
  onSortEnd: (oldIndex: number, newIndex: number) => void;
}

const VirtualizedList: React.FC<VirtualizedListProps> = ({
  items = [],
  hasMore = false,
  isLoading = false,
  selectedItems = new Set(),
  onToggleSelect,
  onLoadMore,
  onSortEnd
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items?.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const handleScroll = () => {
      if (!parentRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
      
      if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !isLoading) {
        onLoadMore();
      }
    };
    
    const element = parentRef.current;
    element?.addEventListener('scroll', handleScroll);
    
    return () => element?.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, onLoadMore]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && items?.length > 0) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onSortEnd(oldIndex, newIndex);
      }
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-md">
        <p className="text-gray-500">Элементы не найдены</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto border border-gray-200 rounded-md bg-white"
      >
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          <SortableContext
            items={items.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {virtualizer.getVirtualItems().map(virtualRow => {
              const item = items[virtualRow.index];
              if (!item) return null;
              
              return (
                <div
                  key={virtualRow.index}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <DataListItem
                    item={item}
                    isSelected={selectedItems.has(item.id)}
                    onToggleSelect={onToggleSelect}
                  />
                </div>
              );
            })}
          </SortableContext>
        </div>

        {isLoading && (
          <div className="flex justify-center p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">Загрузка дополнительных элементов...</span>
            </div>
          </div>
        )}

        {hasMore && !isLoading && (
          <div className="flex justify-center p-4 border-t border-gray-200">
            <button 
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              onClick={onLoadMore}
            >
              <ArrowDown size={16} />
              <span>Загрузить еще</span>
            </button>
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default VirtualizedList;