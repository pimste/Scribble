'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/types'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileNavigation } from '@/components/MobileNavigation'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

function InvitePageContent() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const codeFromUrl = searchParams.get('code')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        const returnUrl = codeFromUrl ? `/invite?code=${encodeURIComponent(codeFromUrl)}` : '/invite'
        router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`)
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
    }

    checkAuth()
  }, [router, supabase, codeFromUrl])

  useEffect(() => {
    if (codeFromUrl && profile) {
      setInviteCode(codeFromUrl.trim())
    }
  }, [codeFromUrl, profile])

  const handleCopyCode = () => {
    if (profile?.invite_code) {
      navigator.clipboard.writeText(profile.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!profile) throw new Error('Not authenticated')

      // Find user by invite code
      const { data: targetProfile, error: findError } = await supabase
        .from('profiles')
        .select('id')
        .eq('invite_code', inviteCode)
        .single()

      if (findError || !targetProfile) {
        throw new Error('Ongeldige uitnodigingscode')
      }

      if (targetProfile.id === profile.id) {
        throw new Error('Je kunt jezelf niet als contact toevoegen')
      }

      // Check if contact already exists
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .or(`and(user1_id.eq.${profile.id},user2_id.eq.${targetProfile.id}),and(user1_id.eq.${targetProfile.id},user2_id.eq.${profile.id})`)
        .single()

      if (existingContact) {
        throw new Error('Dit contact bestaat al')
      }

      // Create contact
      const { error: insertError } = await supabase
        .from('contacts')
        .insert({
          user1_id: profile.id,
          user2_id: targetProfile.id,
        })

      if (insertError) throw insertError

      setSuccess('Contact succesvol toegevoegd!')
      setInviteCode('')
      
      setTimeout(() => {
        router.push('/chat')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Contact toevoegen mislukt')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
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
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Vrienden uitnodigen</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                  Deel je code om met vrienden te verbinden
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto p-3 md:p-6">
        <div className="space-y-4 md:space-y-6">

          {/* Invite Code - Parents and Children */}
          <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-2 border-green-500/20 rounded-xl p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold">Je vriendencode</h2>
                  <p className="text-xs md:text-sm text-muted-foreground">Deel met vrienden om te verbinden</p>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="p-3 md:p-4 bg-card rounded-lg border border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-1 md:mb-2">JOUW UITNODIGINGSCODE</p>
                  <p className="font-mono text-sm md:text-lg break-all">{profile.invite_code}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex-1 py-2 md:py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    {copied ? (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Gekopieerd!
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Kopiëren
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="flex-1 py-2 md:py-3 px-4 bg-card border border-border hover:bg-accent rounded-lg transition-colors font-medium flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    QR-code
                  </button>
                </div>
              </div>
            </div>

          {/* QR Code Modal */}
          {showQrModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowQrModal(false)}
            >
              <div
                className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Scan om te verbinden</h3>
                  <button
                    onClick={() => setShowQrModal(false)}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                    aria-label="Sluiten"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex justify-center p-4 bg-white rounded-lg dark:bg-white">
                  <QRCodeSVG
                    value={typeof window !== 'undefined' ? `${window.location.origin}/invite?code=${profile.invite_code}` : ''}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Laat een vriend deze QR-code scannen om je toe te voegen
                </p>
              </div>
            </div>
          )}

          {/* Add Contact Section */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-3 md:space-y-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-1 md:mb-2">Vriend toevoegen</h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Voer iemands uitnodigingscode in om te chatten
              </p>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3 md:space-y-4">
              {codeFromUrl && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500 text-green-600 dark:text-green-400 text-sm">
                  Code gevonden! Klik op Contact toevoegen om te verbinden.
                </div>
              )}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500 text-green-600 dark:text-green-400 text-sm">
                  {success}
                </div>
              )}

              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium mb-2">
                  Uitnodigingscode van vriend
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  placeholder="Voer uitnodigingscode in"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 md:py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    Contact toevoegen...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Contact toevoegen
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation isParent={profile?.role === 'parent'} />
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    }>
      <InvitePageContent />
    </Suspense>
  )
}
