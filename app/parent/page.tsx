'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Profile, Message, ChatContact } from '@/types'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'

interface ChildWithContacts extends Profile {
  contacts: ChatContact[]
}

export default function ParentPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [children, setChildren] = useState<ChildWithContacts[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

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

      if (!profileData) {
        router.push('/login')
        return
      }

      if (profileData.role !== 'parent') {
        router.push('/chat')
        return
      }

      setProfile(profileData)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  useEffect(() => {
    if (!profile) return

    const fetchChildren = async () => {
      const { data: childrenData } = await supabase
        .from('profiles')
        .select('*')
        .eq('parent_id', profile.id)

      if (childrenData) {
        const childrenWithContacts = await Promise.all(
          childrenData.map(async (child) => {
            const { data: contactsData } = await supabase
              .from('contacts')
              .select('*')
              .or(`user1_id.eq.${child.id},user2_id.eq.${child.id}`)

            const contactIds = contactsData?.map(c => 
              c.user1_id === child.id ? c.user2_id : c.user1_id
            ) || []

            let contacts: ChatContact[] = []
            if (contactIds.length > 0) {
              const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, username, role, restricted')
                .in('id', contactIds)

              contacts = profilesData as ChatContact[] || []
            }

            return { ...child, contacts }
          })
        )

        setChildren(childrenWithContacts)
      }
    }

    fetchChildren()
  }, [profile, supabase])

  useEffect(() => {
    if (!selectedChildId || !selectedContactId) {
      setMessages([])
      return
    }

    const fetchMessages = async () => {
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${selectedChildId},receiver_id.eq.${selectedContactId}),and(sender_id.eq.${selectedContactId},receiver_id.eq.${selectedChildId})`)
        .order('created_at', { ascending: true })

      if (messagesData) {
        setMessages(messagesData)
      }
    }

    fetchMessages()
  }, [selectedChildId, selectedContactId, supabase])

  const handleToggleRestriction = async (childId: string, currentRestricted: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ restricted: !currentRestricted })
      .eq('id', childId)

    if (!error) {
      setChildren(prev => 
        prev.map(child => 
          child.id === childId 
            ? { ...child, restricted: !currentRestricted }
            : child
        )
      )
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const selectedChild = children.find(c => c.id === selectedChildId)
  const selectedContact = selectedChild?.contacts.find(c => c.id === selectedContactId)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="container max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <Link
            href="/chat"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Chat
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Parental Controls</h1>
          <p className="text-muted-foreground">
            Monitor and manage your children's chat activity
          </p>
        </div>

        {children.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">No Linked Children</h3>
              <p className="text-muted-foreground">
                Share your parent code with your child during their registration to link their account.
              </p>
              <div className="pt-4">
                <Link
                  href="/invite"
                  className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  View Your Parent Code
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {/* Left Panel - Children List */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold">Linked Children</h2>
              </div>
              <div className="divide-y divide-border">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      setSelectedChildId(child.id)
                      setSelectedContactId(null)
                    }}
                    className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                      selectedChildId === child.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {child.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{child.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {child.contacts.length} contact{child.contacts.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {child.restricted && (
                        <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                          Restricted
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Middle Panel - Child Details or Contacts */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {selectedChild ? (
                <>
                  <div className="p-4 border-b border-border">
                    <h2 className="font-semibold">{selectedChild.username}'s Contacts</h2>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Messaging Status</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedChild.restricted ? 'Restricted' : 'Active'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleRestriction(selectedChild.id, selectedChild.restricted)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedChild.restricted
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        }`}
                      >
                        {selectedChild.restricted ? 'Enable' : 'Restrict'}
                      </button>
                    </div>

                    {selectedChild.contacts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No contacts yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedChild.contacts.map((contact) => (
                          <button
                            key={contact.id}
                            onClick={() => setSelectedContactId(contact.id)}
                            className={`w-full p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left ${
                              selectedContactId === contact.id ? 'bg-accent' : ''
                            }`}
                          >
                            <p className="font-medium">{contact.username}</p>
                            <p className="text-xs text-muted-foreground capitalize">{contact.role}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground p-6 text-center">
                  Select a child to view their details
                </div>
              )}
            </div>

            {/* Right Panel - Messages */}
            <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
              {selectedContact && selectedChildId ? (
                <>
                  <div className="p-4 border-b border-border">
                    <h2 className="font-semibold">Messages with {selectedContact.username}</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No messages yet
                      </p>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.sender_id === selectedChildId
                              ? 'bg-primary/10 ml-4'
                              : 'bg-muted mr-4'
                          }`}
                        >
                          <p className="text-sm font-medium mb-1">
                            {message.sender_id === selectedChildId ? selectedChild?.username : selectedContact.username}
                          </p>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground p-6 text-center">
                  Select a contact to view messages
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

