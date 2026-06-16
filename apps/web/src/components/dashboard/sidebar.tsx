'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { Avatar } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Bot,
  BookOpen,
  Ticket,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  BookOpenText,
  UserCircle,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { UserRole } from '@/types';
import type { ReactNode } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Overview',
    href: '',
    icon: <LayoutDashboard className="h-4 w-4" />,
    roles: ['admin', 'business_owner', 'agent'],
  },
  {
    label: 'Companies',
    href: '/companies',
    icon: <Building2 className="h-4 w-4" />,
    roles: ['admin'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: <Users className="h-4 w-4" />,
    roles: ['admin'],
  },
  {
    label: 'Subscriptions',
    href: '/subscriptions',
    icon: <CreditCard className="h-4 w-4" />,
    roles: ['admin'],
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    roles: ['admin', 'business_owner'],
  },
  {
    label: 'AI Usage',
    href: '/ai-usage',
    icon: <Zap className="h-4 w-4" />,
    roles: ['admin'],
  },
  {
    label: 'Conversations',
    href: '/conversations',
    icon: <MessageSquare className="h-4 w-4" />,
    roles: ['business_owner', 'agent'],
  },
  {
    label: 'Agents',
    href: '/agents',
    icon: <Bot className="h-4 w-4" />,
    roles: ['business_owner'],
  },
  {
    label: 'Knowledge Base',
    href: '/knowledge-base',
    icon: <BookOpenText className="h-4 w-4" />,
    roles: ['business_owner', 'agent'],
  },
  {
    label: 'Tickets',
    href: '/tickets',
    icon: <Ticket className="h-4 w-4" />,
    roles: ['business_owner', 'agent'],
  },
  {
    label: 'Team',
    href: '/team',
    icon: <UserCircle className="h-4 w-4" />,
    roles: ['business_owner'],
  },
  {
    label: 'Billing',
    href: '/billing',
    icon: <CreditCard className="h-4 w-4" />,
    roles: ['business_owner'],
  },
  {
    label: 'Customers',
    href: '/customers',
    icon: <Users className="h-4 w-4" />,
    roles: ['agent'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="h-4 w-4" />,
    roles: ['admin', 'business_owner'],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  role: UserRole;
}

export function Sidebar({ collapsed, onToggle, role }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  const getHref = (href: string) => {
    const base = role === 'admin' ? '/admin' : role === 'business_owner' ? '/business' : '/agent';
    return href ? `${base}${href}` : base;
  };

  const isActive = (href: string) => {
    const fullHref = getHref(href);
    if (!href) return pathname === fullHref;
    return pathname.startsWith(fullHref);
  };

  const roleLabel = role === 'admin' ? 'Admin' : role === 'business_owner' ? 'Business' : 'Agent';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-full flex-col border-r bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link href={getHref('')} className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            AC
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-sidebar-foreground truncate">
              AI Chatbot
            </span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className={cn(
            'ml-auto rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed && 'mx-auto',
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2">
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={getHref(item.href)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-2',
                )}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-sidebar-border p-3">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar
            size="sm"
            src={user?.avatar}
            fallback={getInitials(user?.firstName, user?.lastName)}
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60 capitalize">{roleLabel}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
