import React, { useState, type ReactNode } from 'react';
import { cn } from '@shared/utils';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  children?: ReactNode;
}

export function Tabs({ tabs, activeTab: controlledTab, onTabChange, className, children }: TabsProps) {
  const [internalTab, setInternalTab] = useState(tabs[0]?.id || '');
  const isControlled = controlledTab !== undefined;
  const activeTab = isControlled ? controlledTab : internalTab;

  const handleTabChange = (tabId: string) => {
    if (!isControlled) setInternalTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="border-b border-gray-200" role="tablist">
        <nav className="-mb-px flex space-x-1" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                tab.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}

export interface TabPanelProps {
  tabId: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ tabId, activeTab, children, className }: TabPanelProps) {
  if (tabId !== activeTab) return null;

  return (
    <div
      id={`tabpanel-${tabId}`}
      role="tabpanel"
      className={cn('pt-4', className)}
    >
      {children}
    </div>
  );
}
