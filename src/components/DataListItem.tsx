import React from 'react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DataListItemProps {
  item: { id: number; value: string };
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
}

const DataListItem: React.FC<DataListItemProps> = ({ item, isSelected, onToggleSelect }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.05)' : undefined,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-3 border-b border-gray-200 hover:bg-gray-50 
                 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
    >
      <div 
        className="mr-3 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </div>
      
      <div className="mr-3">
        <input 
          type="checkbox" 
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
        />
      </div>
      
      <div className="text-gray-800">
        <span className="font-medium text-gray-600">{item.id}:</span> {item.value}
      </div>
    </div>
  );
};

export default DataListItem;