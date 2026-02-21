'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/types'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  userAccentColor?: 'blue' | 'purple' | 'pink' | 'red' | 'orange' | 'yellow' | 'green' | 'teal'
  isDiaryView?: boolean
  savedMessageIds?: Set<string>
  onSaveToDiary?: (messageId: string) => void
  senderNames?: Record<string, string>
}

const accentColorClasses = {
  blue: 'bg-blue-500 text-white',
  purple: 'bg-purple-500 text-white',
  pink: 'bg-pink-500 text-white',
  red: 'bg-red-500 text-white',
  orange: 'bg-orange-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  green: 'bg-green-500 text-white',
  teal: 'bg-teal-500 text-white',
}

export function MessageList({ messages, currentUserId, userAccentColor = 'blue', isDiaryView = false, savedMessageIds = new Set(), onSaveToDiary, senderNames = {} }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateLabel = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })
  }

  const renderContent = () => {
    let lastDate = ''
    return messages.map((message) => {
      const msgDate = message.created_at.split('T')[0]
      const showDateSeparator = msgDate !== lastDate
      if (showDateSeparator) lastDate = msgDate

      const isOwn = message.sender_id === currentUserId
      const isSending = message.id.startsWith('temp-')
      const isGif = message.content_type === 'gif' && message.media_url
      const isImage = message.content_type === 'image' && message.media_url
      const hasMedia = isGif || isImage
      const isSaved = savedMessageIds.has(message.id)
      const senderName = isDiaryView ? (senderNames[message.sender_id] ?? 'Unknown') : null

      return (
        <div key={message.id} className="space-y-1">
          {showDateSeparator && (
            <div className="flex justify-center py-3">
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                {formatDateLabel(message.created_at)}
              </span>
            </div>
          )}
          <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
            <div className={`flex flex-col min-w-0 ${isOwn ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
              {isDiaryView && senderName && (
                <span className="text-xs font-medium text-muted-foreground mb-0.5 px-1">
                  {senderName}
                </span>
              )}
              <div
                className={`rounded-2xl overflow-hidden ${
                  hasMedia ? 'p-2' : 'px-4 py-2'
                } ${
                  isOwn
                    ? `${accentColorClasses[userAccentColor]}`
                    : 'bg-muted text-foreground'
                } ${isSending ? 'opacity-70' : 'opacity-100'} transition-opacity`}
              >
                {(isGif || isImage) ? (
                  <div className="space-y-1">
                    <div className="relative rounded-lg overflow-hidden min-w-0 w-full max-w-[min(100%,20rem)]">
                      <img
                        src={message.media_url}
                        alt={message.content}
                        className="w-full max-w-full h-auto max-h-[50vh] sm:max-h-64 object-contain"
                        loading="lazy"
                      />
                    </div>
                    {message.content && message.content !== 'Image' && (
                      <p className="text-xs px-2 opacity-80">{message.content}</p>
                    )}
                  </div>
                ) : (
                  <p className="break-words whitespace-pre-wrap">{message.content}</p>
                )}
                <div className={`flex items-center gap-1 text-xs mt-1 ${
                    hasMedia ? 'px-2' : ''
                  } ${
                    isOwn ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                  <span>{formatTime(message.created_at)}</span>
                  {!isDiaryView && onSaveToDiary && (
                    <button
                      type="button"
                      onClick={() => onSaveToDiary(message.id)}
                      className={`p-0.5 rounded hover:bg-black/10 transition-colors ${
                        isSaved ? 'text-amber-500' : 'opacity-60 hover:opacity-100'
                      }`}
                      title={isSaved ? 'Saved to diary' : 'Save to diary'}
                    >
                      <svg className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  )}
                  {isOwn && (
                    <span className="flex items-center">
                      {isSending ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    })
  }

  return (
    <div className="flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          {isDiaryView ? 'No notes yet. Write something to yourself or save messages from chats!' : 'No messages yet. Start the conversation!'}
        </div>
      ) : (
        renderContent()
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}

