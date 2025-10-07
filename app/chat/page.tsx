'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Profile, Message, ChatContact } from '@/types'
import { Sidebar } from '@/components/chat/Sidebar'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { UserInfo } from '@/components/chat/UserInfo'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileNavigation } from '@/components/MobileNavigation'
import Link from 'next/link'

type MobileView = 'contacts' | 'chat' | 'info'

export default function ChatPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileView, setMobileView] = useState<MobileView>('contacts')
  const router = useRouter()
  const supabase = createClient()

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
        const contactIds = contactsData.map(c => 
          c.user1_id === profile.id ? c.user2_id : c.user1_id
        )

        if (contactIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, role, restricted')
            .in('id', contactIds)

          if (profilesData) {
            setContacts(profilesData as ChatContact[])
          }
        }
      }
    }

    fetchContacts()

    // Subscribe to contact changes
    const contactsChannel = supabase
      .channel('contacts-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'contacts',
        filter: `user1_id=eq.${profile.id},user2_id=eq.${profile.id}`
      }, () => {
        fetchContacts()
      })
      .subscribe()

    return () => {
      contactsChannel.unsubscribe()
    }
  }, [profile, supabase])

  // Fetch messages for selected contact
  useEffect(() => {
    if (!profile || !selectedContactId) {
      setMessages([])
      return
    }

    const fetchMessages = async () => {
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${selectedContactId}),and(sender_id.eq.${selectedContactId},receiver_id.eq.${profile.id})`)
        .order('created_at', { ascending: true })

      if (messagesData) {
        setMessages(messagesData)
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const newMessage = payload.new as Message
        if (
          (newMessage.sender_id === profile.id && newMessage.receiver_id === selectedContactId) ||
          (newMessage.sender_id === selectedContactId && newMessage.receiver_id === profile.id)
        ) {
          // Prevent duplicate messages - only add if not already in the list
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMessage.id)
            if (exists) {
              return prev
            }
            return [...prev, newMessage]
          })
        }
      })
      .subscribe()

    return () => {
      messagesChannel.unsubscribe()
    }
  }, [profile, selectedContactId, supabase])

  const handleSendMessage = async (content: string) => {
    if (!profile || !selectedContactId) return

    // Create optimistic message with temporary ID
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: profile.id,
      receiver_id: selectedContactId,
      content,
      created_at: new Date().toISOString(),
    }

    // Add message optimistically to show it immediately
    setMessages(prev => [...prev, optimisticMessage])

    // Insert to database
    const { data, error } = await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: selectedContactId,
      content,
    }).select().single()

    if (error) {
      console.error('Error sending message:', error)
      // Remove optimistic message if there was an error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
    } else if (data) {
      // Replace optimistic message with real message from database
      setMessages(prev => 
        prev.map(m => m.id === optimisticMessage.id ? data as Message : m)
      )
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId)
    setMobileView('chat')
  }

  const selectedContact = contacts.find(c => c.id === selectedContactId) || null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Desktop/Tablet Header */}
      <div className="h-14 md:h-16 border-b border-border bg-card px-3 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile back button */}
          {mobileView !== 'contacts' && (
            <button
              onClick={() => setMobileView(selectedContactId ? 'chat' : 'contacts')}
              className="md:hidden p-2 hover:bg-accent rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <h1 className="text-xl md:text-2xl font-bold">
            {mobileView === 'contacts' || !selectedContact ? 'Scribble' : selectedContact.username}
          </h1>
          
          {profile && (
            <span className="hidden lg:block text-sm text-muted-foreground">
              Welcome, {profile.username}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
          {/* Mobile info button when in chat */}
          {mobileView === 'chat' && selectedContact && (
            <button
              onClick={() => setMobileView('info')}
              className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              title="Contact Info"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          {/* Desktop navigation buttons */}
          <Link
            href="/invite"
            className="hidden md:flex px-3 lg:px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="hidden lg:inline">Invite</span>
          </Link>
          
          {profile?.role === 'parent' && (
            <Link
              href="/parent"
              className="hidden md:flex px-3 lg:px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="hidden lg:inline">Parent</span>
            </Link>
          )}
          
          <Link
            href="/settings"
            className="hidden md:flex p-2 rounded-lg border border-border hover:bg-accent transition-colors"
            title="Settings"
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
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex overflow-hidden pb-16 md:pb-0">
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
          flex-1 flex flex-col bg-background
          ${mobileView === 'chat' ? 'flex' : 'hidden'}
          md:flex
        `}>
          {selectedContactId ? (
            <>
              <MessageList messages={messages} currentUserId={profile?.id || ''} />
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={!profile}
                isRestricted={profile?.restricted}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
              <svg className="w-24 h-24 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg font-medium">Select a contact to start chatting</p>
              <p className="text-sm mt-2">Choose a conversation from the list</p>
            </div>
          )}
        </div>

        {/* Right Sidebar - User Info (Desktop only on large screens, Tablet: hidden, Mobile: view-based) */}
        <div className={`
          w-full md:w-0 lg:w-80 xl:w-96 flex-shrink-0 overflow-hidden
          ${mobileView === 'info' ? 'block md:hidden' : 'hidden'}
          lg:block
        `}>
          <UserInfo contact={selectedContact} />
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation isParent={profile?.role === 'parent'} />
    </div>
  )
}

