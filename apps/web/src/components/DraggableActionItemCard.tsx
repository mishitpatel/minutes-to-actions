import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActionItemCard } from './ActionItemCard';
import type { ActionItem, Status } from '../services/action-items.service';

interface DraggableActionItemCardProps {
  item: ActionItem & { meeting_note?: { id: string; title: string | null } | null };
  onStatusChange?: (id: string, status: Status) => void;
  onClick?: (item: ActionItem) => void;
}

export function DraggableActionItemCard({ item, onStatusChange, onClick }: DraggableActionItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'item',
      item,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ActionItemCard
        item={item}
        onStatusChange={onStatusChange}
        onClick={onClick}
      />
    </div>
  );
}
