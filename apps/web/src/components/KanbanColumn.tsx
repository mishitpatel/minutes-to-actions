import type { ActionItem, Status, Priority } from '../services/action-items.service';

interface KanbanColumnProps {
  title: string;
  status: Status;
  items: ActionItem[];
  onAddItem?: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getPriorityBadge(priority: Priority) {
  const styles = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[priority]}`}>
      {priority}
    </span>
  );
}

function ActionItemCard({ item }: { item: ActionItem }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
      <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
        {item.title}
      </h4>
      <div className="flex items-center justify-between">
        {getPriorityBadge(item.priority)}
        {item.due_date && (
          <span className="text-xs text-gray-500">
            {formatDate(item.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

export function KanbanColumn({ title, status, items, onAddItem }: KanbanColumnProps) {
  const columnColors = {
    todo: 'border-t-gray-400',
    doing: 'border-t-blue-500',
    done: 'border-t-green-500',
  };

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

      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No items</p>
          </div>
        ) : (
          items.map((item) => (
            <ActionItemCard key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}
