'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/types'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileNavigation } from '@/components/MobileNavigation'
import { useTheme } from '@/components/theme-provider'

type Tab = 'profile' | 'account' | 'appearance'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [status, setStatus] = useState('online')
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

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
        setDisplayName(profileData.username)
        // We can add bio and other fields to the profile later if needed
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const handleSaveProfile = async () => {
    if (!profile) return
    
    setSaving(true)
    try {
      // For now, we'll just show a success message since we don't have
      // additional profile fields in the database yet
      // In the future, update the profiles table with bio, status, etc.
      
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate save
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Manage your account and profile information</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/chat"
              className="hidden md:flex px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Back to Chat
            </Link>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto p-3 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 md:sticky md:top-6">
              <div className="flex md:flex-col items-center md:text-center space-x-4 md:space-x-0 md:space-y-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <span className="text-3xl md:text-5xl font-bold text-white">
                      {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 md:border-4 border-card hover:bg-primary/90 transition-colors">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                {/* Username & Info */}
                <div className="flex-1 md:flex-none text-left md:text-center space-y-2 md:space-y-4">
                  <div>
                    <h2 className="text-lg md:text-xl font-bold">{profile?.username || 'Unknown User'}</h2>
                    <p className="text-xs md:text-sm text-muted-foreground">@{profile?.username || ''}</p>
                  </div>

                  {/* Status */}
                  <div className="flex md:justify-center items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-medium">Online</span>
                  </div>

                  {/* Role Badge */}
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    profile?.role === 'parent' 
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  }`}>
                    {profile?.role === 'parent' ? '👨‍👧 Parent' : '👶 Child'}
                  </div>

                  {/* About - Hidden on mobile */}
                  <div className="hidden md:block w-full pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">ABOUT</p>
                    <p className="text-sm text-muted-foreground">No bio available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="md:col-span-8 lg:col-span-9">
            {/* Tabs */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex border-b border-border overflow-x-auto">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 min-w-fit px-4 md:px-6 py-3 md:py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'profile'
                      ? 'bg-primary/5 text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm md:text-base">Profile</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`flex-1 min-w-fit px-4 md:px-6 py-3 md:py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'account'
                      ? 'bg-primary/5 text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm md:text-base">Account</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('appearance')}
                  className={`flex-1 min-w-fit px-4 md:px-6 py-3 md:py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'appearance'
                      ? 'bg-primary/5 text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <span className="text-sm md:text-base">Theme</span>
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4 md:p-6">
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Basic Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Username</label>
                          <input
                            type="text"
                            value={profile?.username || ''}
                            disabled
                            className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                            placeholder="Enter username"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Display Name</label>
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Enter display name"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">Bio</label>
                        <textarea
                          rows={4}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Status</label>
                          <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="online">🟢 Online</option>
                            <option value="dnd">🔴 Do Not Disturb</option>
                            <option value="away">🟡 Away</option>
                            <option value="invisible">⚫ Invisible</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Birth Date</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border">
                      <button 
                        onClick={() => {
                          setDisplayName(profile?.username || '')
                          setBio('')
                          setStatus('online')
                        }}
                        className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Email</label>
                          <input
                            type="email"
                            value={profile?.email || 'No email (Child account)'}
                            disabled
                            className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Account Type</label>
                          <input
                            type="text"
                            value={profile?.role === 'parent' ? 'Parent Account' : 'Child Account'}
                            disabled
                            className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground cursor-not-allowed capitalize"
                          />
                        </div>

                        {profile?.role === 'child' && profile.parent_id && (
                          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              <span className="font-semibold">👨‍👧 Linked to Parent:</span> This account is supervised by a parent account
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <h3 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h3>
                      
                      <div className="space-y-3">
                        <button className="w-full px-4 py-3 border border-destructive/50 rounded-lg hover:bg-destructive/10 transition-colors text-left">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-destructive">Change Password</p>
                              <p className="text-sm text-muted-foreground">Update your account password</p>
                            </div>
                            <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>

                        <button className="w-full px-4 py-3 border border-destructive/50 rounded-lg hover:bg-destructive/10 transition-colors text-left">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-destructive">Delete Account</p>
                              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                            </div>
                            <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Theme</h3>
                      <p className="text-sm text-muted-foreground mb-6">Choose how Scribble looks on your device</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button 
                          onClick={() => setTheme('light')}
                          className={`p-4 border-2 rounded-lg hover:bg-accent transition-colors ${
                            theme === 'light' ? 'border-primary' : 'border-border'
                          }`}
                        >
                          <div className="w-full h-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 mb-3 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </div>
                          <p className="font-medium">Light</p>
                          {theme === 'light' && <p className="text-xs text-primary mt-1">✓ Active</p>}
                        </button>
                        <button 
                          onClick={() => setTheme('dark')}
                          className={`p-4 border-2 rounded-lg hover:bg-accent transition-colors ${
                            theme === 'dark' ? 'border-primary' : 'border-border'
                          }`}
                        >
                          <div className="w-full h-24 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 mb-3 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                          </div>
                          <p className="font-medium">Dark</p>
                          {theme === 'dark' && <p className="text-xs text-primary mt-1">✓ Active</p>}
                        </button>
                        <button 
                          onClick={() => setTheme('system')}
                          className={`p-4 border-2 rounded-lg hover:bg-accent transition-colors ${
                            theme === 'system' ? 'border-primary' : 'border-border'
                          }`}
                        >
                          <div className="w-full h-24 rounded-lg bg-gradient-to-br from-gray-100 via-gray-300 to-gray-800 mb-3 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="font-medium">System</p>
                          {theme === 'system' && <p className="text-xs text-primary mt-1">✓ Active</p>}
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <h3 className="text-lg font-semibold mb-4">Accent Color</h3>
                      <p className="text-sm text-muted-foreground mb-6">Choose your preferred accent color</p>
                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          <span className="font-semibold">ℹ️ Coming Soon:</span> Accent color customization will be available in a future update. Currently using the default blue theme.
                        </p>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                        {[
                          { color: 'bg-blue-500', name: 'Blue', active: true },
                          { color: 'bg-purple-500', name: 'Purple' },
                          { color: 'bg-pink-500', name: 'Pink' },
                          { color: 'bg-red-500', name: 'Red' },
                          { color: 'bg-orange-500', name: 'Orange' },
                          { color: 'bg-yellow-500', name: 'Yellow' },
                          { color: 'bg-green-500', name: 'Green' },
                          { color: 'bg-teal-500', name: 'Teal' }
                        ].map((item) => (
                          <button 
                            key={item.color} 
                            className={`w-12 h-12 rounded-lg ${item.color} relative ${
                              item.active ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-50 cursor-not-allowed'
                            }`}
                            disabled={!item.active}
                            title={item.active ? `${item.name} (Active)` : `${item.name} (Coming Soon)`}
                          >
                            {item.active && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation isParent={profile?.role === 'parent'} />
    </div>
  )
}

