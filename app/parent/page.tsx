'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Profile, Message, ChatContact } from '@/types'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileNavigation } from '@/components/MobileNavigation'
import Link from 'next/link'

interface ChildWithContacts extends Profile {
  contacts: ChatContact[]
}

interface ConversationSafety {
  isSafe: boolean
  concerns: string[]
  explanation: string
  messageCount?: number
  analyzedNewOnly?: boolean
}

export default function ParentPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [children, setChildren] = useState<ChildWithContacts[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzingConversation, setAnalyzingConversation] = useState(false)
  const [analyzingNew, setAnalyzingNew] = useState(false)
  const [conversationSafety, setConversationSafety] = useState<ConversationSafety | null>(null)
  const [analysisError, setAnalysisError] = useState('')
  const [lastCheckedTimes, setLastCheckedTimes] = useState<Record<string, string>>({})
  const [showAddChild, setShowAddChild] = useState(false)
  const [addChildForm, setAddChildForm] = useState({
    displayName: '',
    username: '',
    password: '',
    birthDate: '',
  })
  const [addChildError, setAddChildError] = useState('')
  const [addChildSuccess, setAddChildSuccess] = useState('')
  const [addChildLoading, setAddChildLoading] = useState(false)
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
      
      // Load last checked times from localStorage
      const stored = localStorage.getItem(`parentChecks:${user.id}`)
      if (stored) {
        try {
          setLastCheckedTimes(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse stored check times:', e)
        }
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  useEffect(() => {
    if (!profile) return

    const fetchChildren = async () => {
      const { data: childrenData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('parent_id', profile.id)

      if (error) {
        console.error('Failed to fetch children:', error)
        setChildren([])
        return
      }

      const data = childrenData ?? []
      const childrenWithContacts = await Promise.all(
        data.map(async (child) => {
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

    fetchChildren()
  }, [profile, supabase])

  useEffect(() => {
    if (!selectedChildId || !selectedContactId) {
      setMessages([])
      setConversationSafety(null)
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

  const analyzeConversation = async (childId: string, contactId: string, onlyNew: boolean = false) => {
    if (onlyNew) {
      setAnalyzingNew(true)
    } else {
      setAnalyzingConversation(true)
    }
    
    try {
      setAnalysisError('')
      const conversationKey = `${childId}:${contactId}`
      const lastChecked = onlyNew ? lastCheckedTimes[conversationKey] : undefined
      
      const response = await fetch('/api/analyze-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          childId, 
          contactId,
          sinceTimestamp: lastChecked
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || `Analyse mislukt (${response.status})`)
      }

      setConversationSafety({
        isSafe: data.isSafe,
        concerns: data.concerns,
        explanation: data.explanation,
        messageCount: data.messageCount,
        analyzedNewOnly: data.analyzedNewOnly,
      })
      
      // Update last checked time and save to localStorage
      const now = new Date().toISOString()
      const newTimes = { ...lastCheckedTimes, [conversationKey]: now }
      setLastCheckedTimes(newTimes)
      
      if (profile) {
        localStorage.setItem(`parentChecks:${profile.id}`, JSON.stringify(newTimes))
      }
    } catch (error) {
      console.error('Error analyzing conversation:', error)
      setAnalysisError(error instanceof Error ? error.message : 'Analyseren mislukt')
    } finally {
      setAnalyzingConversation(false)
      setAnalyzingNew(false)
    }
  }

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

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddChildError('')
    setAddChildSuccess('')
    setAddChildLoading(true)

    try {
      const response = await fetch('/api/parent/add-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: addChildForm.displayName.trim() || undefined,
          username: addChildForm.username.trim(),
          password: addChildForm.password,
          birthDate: addChildForm.birthDate || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kind toevoegen mislukt')
      }

      setAddChildSuccess(`Child account created. Share username "${data.username}" and the password with your child so they can log in.`)
      setAddChildForm({ displayName: '', username: '', password: '', birthDate: '' })

      const { data: newChild } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', data.username)
        .single()

      if (newChild) {
        setChildren(prev => [...prev, { ...newChild, contacts: [] }])
      }

      setShowAddChild(false)
    } catch (err: any) {
      setAddChildError(err.message || 'Kind toevoegen mislukt')
    } finally {
      setAddChildLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('nl-NL', { 
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
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between mb-2 md:mb-0">
            <div className="flex items-center gap-3">
              <Link
                href="/chat"
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Ouderlijk toezicht</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                  Monitor en beheer de chatactiviteit van je kinderen
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto p-3 md:p-6">

        {children.length === 0 && !showAddChild ? (
          <div className="bg-card border border-border rounded-xl p-6 md:p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Geen gekoppelde kinderen</h3>
              <p className="text-muted-foreground">
                Voeg je eerste kind toe om te beginnen. Je kunt hun chats monitoren en contacten beheren vanaf hier.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => setShowAddChild(true)}
                  className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Kind toevoegen
                </button>
              </div>
            </div>
          </div>
        ) : children.length === 0 && showAddChild ? (
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4">Voeg je eerste kind toe</h3>
            <form onSubmit={handleAddChild} className="space-y-4">
              {addChildError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
                  {addChildError}
                </div>
              )}
              {addChildSuccess && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500 text-green-700 dark:text-green-400 text-sm">
                  {addChildSuccess}
                </div>
              )}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium mb-2">Naam van kind</label>
                <input
                  id="displayName"
                  type="text"
                  value={addChildForm.displayName}
                  onChange={(e) => setAddChildForm(f => ({ ...f, displayName: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Emma"
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2">Gebruikersnaam</label>
                <input
                  id="username"
                  type="text"
                  required
                  value={addChildForm.username}
                  onChange={(e) => setAddChildForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="emma123"
                />
                <p className="text-xs text-muted-foreground mt-1">Your child will use this to log in</p>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">Wachtwoord</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={addChildForm.password}
                  onChange={(e) => setAddChildForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground mt-1">Deel dit met je kind zodat ze kunnen inloggen</p>
              </div>
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium mb-2">Geboortedatum</label>
                <input
                  id="birthDate"
                  type="date"
                  value={addChildForm.birthDate}
                  onChange={(e) => setAddChildForm(f => ({ ...f, birthDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddChild(false); setAddChildError(''); setAddChildSuccess(''); }}
                  className="flex-1 py-2 px-4 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={addChildLoading}
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                >
                  {addChildLoading ? 'Toevoegen...' : 'Kind toevoegen'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Left Panel - Children List */}
            <div className="bg-card border border-border rounded-xl overflow-hidden h-fit md:h-auto">
              <div className="p-3 md:p-4 border-b border-border flex items-center justify-between gap-2">
                <h2 className="text-sm md:text-base font-semibold">Gekoppelde kinderen</h2>
                <button
                  onClick={() => setShowAddChild(true)}
                  className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Kind toevoegen
                </button>
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
                            {child.contacts.length} contact{child.contacts.length !== 1 ? 'en' : ''}
                          </p>
                        </div>
                      </div>
                      {child.restricted && (
                        <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                          Beperkt
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Middle Panel - Child Details or Contacts */}
            <div className="bg-card border border-border rounded-xl overflow-hidden h-fit md:h-auto">
              {selectedChild ? (
                <>
                  <div className="p-3 md:p-4 border-b border-border">
                    <h2 className="text-sm md:text-base font-semibold">Contacten van {selectedChild.username}</h2>
                  </div>
                  
                  <div className="p-3 md:p-4 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Berichtenstatus</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedChild.restricted ? 'Beperkt' : 'Actief'}
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
                        {selectedChild.restricted ? 'Inschakelen' : 'Beperken'}
                      </button>
                    </div>

                    {selectedChild.contacts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nog geen contacten
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
                            <p className="text-xs text-muted-foreground">{contact.role === 'parent' ? 'Ouder' : 'Kind'}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground p-6 text-center">
                  Selecteer een kind om hun gegevens te bekijken
                </div>
              )}
            </div>

            {/* Right Panel - Messages */}
            <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-fit md:h-[500px] lg:h-auto">
              {selectedContact && selectedChildId ? (
                <>
                  <div className="p-3 md:p-4">
                    <h2 className="text-sm md:text-base font-semibold mb-3">Gesprek met {selectedContact.username}</h2>
                    
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p>Nog geen gesprek</p>
                      </div>
                    ) : analysisError ? (
                      <div className="p-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-sm">
                        {analysisError}
                      </div>
                    ) : !conversationSafety ? (
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto mb-4 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0121 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2c2.12 0 4.083.668 5.693 1.796m0 0l-3.182 3.182m0 0L12 5.966" />
                        </svg>
                        <p className="text-muted-foreground mb-4">
                          <span className="font-semibold text-foreground">{messages.length}</span> bericht{messages.length !== 1 ? 'en' : ''} in dit gesprek
                        </p>
                        <div className="flex flex-col gap-2 items-center">
                          <button
                            onClick={() => analyzeConversation(selectedChildId!, selectedContactId!, false)}
                            disabled={analyzingConversation || analyzingNew}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {analyzingConversation ? (
                              <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Alles analyseren...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                Alle berichten analyseren
                              </>
                            )}
                          </button>
                          {lastCheckedTimes[`${selectedChildId}:${selectedContactId}`] && (
                            <button
                              onClick={() => analyzeConversation(selectedChildId!, selectedContactId!, true)}
                              disabled={analyzingConversation || analyzingNew}
                              className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {analyzingNew ? (
                                <>
                                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Nieuwe controleren...
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Alleen nieuwe berichten controleren
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          Berichtinhoud is privé - alleen veiligheidsanalyse wordt getoond
                        </p>
                      </div>
                    ) : (
                      <div>
                        {/* Conversation Safety Status */}
                        <div className={`p-4 md:p-6 rounded-lg ${conversationSafety.isSafe ? 'bg-green-500/10 border-2 border-green-500/30' : 'bg-red-500/10 border-2 border-red-500/30'}`}>
                          <div className="flex items-start gap-3 mb-3">
                            {conversationSafety.isSafe ? (
                              <>
                                <svg className="w-8 h-8 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0121 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2c2.12 0 4.083.668 5.693 1.796m0 0l-3.182 3.182m0 0L12 5.966" />
                                </svg>
                                <div className="flex-1">
                                  <h3 className="text-lg font-bold text-green-700 mb-1">Gesprek veilig</h3>
                                  <p className="text-sm text-green-600">Geen zorgen gedetecteerd in dit gesprek.</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div className="flex-1">
                                  <h3 className="text-lg font-bold text-red-700 mb-1">Zorgen gedetecteerd</h3>
                                  <p className="text-sm text-red-600">Bekijk de zorgen die in dit gesprek zijn gevonden.</p>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {conversationSafety.concerns.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Gevonden zorgen:</p>
                              <div className="flex flex-wrap gap-2">
                                {conversationSafety.concerns.map((concern, idx) => (
                                  <span key={idx} className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-700 font-semibold capitalize text-sm">
                                    {concern}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="pt-3 border-t border-current/10">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Analyse:</p>
                            <p className="text-sm italic">
                              {conversationSafety.explanation}
                            </p>
                          </div>
                        </div>
                        
                        {/* Message Count Info & Re-analyze Buttons */}
                        <div className="mt-4 space-y-3">
                          <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold text-foreground">{conversationSafety.messageCount ?? messages.length}</span> bericht{(conversationSafety.messageCount ?? messages.length) !== 1 ? 'en' : ''} geanalyseerd
                              {conversationSafety.analyzedNewOnly && <span className="text-emerald-600 font-semibold"> (alleen nieuwe)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Berichtinhoud is privé - alleen veiligheidsanalyse wordt getoond
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => analyzeConversation(selectedChildId!, selectedContactId!, false)}
                              disabled={analyzingConversation || analyzingNew}
                              className="w-full px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {analyzingConversation ? (
                                <>
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Opnieuw alles analyseren...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Alle berichten opnieuw analyseren
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => analyzeConversation(selectedChildId!, selectedContactId!, true)}
                              disabled={analyzingConversation || analyzingNew}
                              className="w-full px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {analyzingNew ? (
                                <>
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Nieuwe controleren...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Alleen nieuwe berichten controleren
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground p-6 text-center">
                  Selecteer een contact om berichten te bekijken
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Child Modal (when user has children) */}
      {showAddChild && children.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Kind toevoegen</h3>
            <form onSubmit={handleAddChild} className="space-y-4">
              {addChildError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
                  {addChildError}
                </div>
              )}
              {addChildSuccess && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500 text-green-700 dark:text-green-400 text-sm">
                  {addChildSuccess}
                </div>
              )}
              <div>
                <label htmlFor="modal-displayName" className="block text-sm font-medium mb-2">Naam van kind</label>
                <input
                  id="modal-displayName"
                  type="text"
                  value={addChildForm.displayName}
                  onChange={(e) => setAddChildForm(f => ({ ...f, displayName: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Emma"
                />
              </div>
              <div>
                <label htmlFor="modal-username" className="block text-sm font-medium mb-2">Gebruikersnaam</label>
                <input
                  id="modal-username"
                  type="text"
                  required
                  value={addChildForm.username}
                  onChange={(e) => setAddChildForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="emma123"
                />
                <p className="text-xs text-muted-foreground mt-1">Your child will use this to log in</p>
              </div>
              <div>
                <label htmlFor="modal-password" className="block text-sm font-medium mb-2">Wachtwoord</label>
                <input
                  id="modal-password"
                  type="password"
                  required
                  minLength={6}
                  value={addChildForm.password}
                  onChange={(e) => setAddChildForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground mt-1">Deel dit met je kind zodat ze kunnen inloggen</p>
              </div>
              <div>
                <label htmlFor="modal-birthDate" className="block text-sm font-medium mb-2">Birth Date</label>
                <input
                  id="modal-birthDate"
                  type="date"
                  value={addChildForm.birthDate}
                  onChange={(e) => setAddChildForm(f => ({ ...f, birthDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddChild(false); setAddChildError(''); setAddChildSuccess(''); }}
                  className="flex-1 py-2 px-4 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={addChildLoading}
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                >
                  {addChildLoading ? 'Toevoegen...' : 'Kind toevoegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <MobileNavigation isParent={true} />
    </div>
  )
}

