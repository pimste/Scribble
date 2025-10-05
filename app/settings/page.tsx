'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/types'
import { ThemeToggle } from '@/components/theme-toggle'

type Tab = 'profile' | 'account' | 'notifications' | 'appearance'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('profile')
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

      if (profileData) {
        setProfile(profileData)
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and profile information</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/chat"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Back to Chat
            </Link>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="col-span-3">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">
                      {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-4 border-card hover:bg-primary/90 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                {/* Username */}
                <div>
                  <h2 className="text-xl font-bold">{profile?.username || 'Unknown User'}</h2>
                  <p className="text-sm text-muted-foreground">@{profile?.username || ''}</p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-medium">Online</span>
                </div>

                {/* Role Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  profile?.role === 'parent' 
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                }`}>
                  {profile?.role === 'parent' ? '👨‍👧 Parent' : '👶 Child'}
                </div>

                {/* About */}
                <div className="w-full pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">ABOUT</p>
                  <p className="text-sm text-muted-foreground">No bio available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="col-span-9">
            {/* Tabs */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 px-6 py-4 font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-primary/5 text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`flex-1 px-6 py-4 font-medium transition-colors ${
                    activeTab === 'account'
                      ? 'bg-primary/5 text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Account
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex-1 px-6 py-4 font-medium transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-primary/5 text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notifications
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('appearance')}
                  className={`flex-1 px-6 py-4 font-medium transition-colors ${
                    activeTab === 'appearance'
                      ? 'bg-primary/5 text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    Appearance
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Basic Information
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
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
                            defaultValue={profile?.username || ''}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Enter display name"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">Bio</label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Status</label>
                          <select className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                            <option>🟢 Online</option>
                            <option>🔴 Do Not Disturb</option>
                            <option>🟡 Away</option>
                            <option>⚫ Invisible</option>
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

                    <div className="border-t border-border pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Additional Information
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">Add extra details to your profile</p>
                      
                      <div className="space-y-3">
                        <button className="w-full px-4 py-3 border border-border rounded-lg hover:bg-accent transition-colors text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Add social links</span>
                            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border">
                      <button className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition-colors font-medium">
                        Cancel
                      </button>
                      <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                        Save Changes
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

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                      <p className="text-sm text-muted-foreground mb-6">Choose what notifications you want to receive</p>
                      
                      <div className="space-y-4">
                        {[
                          { title: 'Direct Messages', desc: 'Get notified when someone sends you a message' },
                          { title: 'Friend Requests', desc: 'Get notified when someone adds you as a contact' },
                          { title: 'Mentions', desc: 'Get notified when someone mentions you' },
                          { title: 'Group Invites', desc: 'Get notified when invited to a group' },
                        ].map((item) => (
                          <div key={item.title} className="flex items-center justify-between p-4 border border-border rounded-lg">
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Theme</h3>
                      <p className="text-sm text-muted-foreground mb-6">Customize how Scribble looks</p>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <button className="p-4 border-2 border-primary rounded-lg hover:bg-accent transition-colors">
                          <div className="w-full h-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 mb-3"></div>
                          <p className="font-medium">Light</p>
                        </button>
                        <button className="p-4 border-2 border-border rounded-lg hover:bg-accent transition-colors">
                          <div className="w-full h-24 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 mb-3"></div>
                          <p className="font-medium">Dark</p>
                        </button>
                        <button className="p-4 border-2 border-border rounded-lg hover:bg-accent transition-colors">
                          <div className="w-full h-24 rounded-lg bg-gradient-to-br from-gray-100 via-gray-200 to-gray-800 mb-3"></div>
                          <p className="font-medium">System</p>
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <h3 className="text-lg font-semibold mb-4">Accent Color</h3>
                      <div className="grid grid-cols-8 gap-3">
                        {['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-teal-500'].map((color) => (
                          <button key={color} className={`w-12 h-12 rounded-lg ${color} hover:scale-110 transition-transform`}></button>
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
    </div>
  )
}

