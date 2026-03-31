'use client'

import { ChatContact } from '@/types'

export const DIARY_ID = '__diary__'

interface SidebarProps {
  contacts: ChatContact[]
  selectedContactId: string | null
  onSelectContact: (contactId: string) => void
  currentUserId: string
}

export function Sidebar({ contacts, selectedContactId, onSelectContact, currentUserId }: SidebarProps) {
  return (
    <div className="w-full h-full bg-[#171936] md:bg-card border-r border-[#2d3055] md:border-border overflow-y-auto text-[#f5f6ff] md:text-foreground">
      <div className="p-4 border-b border-[#2d3055] md:border-border">
        <h2 className="text-lg font-semibold">Chats</h2>
      </div>
      
      <div className="divide-y divide-[#2d3055] md:divide-border">
        {/* Diary entry at top */}
        <button
          onClick={() => onSelectContact(DIARY_ID)}
          className={`w-full p-4 text-left hover:bg-[#23264b] md:hover:bg-accent transition-colors flex items-center gap-3 ${
            selectedContactId === DIARY_ID ? 'bg-[#2a2d57] md:bg-accent' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="font-medium">Dagboek</p>
            <p className="text-xs text-[#9ca1c8] md:text-muted-foreground">Notities en opgeslagen berichten</p>
          </div>
        </button>

        {contacts.length === 0 ? (
          <div className="p-4 text-center text-[#9ca1c8] md:text-muted-foreground">
            Nog geen contacten. Gebruik een uitnodigingscode om te verbinden!
          </div>
        ) : (
          contacts.filter((c) => c.id !== currentUserId).map((contact) => (
            <button
              key={contact.id}
              onClick={() => onSelectContact(contact.id)}
              className={`w-full p-4 text-left hover:bg-[#23264b] md:hover:bg-accent transition-colors ${
                selectedContactId === contact.id ? 'bg-[#2a2d57] md:bg-accent' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {/* Profile picture or initials */}
                    {contact.profile_picture_url ? (
                      <div className={`w-10 h-10 rounded-full overflow-hidden transition-all duration-300 ${
                        (contact.unreadCount || 0) > 0
                          ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background' 
                          : ''
                      }`}>
                        <img
                          src={contact.profile_picture_url}
                          alt={contact.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        (contact.unreadCount || 0) > 0
                          ? 'bg-primary/20 ring-2 ring-primary/30 ring-offset-2 ring-offset-background' 
                          : 'bg-primary/10'
                      }`}>
                        <span className="text-primary font-semibold">
                          {contact.username[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Tiny dot with count - barely there */}
                    {(contact.unreadCount || 0) > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                        <span className="text-[10px] font-bold text-white leading-none">
                          {(contact.unreadCount || 0) > 9 ? '9+' : contact.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{contact.username}</p>
                    <p className="text-xs text-[#9ca1c8] md:text-muted-foreground">{contact.role === 'parent' ? 'Ouder' : 'Kind'}</p>
                  </div>
                </div>
                {contact.restricted && (
                    <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                    Beperkt
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


