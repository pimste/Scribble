'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { EmojiClickData } from 'emoji-picker-react'

// Dynamically import emoji picker to reduce initial bundle size
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

interface MessageInputProps {
  onSendMessage: (content: string, contentType?: 'text' | 'gif', mediaUrl?: string) => void
  disabled?: boolean
  isRestricted?: boolean
}

interface GifResult {
  id: string
  title: string
  url: string
  preview: string
  width: number
  height: number
}

export function MessageInput({ onSendMessage, disabled, isRestricted }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [gifSearch, setGifSearch] = useState('')
  const [gifs, setGifs] = useState<GifResult[]>([])
  const [loadingGifs, setLoadingGifs] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const gifPickerRef = useRef<HTMLDivElement>(null)

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target as Node)) {
        setShowGifPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search GIFs with debounce
  useEffect(() => {
    if (!gifSearch || !showGifPicker) return

    const timeoutId = setTimeout(async () => {
      setLoadingGifs(true)
      try {
        const response = await fetch(`/api/search-gifs?q=${encodeURIComponent(gifSearch)}&limit=20`)
        const data = await response.json()
        setGifs(data.gifs || [])
      } catch (error) {
        console.error('Error searching GIFs:', error)
      } finally {
        setLoadingGifs(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [gifSearch, showGifPicker])

  // Load trending GIFs on open
  useEffect(() => {
    if (showGifPicker && !gifSearch) {
      setLoadingGifs(true)
      fetch('/api/search-gifs?q=happy&limit=20')
        .then(res => res.json())
        .then(data => {
          setGifs(data.gifs || [])
          setLoadingGifs(false)
        })
        .catch(err => {
          console.error('Error loading trending GIFs:', err)
          setLoadingGifs(false)
        })
    }
  }, [showGifPicker])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled && !isRestricted) {
      onSendMessage(message.trim(), 'text')
      setMessage('')
    }
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji)
  }

  const handleGifSelect = (gif: GifResult) => {
    onSendMessage(gif.title, 'gif', gif.url)
    setShowGifPicker(false)
    setGifSearch('')
  }

  return (
    <div className="p-4 border-t border-border bg-card">
      {isRestricted && (
        <div className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
          Your account has been restricted by your parent. You cannot send messages.
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2 items-center">
          {/* Emoji Picker Button */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker)
                setShowGifPicker(false)
              }}
              disabled={disabled || isRestricted}
              className="p-2 hover:bg-accent rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add emoji"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 left-0 z-50">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>

          {/* GIF Picker Button */}
          <div className="relative" ref={gifPickerRef}>
            <button
              type="button"
              onClick={() => {
                setShowGifPicker(!showGifPicker)
                setShowEmojiPicker(false)
              }}
              disabled={disabled || isRestricted}
              className="p-2 hover:bg-accent rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
              title="Add GIF"
            >
              GIF
            </button>
            {showGifPicker && (
              <div className="absolute bottom-full mb-2 left-0 z-50 w-80 h-96 bg-card border border-border rounded-lg shadow-lg overflow-hidden flex flex-col">
                <div className="p-3 border-b border-border">
                  <input
                    type="text"
                    value={gifSearch}
                    onChange={(e) => setGifSearch(e.target.value)}
                    placeholder="Search GIFs..."
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2">
                  {loadingGifs ? (
                    <div className="col-span-2 flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : gifs.length === 0 ? (
                    <div className="col-span-2 text-center text-muted-foreground py-8">
                      No GIFs found
                    </div>
                  ) : (
                    gifs.map((gif) => (
                      <button
                        key={gif.id}
                        type="button"
                        onClick={() => handleGifSelect(gif)}
                        className="relative aspect-square overflow-hidden rounded-lg hover:ring-2 hover:ring-primary transition-all"
                      >
                        <img
                          src={gif.preview}
                          alt={gif.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={disabled || isRestricted}
            placeholder={isRestricted ? "Messaging restricted" : "Type a message..."}
            className="flex-1 px-4 py-2 border border-input rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={disabled || isRestricted || !message.trim()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}


