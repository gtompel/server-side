import React, { useCallback } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { useTable } from '../context/TableContext';
import TableRow from './TableRow';
import TableHeader from './TableHeader';
import SearchBar from './SearchBar';
import LoadingIndicator from './LoadingIndicator';

const DataTable: React.FC = () => {
  const { 
    state, 
    loadMoreItems, 
    reorderItems,
    isItemLoaded
  } = useTable();
  
  const { items, loading, hasMore } = state;
  const itemCount = (hasMore ? items.length + 1 : items.length) || 0;
  
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderItems(result.source.index, result.destination.index);
  };
  
  const getRowHeight = useCallback(() => 56, []);
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (!isItemLoaded(index) && hasMore) {
      return (
        <div style={style} className="flex items-center justify-center py-4">
          <LoadingIndicator />
        </div>
      );
    }
    
    if (index >= items.length || !items[index]) return null;
    
    return (
      <div style={style}>
        <TableRow 
          item={items[index]} 
          index={index}
        />
      </div>
    );
  };
  
  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Интерактивная таблица</h1>
      
      <SearchBar />
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <TableHeader />
        
        {loading && items.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <LoadingIndicator />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable 
              droppableId="data-table"
              mode="virtual"
              renderClone={(provided, _snapshot, rubric) => (
                <div
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  ref={provided.innerRef}
                  className="bg-blue-50 shadow-lg"
                >
                  <TableRow 
                    item={items[rubric.source.index]} 
                    index={rubric.source.index}
                    isDragging
                  />
                </div>
              )}
            >
              {(provided) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className="min-h-[500px]"
                >
                  <InfiniteLoader
                    isItemLoaded={isItemLoaded}
                    itemCount={itemCount}
                    loadMoreItems={loadMoreItems}
                  >
                    {({ onItemsRendered, ref }) => (
                      <List
                        height={500}
                        width="100%"
                        itemCount={itemCount}
                        itemSize={getRowHeight}
                        onItemsRendered={onItemsRendered}
                        ref={ref}
                      >
                        {Row}
                      </List>
                    )}
                  </InfiniteLoader>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        {state.selected.size > 0 && (
          <p>Выбрано: {state.selected.size} элемент(ов)</p>
        )}
      </div>
    </div>
  );
};

export default DataTable;