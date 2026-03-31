'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

function LoginForm() {
  const [identifier, setIdentifier] = useState('') // email or username
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let loginEmail = identifier

      // Check if identifier is a username (no @ symbol)
      if (!identifier.includes('@')) {
        // Look up the user by username to get their auth email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('auth_email')
          .eq('username', identifier)
          .single()

        if (profileError || !profile) {
          throw new Error('Ongeldige gebruikersnaam of wachtwoord')
        }

        loginEmail = profile.auth_email
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })

      if (error) throw error

      if (data.user) {
        const destination = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/chat'
        router.push(destination)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Inloggen mislukt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#11132c] p-4">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Image
              src="/scribble_logo.png"
              alt="Scribble Logo"
              width={92}
              height={92}
              className="object-contain"
            />
          </div>
          <h1 className="text-base font-medium tracking-[0.24em] text-white/95">SCRIBBLE</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 rounded-2xl bg-[#222447] p-5 border border-[#2f3362] shadow-2xl">
          <div>
            <p className="text-sm text-white/85">Sign in</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-400/40 text-red-100 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full border border-[#61679b] bg-transparent text-white placeholder:text-[#9ca1c8] focus:outline-none focus:ring-2 focus:ring-[#d837b8]"
                placeholder="jouw@email.com"
              />
            </div>

            <div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full border border-[#61679b] bg-transparent text-white placeholder:text-[#9ca1c8] focus:outline-none focus:ring-2 focus:ring-[#d837b8]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#d837b8] text-white rounded-full hover:bg-[#c533a7] transition-colors text-sm font-semibold uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-[#b9bde1]">
            Nog geen account?{' '}
            <Link href="/register" className="text-white hover:underline font-semibold">
              Aanmaken
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#11132c]">
        <div className="animate-pulse text-white/70">Laden...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
