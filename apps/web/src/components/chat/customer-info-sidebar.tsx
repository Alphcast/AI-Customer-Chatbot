'use client';

import { useState, useCallback } from 'react';
import {
  Mail,
  Phone,
  MessageSquare,
  Ticket,
  FileText,
  Plus,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, getInitials } from '@/lib/utils';
import type { Customer, Ticket as TicketType } from '@/types';

interface CustomerInfoSidebarProps {
  customer: Customer | null;
  previousConversations?: number;
  openTickets?: TicketType[];
  onViewConversation?: (conversationId: string) => void;
  onViewTicket?: (ticketId: string) => void;
  onAddNote?: (note: string) => Promise<void>;
  isLoading?: boolean;
}

export function CustomerInfoSidebar({
  customer,
  previousConversations = 0,
  openTickets = [],
  onViewConversation,
  onViewTicket,
  onAddNote,
  isLoading,
}: CustomerInfoSidebarProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const handleAddNote = useCallback(async () => {
    if (!note.trim() || !onAddNote) return;
    setSavingNote(true);
    try {
      await onAddNote(note.trim());
      setNote('');
      setShowNoteInput(false);
    } finally {
      setSavingNote(false);
    }
  }, [note, onAddNote]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">No customer selected</p>
        </div>
      </div>
    );
  }

  const customFields = customer.metadata
    ? Object.entries(customer.metadata).filter(
        ([key]) => !['isOnline', 'notes'].includes(key),
      )
    : [];

  const notes = customer.metadata?.notes as string | undefined;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin" role="region" aria-label="Customer information">
      <div className="p-4 space-y-5">
        <div className="flex flex-col items-center text-center">
          <Avatar
            src={customer.avatar}
            fallback={getInitials(customer.firstName, customer.lastName)}
            size="xl"
            alt={`${customer.firstName || ''} ${customer.lastName || ''}`}
          />
          <h3 className="mt-2 font-semibold">
            {customer.firstName || ''} {customer.lastName || ''}
          </h3>
          <p className="text-xs text-muted-foreground">Customer</p>
        </div>

        {customer.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a href={`mailto:${customer.email}`} className="truncate hover:underline text-primary">
              {customer.email}
            </a>
          </div>
        )}

        {customer.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a href={`tel:${customer.phone}`} className="hover:underline">
              {customer.phone}
            </a>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Customer since {formatDate(customer.createdAt)}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-muted/30 text-center">
            <p className="text-lg font-semibold">{previousConversations}</p>
            <p className="text-xs text-muted-foreground">Conversations</p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30 text-center">
            <p className="text-lg font-semibold">{openTickets.length}</p>
            <p className="text-xs text-muted-foreground">Open Tickets</p>
          </div>
        </div>

        {openTickets.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Open Tickets
            </h4>
            <div className="space-y-1.5">
              {openTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => onViewTicket?.(ticket.id)}
                  className="flex items-center gap-2 w-full p-2 rounded-lg border hover:bg-accent/50 transition-colors text-left"
                  aria-label={`View ticket: ${ticket.title}`}
                >
                  <Ticket className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{ticket.title}</p>
                    <Badge
                      variant={
                        ticket.priority === 'urgent' || ticket.priority === 'high'
                          ? 'destructive'
                          : ticket.priority === 'medium'
                            ? 'warning'
                            : 'secondary'
                      }
                      className="h-4 text-[9px] px-1 mt-0.5"
                    >
                      {ticket.priority}
                    </Badge>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {customFields.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Custom Fields
            </h4>
            <div className="space-y-1.5">
              {customFields.map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="font-medium truncate ml-2">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Notes
            </h4>
            {!showNoteInput && onAddNote && (
              <button
                onClick={() => setShowNoteInput(true)}
                className="p-0.5 hover:bg-accent rounded"
                aria-label="Add note"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {notes && (
            <div className="p-2 rounded-lg bg-muted/30 mb-2">
              <p className="text-xs whitespace-pre-wrap">{notes}</p>
            </div>
          )}

          {showNoteInput && (
            <div className="space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this customer..."
                rows={3}
                className="w-full text-xs rounded-md border border-input bg-background px-2 py-1.5 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Customer note"
              />
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNoteInput(false);
                    setNote('');
                  }}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!note.trim() || savingNote}
                  isLoading={savingNote}
                  className="h-7 text-xs"
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
