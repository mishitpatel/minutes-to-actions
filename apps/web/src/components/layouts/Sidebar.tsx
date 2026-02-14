import { NavLink } from 'react-router-dom';
import { FileText, LayoutDashboard, Share2, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ThemeToggle';
import { Separator } from '../ui/separator';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout, isLoggingOut } = useAuth();

  const navItems = [
    {
      to: '/notes',
      label: 'Meeting Notes',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      to: '/board',
      label: 'Action Board',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      to: '/share',
      label: 'Share Board',
      icon: <Share2 className="w-5 h-5" />,
      disabled: true,
    },
  ];

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo/Branding */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">Minutes to Actions</h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.disabled ? '#' : item.to}
            onClick={item.disabled ? (e) => e.preventDefault() : handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                item.disabled
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
            {item.disabled && (
              <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                Soon
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>

      <Separator />

      {/* User Section */}
      <div className="p-4">
        {user && (
          <div className="flex items-center gap-3 mb-3" data-testid="user-menu">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="secondary"
          className="w-full"
          onClick={logout}
          disabled={isLoggingOut}
          data-testid="logout-button"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? 'Signing out...' : 'Sign out'}
        </Button>
      </div>
    </div>
  );
}
