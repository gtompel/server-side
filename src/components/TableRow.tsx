import React, { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Check, GripVertical } from 'lucide-react';
import { DataItem } from '../types';
import { useTable } from '../context/TableContext';

interface TableRowProps {
  item: DataItem;
  index: number;
  isDragging?: boolean;
}

const TableRow: React.FC<TableRowProps> = ({ item, index, isDragging = false }) => {
  const { state, toggleItemSelection } = useTable();
  const isSelected = state.selected.has(item.id);
  
  const rowContent = (
    <div 
      className={`
        flex items-center px-4 py-3 border-b border-gray-200 
        ${isSelected ? 'bg-blue-50' : 'bg-white'} 
        ${isDragging ? 'shadow-lg bg-blue-50' : ''}
        hover:bg-gray-50 transition-colors duration-150
      `}
    >
      <div className="flex items-center space-x-3">
        <button
          className={`
            w-5 h-5 rounded border 
            ${isSelected 
              ? 'bg-blue-600 border-blue-600 flex items-center justify-center' 
              : 'border-gray-300'
            }
          `}
          onClick={() => toggleItemSelection(item.id)}
          aria-label={isSelected ? "Снять выделение" : "Выделить"}
        >
          {isSelected && <Check size={16} className="text-white" />}
        </button>
        
        <div className="flex items-center cursor-grab">
          <GripVertical size={18} className="text-gray-400" />
        </div>
      </div>
      
      <div className="flex-1 ml-4">
        <span className="text-gray-800">{item.value}</span>
      </div>
      
      <div className="text-gray-500 text-sm">
        ID: {item.id}
      </div>
    </div>
  );

  return (
    <Draggable draggableId={`item-${item.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.8 : 1
          }}
        >
          {rowContent}
        </div>
      )}
    </Draggable>
  );
};

export default memo(TableRow);