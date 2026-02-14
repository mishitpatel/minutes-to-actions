import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { ActionItemWithSource, Status } from '../services/action-items.service';
import { DraggableActionItemCard } from './DraggableActionItemCard';
import { Button } from './ui/button';

interface KanbanColumnProps {
  title: string;
  status: Status;
  items: ActionItemWithSource[];
  onAddItem?: () => void;
  onStatusChange?: (id: string, status: Status) => void;
  onItemClick?: (item: ActionItemWithSource) => void;
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
    <div className={`flex flex-col bg-muted rounded-lg border-t-4 ${columnColors[status]} min-w-[280px] max-w-[350px] flex-1`} data-testid={`column-${status}`}>
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <span className="text-sm text-muted-foreground bg-background px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          {onAddItem && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onAddItem}
              title="Add item"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] transition-colors ${
            isOver ? 'bg-accent/50' : ''
          }`}
        >
          {items.length === 0 ? (
            <div className={`text-center py-8 rounded-lg border-2 border-dashed ${
              isOver ? 'border-primary/30 bg-accent' : 'border-transparent text-muted-foreground'
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
