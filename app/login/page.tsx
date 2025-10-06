'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('') // email or username
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
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
          throw new Error('Invalid username or password')
        }

        loginEmail = profile.auth_email
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })

      if (error) throw error

      if (data.user) {
        router.push('/chat')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login')
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
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">Sign in to your account</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6 bg-card p-8 rounded-xl border border-border shadow-lg">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium mb-2">
                Email or Username
              </label>
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@example.com or username"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Parents use email, children use username
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
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
