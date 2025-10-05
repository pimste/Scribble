'use client'

import { useState } from 'react'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  isRestricted?: boolean
}

export function MessageInput({ onSendMessage, disabled, isRestricted }: MessageInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled && !isRestricted) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  return (
    <div className="p-4 border-t border-border bg-card">
      {isRestricted && (
        <div className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
          Your account has been restricted by your parent. You cannot send messages.
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled || isRestricted}
          placeholder={isRestricted ? "Messaging restricted" : "Type a message..."}
          className="flex-1 px-4 py-2 border border-input rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled || isRestricted || !message.trim()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Send
        </button>
      </form>
    </div>
  )
}

