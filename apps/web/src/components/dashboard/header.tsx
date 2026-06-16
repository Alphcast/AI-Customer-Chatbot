'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

const breadcrumbMap: Record<string, string> = {
  '': 'Overview',
  companies: 'Companies',
  users: 'Users',
  subscriptions: 'Subscriptions',
  analytics: 'Analytics',
  'ai-usage': 'AI Usage',
  conversations: 'Conversations',
  agents: 'Agents',
  'knowledge-base': 'Knowledge Base',
  tickets: 'Tickets',
  team: 'Team',
  billing: 'Billing',
  customers: 'Customers',
  settings: 'Settings',
};

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [notifications] = useState([
    { id: '1', title: 'New conversation assigned', read: false },
    { id: '2', title: 'Ticket #1234 resolved', read: false },
    { id: '3', title: 'Agent "Support Bot" went offline', read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const segments = pathname.split('/').filter(Boolean).slice(1);
  const role = segments[0];
  const pageSegments = segments.slice(1);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <button
        onClick={onMenuToggle}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav className="hidden md:flex items-center gap-1.5 text-sm">
        <span className="capitalize text-muted-foreground">{role?.replace('_', ' ') || 'Dashboard'}</span>
        {pageSegments.map((seg, i) => {
          const label = breadcrumbMap[seg] || seg.replace(/[-_]/g, ' ');
          return (
            <span key={seg} className="flex items-center gap-1.5">
              <span className="text-muted-foreground">/</span>
              <span className={cn(i === pageSegments.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </span>
            </span>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-48 pl-8 lg:w-64"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="relative rounded-md p-1.5 text-muted-foreground hover:bg-muted">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72" align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem key={n.id}>
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        'mt-1 h-2 w-2 shrink-0 rounded-full',
                        n.read ? 'bg-transparent' : 'bg-primary',
                      )}
                    />
                    <div>
                      <p className="text-sm">{n.title}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar
                size="sm"
                src={user?.avatar}
                fallback={getInitials(user?.firstName, user?.lastName)}
              />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/${role}/settings`)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              Help
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
