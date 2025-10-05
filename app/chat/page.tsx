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
import Link from 'next/link'

export default function ChatPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
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
          setMessages(prev => [...prev, newMessage])
        }
      })
      .subscribe()

    return () => {
      messagesChannel.unsubscribe()
    }
  }, [profile, selectedContactId, supabase])

  const handleSendMessage = async (content: string) => {
    if (!profile || !selectedContactId) return

    await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: selectedContactId,
      content,
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
      {/* Header */}
      <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Scribble</h1>
          {profile && (
            <span className="text-sm text-muted-foreground">
              Welcome, {profile.username}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/invite"
            className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Invite Friends
          </Link>
          {profile?.role === 'parent' && (
            <Link
              href="/parent"
              className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Parental Controls
            </Link>
          )}
          <Link
            href="/settings"
            className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
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
            className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Contacts */}
        <div className="w-80 flex-shrink-0">
          <Sidebar
            contacts={contacts}
            selectedContactId={selectedContactId}
            onSelectContact={setSelectedContactId}
            currentUserId={profile?.id || ''}
          />
        </div>

        {/* Middle Panel - Chat Messages */}
        <div className="flex-1 flex flex-col bg-background">
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
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a contact to start chatting
            </div>
          )}
        </div>

        {/* Right Sidebar - User Info */}
        <div className="w-80 flex-shrink-0">
          <UserInfo contact={selectedContact} />
        </div>
      </div>
    </div>
  )
}

