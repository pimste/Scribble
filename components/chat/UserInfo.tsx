'use client'

import { ChatContact } from '@/types'

interface UserInfoProps {
  contact: ChatContact | null
}

export function UserInfo({ contact }: UserInfoProps) {
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
    <div className="w-full h-full bg-card border-l border-border p-6 overflow-y-auto">
      <div className="space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-4xl text-primary font-semibold">
              {contact.username[0].toUpperCase()}
            </span>
          </div>
          <h3 className="text-xl font-semibold">{contact.username}</h3>
          <p className="text-sm text-muted-foreground capitalize">{contact.role} Account</p>
        </div>

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

