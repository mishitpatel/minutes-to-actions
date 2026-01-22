import { useAuth } from '../hooks/useAuth';
import { useActionItems } from '../hooks/useActionItems';
import { KanbanColumn } from '../components/KanbanColumn';

export function BoardPage() {
  const { user, logout, isLoggingOut } = useAuth();
  const { items, isLoading, isError, refetch } = useActionItems();

  const handleAddItem = () => {
    // Placeholder for Task 3.7 - manual creation modal
    console.log('Add item clicked');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Minutes to Actions
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                {user.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700">{user.name}</span>
              </div>
            )}
            <button
              onClick={logout}
              disabled={isLoggingOut}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Action Board</h2>
          <button
            onClick={handleAddItem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Item
          </button>
        </div>

        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        )}

        {isError && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <svg
                className="w-12 h-12 text-red-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Failed to load action items
              </h3>
              <p className="text-gray-500 mb-4">
                There was an error loading your action board.
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="flex gap-6 overflow-x-auto pb-4">
            <KanbanColumn
              title="To Do"
              status="todo"
              items={items.todo}
              onAddItem={handleAddItem}
            />
            <KanbanColumn
              title="Doing"
              status="doing"
              items={items.doing}
            />
            <KanbanColumn
              title="Done"
              status="done"
              items={items.done}
            />
          </div>
        )}
      </main>
    </div>
  );
}
