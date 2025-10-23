'use client'

import { ChatContact } from '@/types'

interface SidebarProps {
  contacts: ChatContact[]
  selectedContactId: string | null
  onSelectContact: (contactId: string) => void
  currentUserId: string
}

export function Sidebar({ contacts, selectedContactId, onSelectContact }: SidebarProps) {
  return (
    <div className="w-full h-full bg-card border-r border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Chats</h2>
      </div>
      
      <div className="divide-y divide-border">
        {contacts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No contacts yet. Use an invite code to connect!
          </div>
        ) : (
          contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onSelectContact(contact.id)}
              className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                selectedContactId === contact.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {contact.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{contact.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">{contact.role}</p>
                  </div>
                </div>
                {contact.restricted && (
                  <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                    Restricted
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}


