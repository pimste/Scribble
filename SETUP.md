# Scribble Setup Guide

## Quick Start

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Variables
The `.env.local` file has been created with your Supabase credentials. If you need to recreate it, use these values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ejlvpfbwnnlsiasorcir.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqbHZwZmJ3bm5sc2lhc29yY2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODgwOTksImV4cCI6MjA3NTE2NDA5OX0.XPAMTz5M2NilZAvefM7R-qfvPyqOoPM4myBSCuHbxYY
```

### Step 3: Set Up Supabase Database

**Important:** You must run the SQL schema in your Supabase project before using the app.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ejlvpfbwnnlsiasorcir`
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `supabase-schema.sql`
6. Paste into the SQL editor
7. Click "Run" to execute

This will create:
- ✅ All necessary tables (profiles, messages, contacts)
- ✅ Row Level Security policies
- ✅ Indexes for performance
- ✅ Constraints and triggers

### Step 4: Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing the MVP

### Test as Parent
1. Sign up with a parent account
2. Note your **Parent Code** (visible on Invite page)
3. Create some contacts using invite codes

### Test as Child
1. Sign up with a child account
2. Enter the Parent Code from step 2 above
3. Create contacts and send messages
4. Log in as parent to test parental controls

### Test Parental Controls
1. Log in as parent
2. Go to "Parental Controls"
3. View linked children
4. See their contacts and messages
5. Toggle "Restrict" to disable child messaging
6. Log back in as child to confirm restriction

## Features Checklist

✅ Email/password authentication
✅ Parent and Child roles
✅ Parent-Child account linking
✅ Unique invite codes per user
✅ Invite-based friend connections
✅ Real-time 1:1 messaging
✅ Parental oversight dashboard
✅ Message restrictions for children
✅ Light/Dark theme toggle
✅ Responsive 3-panel layout
✅ Real-time message updates

## Troubleshooting

### "Invalid invite code" error
- Make sure the Supabase schema has been executed
- Verify the invite code was copied correctly
- Check that the user exists in the profiles table

### Authentication issues
- Confirm `.env.local` has correct Supabase credentials
- Check Supabase project is active
- Verify email confirmation settings in Supabase Auth

### No real-time updates
- Ensure Supabase Realtime is enabled for your project
- Check browser console for connection errors
- Verify RLS policies are properly configured

### Database errors
- Run the complete `supabase-schema.sql` file
- Check that RLS is enabled on all tables
- Verify indexes were created successfully

## Architecture Overview

### Authentication Flow
```
User → Next.js App → Supabase Auth → Profile Created → Chat Access
```

### Message Flow
```
User Types → Submit → Supabase Messages Table → Real-time Subscription → All Connected Clients
```

### Parental Control Flow
```
Parent → View Dashboard → Query Child Profiles → Query Contacts → Query Messages (via RLS)
```

## Security Features

- 🔒 Row Level Security on all tables
- 🔒 Users can only view their own data
- 🔒 Parents can view children's data
- 🔒 Invite codes required for connections
- 🔒 Restriction flag prevents child messaging
- 🔒 Server-side validation via RLS policies

## Next Development Phase

After confirming the MVP works, consider adding:
- 📱 Group chats
- 🏢 Community servers
- 📎 File attachments
- 🔔 Push notifications
- 📞 Voice/video calls
- 🔍 Message search
- 📊 Activity reports for parents

---

**Need help?** Check the main README.md for detailed documentation.

