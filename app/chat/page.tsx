'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Profile, Message, ChatContact } from '@/types'
import { Sidebar, DIARY_ID } from '@/components/chat/Sidebar'
import { MessageList, type MessageListHandle } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { UserInfo } from '@/components/chat/UserInfo'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileNavigation } from '@/components/MobileNavigation'
import { AppTour } from '@/components/tour/AppTour'
import Link from 'next/link'

type MobileView = 'contacts' | 'chat' | 'info'

export default function ChatPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileView, setMobileView] = useState<MobileView>('contacts')
  const [showUserInfo, setShowUserInfo] = useState(true)
  const [showTour, setShowTour] = useState(false)
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set())
  const [senderNames, setSenderNames] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createClient()
  const messageListRef = useRef<MessageListHandle>(null)

  const isDiaryView = selectedContactId === DIARY_ID

  // Fix layout when keyboard dismisses on mobile (input blur or viewport resize)
  useEffect(() => {
    let lastHeight = typeof window !== 'undefined' ? window.visualViewport?.height ?? window.innerHeight : 0
    const handleViewportResize = () => {
      const vv = window.visualViewport
      if (vv && vv.height > lastHeight) {
        messageListRef.current?.scrollToBottom()
      }
      lastHeight = vv?.height ?? window.innerHeight
    }
    window.visualViewport?.addEventListener('resize', handleViewportResize)
    return () => window.visualViewport?.removeEventListener('resize', handleViewportResize)
  }, [])

  // Fetch user profile and check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        
        // Check if user has seen tour before
        const hasSeenTour = localStorage.getItem(`tour_completed_${user.id}`)
        if (!hasSeenTour) {
          // Show tour for new users after a brief delay
          setTimeout(() => setShowTour(true), 1000)
        }
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  // Fetch contacts
  useEffect(() => {
    if (!profile) return

    const fetchContacts = async () => {
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)

      if (contactsData) {
        const contactIds = contactsData
          .map(c => c.user1_id === profile.id ? c.user2_id : c.user1_id)
          .filter(id => id !== profile.id) // Exclude self-contact (diary)

        if (contactIds.length === 0) {
          setContacts([])
        } else {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, display_name, bio, role, restricted, accent_color, profile_picture_url')
            .in('id', contactIds)

          if (profilesData) {
            const contactsWithCounts = await Promise.all(
              profilesData.map(async (contact) => {
                // Get last viewed timestamp from localStorage
                const lastViewedKey = `lastViewed:${profile.id}:${contact.id}`
                const lastViewed = localStorage.getItem(lastViewedKey)
                
                // Count unread messages (messages from contact to current user after last viewed)
                let query = supabase
                  .from('messages')
                  .select('id', { count: 'exact', head: true })
                  .eq('sender_id', contact.id)
                  .eq('receiver_id', profile.id)
                
                if (lastViewed) {
                  query = query.gt('created_at', lastViewed)
                }
                
                const { count } = await query
                
                return {
                  ...contact,
                  unreadCount: count || 0
                }
              })
            )
            
            setContacts(contactsWithCounts as ChatContact[])
          }
        }
      }
    }

    fetchContacts()

    // Subscribe to contact changes with unique channel name
    const contactsChannelName = `contacts:${profile.id}`
    const contactsChannel = supabase
      .channel(contactsChannelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'contacts',
      }, (payload) => {
        // Refresh contacts when any contact change occurs
        console.log('Contact change detected:', payload)
        fetchContacts()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Contacts subscription active')
        }
      })

    // Subscribe to all incoming messages to update unread counts
    const allMessagesChannelName = `all-messages:${profile.id}`
    const allMessagesChannel = supabase
      .channel(allMessagesChannelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${profile.id}`
      }, (payload) => {
        const newMessage = payload.new as Message
        
        // Only update count if not viewing this contact's conversation
        if (newMessage.sender_id !== selectedContactId) {
          setContacts(prev => 
            prev.map(c => 
              c.id === newMessage.sender_id 
                ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                : c
            )
          )
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('All messages subscription active')
        }
      })

    return () => {
      supabase.removeChannel(contactsChannel)
      supabase.removeChannel(allMessagesChannel)
    }
  }, [profile, supabase])

  // Fetch messages for selected contact or diary
  useEffect(() => {
    if (!profile || !selectedContactId) {
      setMessages([])
      setSavedMessageIds(new Set())
      setSenderNames({})
      return
    }

    const fetchMessages = async () => {
      if (selectedContactId === DIARY_ID) {
        // Ensure self-contact exists for diary
        const { data: existingSelfContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('user1_id', profile.id)
          .eq('user2_id', profile.id)
          .single()

        if (!existingSelfContact) {
          await supabase.from('contacts').insert({
            user1_id: profile.id,
            user2_id: profile.id,
          })
        }

        // Fetch self-messages (notes to self)
        const { data: selfMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('sender_id', profile.id)
          .eq('receiver_id', profile.id)
          .order('created_at', { ascending: true })

        // Fetch saved messages
        const { data: savedRows } = await supabase
          .from('user_saved_messages')
          .select('message_id')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })

        const savedIds = savedRows?.map(r => r.message_id) || []
        let savedMessagesData: Message[] | null = null
        if (savedIds.length > 0) {
          const { data } = await supabase
            .from('messages')
            .select('*')
            .in('id', savedIds)
          savedMessagesData = data

          if (savedMessagesData) {
            const orderMap = new Map(savedIds.map((id, i) => [id, i]))
            const sorted = [...savedMessagesData].sort(
              (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
            )
            const selfIds = new Set((selfMessages || []).map(m => m.id))
            const merged = [
              ...(selfMessages || []),
              ...sorted.filter(m => !selfIds.has(m.id))
            ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            setMessages(merged)
          } else {
            setMessages(selfMessages || [])
          }
        } else {
          setMessages(selfMessages || [])
        }
        setSavedMessageIds(new Set(savedIds))

        const allDiaryMessages = (() => {
          if (savedIds.length > 0 && savedMessagesData) {
            const selfIds = new Set((selfMessages || []).map(m => m.id))
            const merged = [
              ...(selfMessages || []),
              ...savedMessagesData.filter(m => !selfIds.has(m.id))
            ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            return merged
          }
          return selfMessages || []
        })()
        const senderIds = [...new Set(allDiaryMessages.map(m => m.sender_id))]
        const otherSenderIds = senderIds.filter(id => id !== profile.id)
        if (otherSenderIds.length > 0) {
          const { data: senderProfiles } = await supabase
            .from('profiles')
            .select('id, username, display_name')
            .in('id', otherSenderIds)
          const names: Record<string, string> = { [profile.id]: 'Jij' }
          senderProfiles?.forEach(p => {
            names[p.id] = p.display_name || p.username
          })
          setSenderNames(names)
        } else {
          setSenderNames({ [profile.id]: 'Jij' })
        }
      } else {
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${selectedContactId}),and(sender_id.eq.${selectedContactId},receiver_id.eq.${profile.id})`)
          .order('created_at', { ascending: true })

        if (messagesData) {
          setMessages(messagesData)
          const ids = messagesData.map(m => m.id)
          if (ids.length > 0) {
            const { data: savedRows } = await supabase
              .from('user_saved_messages')
              .select('message_id')
              .eq('user_id', profile.id)
              .in('message_id', ids)
            setSavedMessageIds(new Set((savedRows || []).map(r => r.message_id)))
          } else {
            setSavedMessageIds(new Set())
          }
        } else {
          setMessages([])
          setSavedMessageIds(new Set())
        }
        setSenderNames({})
      }
    }

    fetchMessages()

    const channelName = `messages:${[profile.id, selectedContactId].sort().join('-')}`
    const messagesChannel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const newMessage = payload.new as Message

        if (selectedContactId === DIARY_ID) {
          if (newMessage.sender_id === profile.id && newMessage.receiver_id === profile.id) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev
              return [...prev, newMessage].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )
            })
          }
        } else if (
          (newMessage.sender_id === profile.id && newMessage.receiver_id === selectedContactId) ||
          (newMessage.sender_id === selectedContactId && newMessage.receiver_id === profile.id)
        ) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
          if (newMessage.sender_id === selectedContactId && newMessage.receiver_id === profile.id) {
            const lastViewedKey = `lastViewed:${profile.id}:${selectedContactId}`
            localStorage.setItem(lastViewedKey, new Date().toISOString())
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Real-time subscription active for:', channelName)
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error for:', channelName)
        }
      })

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [profile, selectedContactId, supabase])

  const handleSendMessage = async (content: string, contentType: 'text' | 'gif' | 'image' = 'text', mediaUrl?: string) => {
    if (!profile || !selectedContactId) return

    const receiverId = selectedContactId === DIARY_ID ? profile.id : selectedContactId

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: profile.id,
      receiver_id: receiverId,
      content,
      content_type: contentType,
      media_url: mediaUrl,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, optimisticMessage])

    const { data, error } = await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: receiverId,
      content,
      content_type: contentType,
      media_url: mediaUrl,
    }).select().single()

    if (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
    } else if (data) {
      setMessages(prev => 
        prev.map(m => m.id === optimisticMessage.id ? data as Message : m)
      )
    }
  }

  const handleSaveToDiary = async (messageId: string) => {
    if (!profile) return
    const { error } = await supabase.from('user_saved_messages').insert({
      user_id: profile.id,
      message_id: messageId,
    })
    if (!error) {
      setSavedMessageIds(prev => new Set([...prev, messageId]))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleCloseTour = () => {
    setShowTour(false)
    if (profile) {
      localStorage.setItem(`tour_completed_${profile.id}`, 'true')
    }
  }

  const handleStartTour = () => {
    setShowTour(true)
  }

  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId)
    setMobileView('chat')

    if (contactId !== DIARY_ID && profile) {
      const lastViewedKey = `lastViewed:${profile.id}:${contactId}`
      localStorage.setItem(lastViewedKey, new Date().toISOString())
      setContacts(prev => 
        prev.map(c => c.id === contactId ? { ...c, unreadCount: 0 } : c)
      )
    }
  }

  const selectedContact = selectedContactId === DIARY_ID ? null : contacts.find(c => c.id === selectedContactId) || null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden text-foreground dark:bg-[#11132c] dark:text-[#f5f6ff] md:dark:bg-background md:dark:text-foreground">
      {/* Desktop/Tablet Header */}
      <div className="h-14 md:h-16 border-b border-border bg-card px-3 md:px-6 flex items-center justify-between dark:border-[#2d3055] dark:bg-[#171936] md:dark:border-border md:dark:bg-card">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile back button */}
          {mobileView !== 'contacts' && (
            <button
              onClick={() => {
                if (mobileView === 'info') setMobileView('chat')
                else setMobileView('contacts')
              }}
              className="md:hidden p-2 hover:bg-accent dark:hover:bg-[#262a52] md:dark:hover:bg-accent rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <h1 className="text-xl md:text-2xl font-bold">
            {mobileView === 'contacts' ? 'Scribble' : isDiaryView ? 'Dagboek' : selectedContact?.username ?? 'Scribble'}
          </h1>
          
          {profile && (
            <span className="hidden lg:block text-sm text-muted-foreground dark:text-[#9ca1c8] md:dark:text-muted-foreground">
              Welkom, {profile.username}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
          {/* Mobile info button when in chat */}
          {mobileView === 'chat' && (selectedContact || isDiaryView) && (
            <button
              onClick={() => setMobileView('info')}
              className="md:hidden p-2 rounded-lg hover:bg-accent dark:hover:bg-[#262a52] md:dark:hover:bg-accent transition-colors"
              title="Contactinfo"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          {/* Desktop info toggle button when chat or diary is selected */}
          {(selectedContact || isDiaryView) && (
            <button
              onClick={() => setShowUserInfo(!showUserInfo)}
              className="hidden lg:flex p-2 rounded-lg border border-border hover:bg-accent transition-colors"
              title={showUserInfo ? "Verberg contactinfo" : "Toon contactinfo"}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          {/* Tour button */}
          <button
            onClick={handleStartTour}
            className="hidden md:flex p-2 rounded-lg border border-border hover:bg-accent transition-colors"
            title="Rondleiding"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Desktop navigation buttons */}
          <Link
            href="/invite"
            className="hidden md:flex px-3 lg:px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="hidden lg:inline">Uitnodigen</span>
          </Link>
          
          {profile?.role === 'parent' && (
            <Link
              href="/parent"
              className="hidden md:flex px-3 lg:px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="hidden lg:inline">Ouder</span>
            </Link>
          )}
          
          <Link
            href="/settings"
            className="hidden md:flex p-2 rounded-lg border border-border hover:bg-accent transition-colors"
            title="Instellingen"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          
          <ThemeToggle />
          
          <button
            onClick={handleLogout}
            className="hidden md:flex px-3 lg:px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-sm font-medium"
          >
            Uitloggen
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex min-w-0 overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Left Sidebar - Contacts (Desktop: always visible, Tablet: collapsible, Mobile: view-based) */}
        <div className={`
          w-full md:w-80 lg:w-96 flex-shrink-0
          ${mobileView === 'contacts' ? 'block' : 'hidden'}
          md:block
        `}>
          <Sidebar
            contacts={contacts}
            selectedContactId={selectedContactId}
            onSelectContact={handleSelectContact}
            currentUserId={profile?.id || ''}
          />
        </div>

        {/* Middle Panel - Chat Messages */}
        <div className={`
          flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-background dark:bg-[#11132c] md:dark:bg-background
          ${mobileView === 'chat' ? 'flex' : 'hidden'}
          md:flex
        `}>
          {selectedContactId ? (
            <>
              <MessageList 
                ref={messageListRef}
                messages={messages} 
                currentUserId={profile?.id || ''} 
                userAccentColor={profile?.accent_color || 'blue'}
                isDiaryView={isDiaryView}
                savedMessageIds={savedMessageIds}
                onSaveToDiary={handleSaveToDiary}
                senderNames={senderNames}
              />
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={!profile}
                isRestricted={!isDiaryView && !!profile?.restricted}
                onInputBlur={() => messageListRef.current?.scrollToBottom()}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground dark:text-[#9ca1c8] md:dark:text-muted-foreground p-6 text-center">
              <svg className="w-24 h-24 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg font-medium">Selecteer een contact om te chatten</p>
              <p className="text-sm mt-2">Kies een gesprek uit de lijst</p>
            </div>
          )}
        </div>

        {/* Right Sidebar - User Info (Desktop only on large screens, Tablet: hidden, Mobile: view-based) */}
        {showUserInfo && (
          <div className={`
            w-full md:w-0 lg:w-80 xl:w-96 flex-shrink-0 overflow-hidden
            ${mobileView === 'info' ? 'block md:hidden' : 'hidden'}
            lg:block
          `}>
            <UserInfo 
              contact={selectedContact} 
              onClose={() => {
                setShowUserInfo(false)
                if (mobileView === 'info') setMobileView('chat')
              }}
              isDiaryView={isDiaryView}
            />
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation 
        isParent={profile?.role === 'parent'}
        onStartTour={handleStartTour}
      />

      {/* App Tour */}
      <AppTour 
        isOpen={showTour} 
        onClose={handleCloseTour}
        userRole={profile?.role}
      />
    </div>
  )
}

