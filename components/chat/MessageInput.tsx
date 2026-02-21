'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { EmojiClickData } from 'emoji-picker-react'

// Dynamically import emoji picker to reduce initial bundle size
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

interface MessageInputProps {
  onSendMessage: (content: string, contentType?: 'text' | 'gif' | 'image', mediaUrl?: string) => void
  disabled?: boolean
  isRestricted?: boolean
  onInputBlur?: () => void
}

interface GifResult {
  id: string
  title: string
  url: string
  preview: string
  width: number
  height: number
}

export function MessageInput({ onSendMessage, disabled, isRestricted, onInputBlur }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [gifSearch, setGifSearch] = useState('')
  const [gifs, setGifs] = useState<GifResult[]>([])
  const [loadingGifs, setLoadingGifs] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const gifPickerRef = useRef<HTMLDivElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target as Node)) {
        setShowGifPicker(false)
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false)
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || disabled || isRestricted) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/upload-message-image', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed')
      onSendMessage(message.trim() || 'Image', 'image', data.url)
      setMessage('')
    } catch (err) {
      console.error('Error uploading image:', err)
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const handleInputBlur = () => {
    onInputBlur?.()
    requestAnimationFrame(() => {
      inputContainerRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    })
  }

  return (
    <div ref={inputContainerRef} className="p-4 border-t border-border bg-card min-w-0 overflow-hidden">
      {isRestricted && (
        <div className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
          Your account has been restricted by your parent. You cannot send messages.
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative min-w-0">
        <div className="flex gap-2 items-center min-w-0">
          {/* Emoji Picker Button */}
          <div className="relative flex-shrink-0" ref={emojiPickerRef}>
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
              <div className="absolute bottom-full mb-2 left-0 z-50 max-h-[50vh] overflow-y-auto">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>

          {/* Attach menu: Image + GIF under a + button */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <div className="relative flex-shrink-0" ref={attachMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(!showAttachMenu)
                setShowEmojiPicker(false)
              }}
              disabled={disabled || isRestricted}
              className="p-2 hover:bg-accent rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {showAttachMenu && (
              <div className="absolute bottom-full left-0 mb-2 flex flex-col gap-2 items-center z-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false)
                    setShowGifPicker(true)
                  }}
                  disabled={disabled || isRestricted}
                  className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 flex items-center justify-center transition-transform font-bold text-sm"
                  title="GIF"
                >
                  GIF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false)
                    imageInputRef.current?.click()
                  }}
                  disabled={disabled || isRestricted || uploadingImage}
                  className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 flex items-center justify-center transition-transform"
                  title="Image"
                >
                  {uploadingImage ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* GIF Picker (opens from attach menu) */}
          <div className="relative flex-shrink-0" ref={gifPickerRef}>
            {showGifPicker && (
              <div className="absolute bottom-full mb-2 left-0 z-50 w-80 h-96 max-w-[min(320px,calc(100vw-2rem))] max-h-[min(384px,60vh)] bg-card border border-border rounded-lg shadow-lg overflow-hidden flex flex-col">
                <div className="p-3 border-b border-border">
                  <input
                    type="text"
                    value={gifSearch}
                    onChange={(e) => setGifSearch(e.target.value)}
                    placeholder="Search GIFs..."
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2 auto-rows-max">
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
                        className="relative overflow-hidden rounded-lg hover:ring-2 hover:ring-primary transition-all bg-muted"
                      >
                        <img
                          src={gif.preview}
                          alt={gif.title}
                          className="w-full h-auto"
                          loading="lazy"
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
            onBlur={handleInputBlur}
            disabled={disabled || isRestricted}
            placeholder={isRestricted ? "Messaging restricted" : "Type a message..."}
            className="flex-1 min-w-0 px-4 py-2 border border-input rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={disabled || isRestricted || !message.trim()}
            className="flex-shrink-0 px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}


