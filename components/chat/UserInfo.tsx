'use client'

import { ChatContact } from '@/types'

interface UserInfoProps {
  contact: ChatContact | null
  onClose?: () => void
}

export function UserInfo({ contact, onClose }: UserInfoProps) {
  if (!contact) {
    return (
      <div className="w-full h-full bg-card border-l border-border p-6">
        <div className="text-center text-muted-foreground">
          Select a contact to view details
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-card border-l border-border overflow-y-auto">
      {/* Header with close button */}
      <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
        <h2 className="text-lg font-semibold">Contact Info</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center">
          {contact.profile_picture_url ? (
            <img
              src={contact.profile_picture_url}
              alt={contact.username}
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-4xl text-primary font-semibold">
                {contact.username[0].toUpperCase()}
              </span>
            </div>
          )}
          <h3 className="text-xl font-semibold">{contact.display_name || contact.username}</h3>
          <p className="text-sm text-muted-foreground">@{contact.username}</p>
          <p className="text-xs text-muted-foreground capitalize mt-1">{contact.role} Account</p>
        </div>

        {contact.bio && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">BIO</p>
            <p className="text-sm">{contact.bio}</p>
          </div>
        )}

        {contact.restricted && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive">
            <p className="text-sm text-destructive font-medium">⚠️ Account Restricted</p>
            <p className="text-xs text-destructive/80 mt-1">
              This user has been restricted from sending messages.
            </p>
          </div>
        )}

        <div className="space-y-3 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Account Type</p>
            <p className="text-sm font-medium capitalize">{contact.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}


