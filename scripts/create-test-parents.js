/**
 * Create Two Test Parent Users
 * Run this with: node scripts/create-test-parents.js
 */

const { createClient } = require('@supabase/supabase-js')

// You need to get your service role key from Supabase Dashboard
// Settings > API > service_role key (keep this secret!)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUsers() {
  try {
    console.log('🚀 Creating test parent users...\n')

    // Create first parent user (pim-1)
    const { data: user1Data, error: user1Error } = await supabaseAdmin.auth.admin.createUser({
      email: 'pim1@test.com',
      password: 'testen',
      email_confirm: true,
      user_metadata: {
        username: 'pim-1',
        role: 'parent'
      }
    })

    if (user1Error) {
      throw new Error(`Failed to create pim-1: ${user1Error.message}`)
    }

    console.log('✅ Created user: pim-1')
    console.log(`   ID: ${user1Data.user.id}`)
    console.log(`   Email: pim1@test.com\n`)

    // Create profile for pim-1
    const { error: profile1Error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user1Data.user.id,
        username: 'pim-1',
        email: 'pim1@test.com',
        auth_email: 'pim1@test.com',
        role: 'parent',
        parent_id: null,
        restricted: false,
      })

    if (profile1Error) {
      throw new Error(`Failed to create profile for pim-1: ${profile1Error.message}`)
    }

    console.log('✅ Created profile for pim-1\n')

    // Create second parent user (pim-2)
    const { data: user2Data, error: user2Error } = await supabaseAdmin.auth.admin.createUser({
      email: 'pim2@test.com',
      password: 'testen',
      email_confirm: true,
      user_metadata: {
        username: 'pim-2',
        role: 'parent'
      }
    })

    if (user2Error) {
      throw new Error(`Failed to create pim-2: ${user2Error.message}`)
    }

    console.log('✅ Created user: pim-2')
    console.log(`   ID: ${user2Data.user.id}`)
    console.log(`   Email: pim2@test.com\n`)

    // Create profile for pim-2
    const { error: profile2Error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user2Data.user.id,
        username: 'pim-2',
        email: 'pim2@test.com',
        auth_email: 'pim2@test.com',
        role: 'parent',
        parent_id: null,
        restricted: false,
      })

    if (profile2Error) {
      throw new Error(`Failed to create profile for pim-2: ${profile2Error.message}`)
    }

    console.log('✅ Created profile for pim-2\n')

    // Create contact relationship between pim-1 and pim-2
    const { error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert({
        user1_id: user1Data.user.id,
        user2_id: user2Data.user.id,
      })

    if (contactError) {
      throw new Error(`Failed to create contact: ${contactError.message}`)
    }

    console.log('✅ Created contact relationship between pim-1 and pim-2\n')

    console.log('=' .repeat(50))
    console.log('🎉 SUCCESS! Test users created:')
    console.log('=' .repeat(50))
    console.log('\n📧 User 1:')
    console.log('   Username: pim-1')
    console.log('   Email: pim1@test.com')
    console.log('   Password: testen\n')
    console.log('📧 User 2:')
    console.log('   Username: pim-2')
    console.log('   Email: pim2@test.com')
    console.log('   Password: testen\n')
    console.log('🤝 Both users are now in each other\'s contacts!')
    console.log('=' .repeat(50))

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
createTestUsers()

