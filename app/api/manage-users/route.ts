import { createAdminClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { action, username, password, email, role } = await request.json()
    const supabase = createAdminClient()

    if (action === 'create') {
      // Create a new user
      console.log(`Creating user: ${username}`)
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email || `${username.toLowerCase()}@example.com`,
        password,
        email_confirm: true,
      })

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          email: email || `${username.toLowerCase()}@example.com`,
          auth_email: email || `${username.toLowerCase()}@example.com`,
          role: role || 'parent',
          restricted: false,
        })

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }

      return NextResponse.json({ 
        success: true, 
        message: `User ${username} created successfully`,
        userId: authData.user.id 
      })

    } else if (action === 'delete') {
      // Delete a user
      console.log(`Deleting user: ${username}`)
      
      // Find the user
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, auth_email')
        .eq('username', username)
        .single()

      if (fetchError || !profile) {
        return NextResponse.json({ 
          error: `User ${username} not found` 
        }, { status: 404 })
      }

      // Delete from auth (cascades to profiles)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(profile.id)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 })
      }

      return NextResponse.json({ 
        success: true, 
        message: `User ${username} deleted successfully` 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Error managing users:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

