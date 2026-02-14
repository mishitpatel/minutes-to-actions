import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user, logout, isLoggingOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">
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
                <span className="text-sm text-muted-foreground">{user.name}</span>
              </div>
            )}
            <button
              onClick={logout}
              disabled={isLoggingOut}
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">
            Welcome, {user?.name}!
          </h2>
          <p className="text-muted-foreground">
            Meeting Notes Inbox coming soon. This is where you&apos;ll paste your meeting notes
            and extract action items.
          </p>
        </div>
      </main>
    </div>
  );
}
