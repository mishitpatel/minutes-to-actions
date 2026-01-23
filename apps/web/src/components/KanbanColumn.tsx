import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ActionItem, Status } from '../services/action-items.service';
import { DraggableActionItemCard } from './DraggableActionItemCard';

interface KanbanColumnProps {
  title: string;
  status: Status;
  items: ActionItem[];
  onAddItem?: () => void;
  onStatusChange?: (id: string, status: Status) => void;
  onItemClick?: (item: ActionItem) => void;
}

export function KanbanColumn({ title, status, items, onAddItem, onStatusChange, onItemClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'column',
      status,
    },
  });

  const columnColors = {
    todo: 'border-t-gray-400',
    doing: 'border-t-blue-500',
    done: 'border-t-green-500',
  };

  const itemIds = items.map((item) => item.id);

  return (
    <div className={`flex flex-col bg-gray-100 rounded-lg border-t-4 ${columnColors[status]} min-w-[280px] max-w-[350px] flex-1`}>
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          {onAddItem && (
            <button
              onClick={onAddItem}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Add item"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] transition-colors ${
            isOver ? 'bg-blue-50' : ''
          }`}
        >
          {items.length === 0 ? (
            <div className={`text-center py-8 rounded-lg border-2 border-dashed ${
              isOver ? 'border-blue-300 bg-blue-100' : 'border-transparent text-gray-400'
            }`}>
              <p className="text-sm">{isOver ? 'Drop here' : 'No items'}</p>
            </div>
          ) : (
            items.map((item) => (
              <DraggableActionItemCard
                key={item.id}
                item={item}
                onStatusChange={onStatusChange}
                onClick={onItemClick}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
