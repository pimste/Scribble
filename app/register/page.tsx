'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserRole } from '@/types'

export default function RegisterPage() {
  const [step, setStep] = useState<'role' | 'details' | 'verify'>('role')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<UserRole>('parent')
  const [parentCode, setParentCode] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRoleSelection = (selectedRole: UserRole) => {
    setRole(selectedRole)
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
        throw new Error('Failed to send verification code')
      }

      setCodeSent(true)
      setStep('verify')
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code')
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
        `/api/auth/send-code?email=${encodeURIComponent(email)}&code=${verificationCode}`
      )

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json()
        throw new Error(data.error || 'Invalid verification code')
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
      if (!authData.user) throw new Error('Failed to create user')

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
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!parentCode) {
        throw new Error('Parent code is required for child accounts')
      }

      // Verify parent code exists
      const { data: parentProfile, error: parentError } = await supabase
        .from('profiles')
        .select('id')
        .eq('invite_code', parentCode)
        .eq('role', 'parent')
        .single()

      if (parentError || !parentProfile) {
        throw new Error('Invalid parent code')
      }

      // Create a unique email for the child (not visible to user)
      const childEmail = `child_${crypto.randomUUID()}@scribble.internal`

      // Sign up child without real email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: childEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/chat`,
          data: {
            username,
            role: 'child'
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          email: null, // Children don't have email
          auth_email: childEmail, // Store for login purposes
          role: 'child',
          parent_id: parentProfile.id,
          invite_code: crypto.randomUUID(),
          restricted: false,
        })

      if (profileError) throw profileError

      router.push('/chat')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
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
            <h2 className="text-2xl font-bold">Create Account</h2>
            <p className="mt-2 text-muted-foreground">Join Scribble today</p>
          </div>
        </div>

        {/* Step 1: Role Selection */}
        {step === 'role' && (
          <div className="bg-card p-8 rounded-xl border border-border shadow-lg space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Choose Account Type</h2>
              <p className="text-sm text-muted-foreground">
                Parents need email verification. Children only need a parent code.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleRoleSelection('parent')}
                className="w-full p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Parent Account</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Requires email verification. Get oversight of linked children's chats.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelection('child')}
                className="w-full p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Child Account</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      No email needed. Requires parent code to link to parent's account.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <p className="text-center text-sm text-muted-foreground pt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Parent Details */}
        {step === 'details' && role === 'parent' && (
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
                Back
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
                  Username
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
                  Email
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
                  We'll send a verification code to this email
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
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
              {loading ? 'Sending code...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* Step 2: Child Details */}
        {step === 'details' && role === 'child' && (
          <form onSubmit={handleChildSubmit} className="bg-card p-8 rounded-xl border border-border shadow-lg space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setStep('role')}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
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
                  Username
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
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
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

              <div>
                <label htmlFor="parentCode" className="block text-sm font-medium mb-2">
                  Parent Code
                </label>
                <input
                  id="parentCode"
                  type="text"
                  required
                  value={parentCode}
                  onChange={(e) => setParentCode(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  placeholder="Enter your parent's code"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get this code from your parent's account
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Child Account'}
            </button>
          </form>
        )}

        {/* Step 3: Verify Email (Parents only) */}
        {step === 'verify' && role === 'parent' && (
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
                Back
              </button>
            </div>

            {codeSent && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500 text-green-600 dark:text-green-400 text-sm">
                ✓ Verification code sent to {email}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium mb-2">
                Verification Code
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
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>

            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Didn't receive it? Resend code
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
