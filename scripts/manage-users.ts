import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'Set' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUser(username: string, password: string, email: string, role: 'parent' | 'child') {
  try {
    console.log(`\n📝 Creating user: ${username}...`)
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error(`❌ Error creating auth user for ${username}:`, authError.message)
      return
    }

    console.log(`✅ Auth user created with ID: ${authData.user.id}`)

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username,
        email,
        auth_email: email,
        role,
        restricted: false,
      })

    if (profileError) {
      console.error(`❌ Error creating profile for ${username}:`, profileError.message)
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return
    }

    console.log(`✅ Profile created for ${username}`)
    console.log(`   Email: ${email}`)
    console.log(`   Role: ${role}`)
  } catch (error: any) {
    console.error(`❌ Unexpected error creating ${username}:`, error.message)
  }
}

async function deleteUser(username: string) {
  try {
    console.log(`\n🗑️  Deleting user: ${username}...`)
    
    // First, find the user by username
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, auth_email')
      .eq('username', username)
      .single()

    if (fetchError || !profile) {
      console.error(`❌ User ${username} not found:`, fetchError?.message || 'No profile found')
      return
    }

    console.log(`   Found user with ID: ${profile.id}`)

    // Delete from auth (this will cascade to profiles)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(profile.id)

    if (deleteError) {
      console.error(`❌ Error deleting auth user ${username}:`, deleteError.message)
      return
    }

    console.log(`✅ User ${username} deleted successfully`)
  } catch (error: any) {
    console.error(`❌ Unexpected error deleting ${username}:`, error.message)
  }
}

async function main() {
  console.log('🚀 Starting user management script...')
  console.log('==========================================')

  // Delete users
  await deleteUser('Kind1')
  await deleteUser('Kind2')
  await deleteUser('Lisa')

  // Create new user
  await createUser('Ellen', 'testen', 'ellen@example.com', 'parent')

  console.log('\n==========================================')
  console.log('✨ User management complete!')
}

main().catch(console.error)

