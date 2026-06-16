'use client';

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuContextType {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null);

function useDropdown() {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error('DropdownMenu compound components must be used within DropdownMenu');
  return ctx;
}

function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ children, className }: { children: ReactNode; className?: string }) {
  const { open, setOpen } = useDropdown();
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={cn('inline-block cursor-pointer', className)}
      onClick={() => setOpen(!open)}
    >
      {children}
    </div>
  );
}

function DropdownMenuContent({
  children,
  className,
  align = 'start',
}: {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end';
}) {
  const { open, setOpen } = useDropdown();
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    },
    [setOpen],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, handleClickOutside]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setOpen(false)}
      />
      <div
        ref={ref}
        className={cn(
          'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-slide-in-from-top',
          align === 'end' ? 'right-0' : 'left-0',
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}

function DropdownMenuItem({
  children,
  className,
  onClick,
  ...props
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = useDropdown();

  const handleClick = () => {
    setOpen(false);
    onClick?.();
  };

  return (
    <div
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <div className={cn('-mx-1 my-1 h-px bg-border', className)} />
  );
}

function DropdownMenuLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('px-2 py-1.5 text-sm font-semibold', className)}
    >
      {children}
    </div>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
