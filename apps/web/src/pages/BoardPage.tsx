import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus, AlertTriangle } from 'lucide-react';
import { useActionItems, useMoveActionItem, useUpdateActionItemStatus } from '../hooks/useActionItems';
import { KanbanColumn } from '../components/KanbanColumn';
import { ActionItemCard } from '../components/ActionItemCard';
import { ActionItemDetailModal } from '../components/ActionItemDetailModal';
import { ActionItemCreateModal } from '../components/ActionItemCreateModal';
import { Button } from '../components/ui/button';
import { Spinner } from '../components/ui/spinner';
import type { Status, ActionItemWithSource } from '../services/action-items.service';

export function BoardPage() {
  const { items, isLoading, isError, refetch } = useActionItems();
  const updateStatus = useUpdateActionItemStatus();
  const moveItem = useMoveActionItem();
  const [activeItem, setActiveItem] = useState<ActionItemWithSource | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<Status>('todo');

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

  const handleAddItem = (status: Status = 'todo') => {
    setCreateDefaultStatus(status);
    setIsCreateModalOpen(true);
  };

  const handleStatusChange = (id: string, status: Status) => {
    updateStatus.mutate({ id, status });
  };

  const handleItemClick = (item: ActionItemWithSource) => {
    setSelectedItemId(item.id);
  };

  const findItemById = (id: string): { item: ActionItemWithSource; status: Status } | null => {
    for (const status of ['todo', 'doing', 'done'] as Status[]) {
      const item = items[status].find((i) => i.id === id);
      if (item) {
        return { item, status };
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const result = findItemById(active.id as string);
    if (result) {
      setActiveItem(result.item);
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback is handled by the column's isOver state
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const result = findItemById(activeId);
    if (!result) return;

    const { status: fromStatus } = result;

    // Determine the target status
    let toStatus: Status;
    let newPosition: number;

    // Check if dropped on a column
    if (['todo', 'doing', 'done'].includes(over.id as string)) {
      toStatus = over.id as Status;
      // Dropped directly on column - add to end
      newPosition = items[toStatus].length;
      if (fromStatus === toStatus) {
        // Same column, no change needed
        return;
      }
    } else {
      // Dropped on another item
      const overResult = findItemById(over.id as string);
      if (!overResult) return;

      toStatus = overResult.status;
      const overIndex = items[toStatus].findIndex((i) => i.id === over.id);

      if (fromStatus === toStatus) {
        // Reordering within the same column
        const fromIndex = items[fromStatus].findIndex((i) => i.id === activeId);
        if (fromIndex === overIndex) return;

        newPosition = overIndex;
      } else {
        // Moving to a different column
        newPosition = overIndex;
      }
    }

    // Execute the move
    moveItem.mutate({
      id: activeId,
      fromStatus,
      toStatus,
      newPosition,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Action Board</h2>
        <Button
          onClick={() => handleAddItem()}
          data-testid="create-action-item"
        >
          <Plus className="h-5 w-5" />
          Add Item
        </Button>
      </div>

      {isLoading && (
        <div className="bg-card rounded-lg shadow p-8">
          <div className="flex items-center justify-center">
            <Spinner />
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-card rounded-lg shadow p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Failed to load action items
            </h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading your action board.
            </p>
            <Button onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4" data-testid="kanban-board">
            <KanbanColumn
              title="To Do"
              status="todo"
              items={items.todo}
              onAddItem={() => handleAddItem('todo')}
              onStatusChange={handleStatusChange}
              onItemClick={handleItemClick}
            />
            <KanbanColumn
              title="Doing"
              status="doing"
              items={items.doing}
              onAddItem={() => handleAddItem('doing')}
              onStatusChange={handleStatusChange}
              onItemClick={handleItemClick}
            />
            <KanbanColumn
              title="Done"
              status="done"
              items={items.done}
              onAddItem={() => handleAddItem('done')}
              onStatusChange={handleStatusChange}
              onItemClick={handleItemClick}
            />
          </div>

          <DragOverlay>
            {activeItem ? (
              <div className="rotate-3 scale-105">
                <ActionItemCard
                  item={activeItem}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <ActionItemDetailModal
        itemId={selectedItemId}
        onClose={() => setSelectedItemId(null)}
        onDeleted={() => setSelectedItemId(null)}
      />

      <ActionItemCreateModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultStatus={createDefaultStatus}
      />
    </div>
  );
}
