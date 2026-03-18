'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { ThemeToggle } from '@/components/theme-toggle'

export default function RegisterPage() {
  const [step, setStep] = useState<'role' | 'details' | 'verify'>('role')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRoleSelection = () => {
    setStep('details')
  }

  const handleSendCode = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Verificatiecode versturen mislukt')
      }

      const data = await response.json()
      if (!data.verificationToken) {
        throw new Error('Verificatietoken ontbreekt')
      }

      setVerificationToken(data.verificationToken)
      setCodeSent(true)
      setStep('verify')
    } catch (err: any) {
      setError(err.message || 'Verificatiecode versturen mislukt')
    } finally {
      setLoading(false)
    }
  }

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Verify the code first
      const verifyResponse = await fetch(
        `/api/auth/send-code?email=${encodeURIComponent(email)}&code=${verificationCode}&token=${encodeURIComponent(verificationToken)}`
      )

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json()
        throw new Error(data.error || 'Ongeldige verificatiecode')
      }

      // Create Supabase account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/chat`,
          data: {
            username,
            role: 'parent'
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Aanmaken van gebruiker mislukt')

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          email,
          auth_email: email,
          role: 'parent',
          parent_id: null,
          invite_code: crypto.randomUUID(),
          restricted: false,
        })

      if (profileError) throw profileError

      router.push('/chat')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Account aanmaken mislukt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Image 
              src="/scribble_logo.png" 
              alt="Scribble Logo" 
              width={60} 
              height={60}
              className="object-contain"
            />
            <h1 className="text-4xl font-bold text-black dark:text-white">SCRIBBLE</h1>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Account aanmaken</h2>
            <p className="mt-2 text-muted-foreground">Word vandaag lid van Scribble</p>
          </div>
        </div>

        {/* Step 1: Role Selection */}
        {step === 'role' && (
          <div className="bg-card p-8 rounded-xl border border-border shadow-lg space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Ouderaccount aanmaken</h2>
              <p className="text-sm text-muted-foreground">
                Ouders kunnen na aanmelding kinderen toevoegen via Ouderlijk toezicht.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRoleSelection}
                className="w-full p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Ouderaccount</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Vereist e-mailverificatie. Voeg kinderen toe en beheer ze via Ouderlijk toezicht.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <p className="text-center text-sm text-muted-foreground pt-4">
              Heb je al een account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Inloggen
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Parent Details */}
        {step === 'details' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSendCode(); }} className="bg-card p-8 rounded-xl border border-border shadow-lg space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setStep('role')}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Terug
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2">
                  Gebruikersnaam
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="johndoe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We sturen een verificatiecode naar dit e-mailadres
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Wachtwoord
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Code versturen...' : 'Verificatiecode versturen'}
            </button>
          </form>
        )}

        {/* Step 3: Verify Email */}
        {step === 'verify' && (
          <form onSubmit={handleParentSubmit} className="bg-card p-8 rounded-xl border border-border shadow-lg space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Terug
              </button>
            </div>

            {codeSent && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500 text-green-600 dark:text-green-400 text-sm">
                ✓ Verificatiecode verstuurd naar {email}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium mb-2">
                Verificatiecode
              </label>
              <input
                id="verificationCode"
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Voer de 6-cijferige code in die naar je e-mail is verstuurd
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Verifiëren...' : 'Verifiëren en account aanmaken'}
            </button>

            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Niet ontvangen? Code opnieuw versturen
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
