# Scribble - Chat with Parental Controls

A secure chat MVP with parental control features and invite-based friend connections built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

✅ **Authentication System**
- Email/password signup and login via Supabase Auth
- Role-based registration (Parent or Child accounts)
- Parent-child account linking via parent codes

✅ **Parental Control Dashboard**
- Parents can view all linked children
- Monitor children's chat contacts
- Read children's messages (read-only)
- Toggle restriction flag to disable/enable child messaging

✅ **Invite-Based Friend System**
- Every user receives a unique personal invite code
- Add contacts by entering their invite code
- Private 1:1 chat connections

✅ **Real-Time Messaging**
- Direct message chat with real-time updates via Supabase subscriptions
- 3-panel responsive layout (Contacts | Messages | User Info)
- Message restrictions for restricted child accounts

✅ **Theme Support**
- Light/Dark mode toggle
- Persistent theme preference

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Auth, Database, Realtime)
- **Database:** PostgreSQL (via Supabase)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ejlvpfbwnnlsiasorcir.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqbHZwZmJ3bm5sc2lhc29yY2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODgwOTksImV4cCI6MjA3NTE2NDA5OX0.XPAMTz5M2NilZAvefM7R-qfvPyqOoPM4myBSCuHbxYY
```

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands from `supabase-schema.sql`

This will create:
- `profiles` table (user profiles with roles and invite codes)
- `messages` table (chat messages)
- `contacts` table (friend connections)
- Row Level Security (RLS) policies
- Performance indexes

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## User Flows

### Parent Account Registration
1. Sign up with email/password
2. Choose "Parent" as account type
3. Receive a unique Parent Code and Personal Invite Code
4. Share Parent Code with children for account linking
5. Share Personal Invite Code with friends to chat

### Child Account Registration
1. Sign up with email/password
2. Choose "Child" as account type
3. Enter Parent Code to link to parent account
4. Receive a Personal Invite Code
5. Share Personal Invite Code with friends to chat

### Adding Contacts
1. Navigate to "Invite Friends" page
2. Copy your Personal Invite Code to share with others
3. Enter someone else's invite code to add them as a contact
4. Start chatting from the main chat interface

### Parental Controls
1. Navigate to "Parental Controls" (parents only)
2. View list of linked children
3. Select a child to view their contacts
4. Click on a contact to read message history
5. Toggle "Restrict" to disable/enable child messaging

## Project Structure

```
├── app/
│   ├── chat/page.tsx           # Main chat interface
│   ├── invite/page.tsx         # Invite code management
│   ├── login/page.tsx          # Login page
│   ├── parent/page.tsx         # Parental control dashboard
│   ├── register/page.tsx       # Registration page
│   ├── layout.tsx              # Root layout with theme provider
│   └── globals.css             # Global styles with theme variables
├── components/
│   ├── auth/                   # Authentication components
│   ├── chat/                   # Chat interface components
│   │   ├── Sidebar.tsx         # Contacts list
│   │   ├── MessageList.tsx     # Message display
│   │   ├── MessageInput.tsx    # Message input field
│   │   └── UserInfo.tsx        # User details panel
│   ├── theme-provider.tsx      # Theme context provider
│   └── theme-toggle.tsx        # Dark/light mode toggle
├── lib/
│   └── supabase.ts             # Supabase client configuration
└── types/
    └── index.ts                # TypeScript type definitions
```

## Database Schema

### profiles
- `id` - UUID (references auth.users)
- `username` - Text (unique)
- `role` - Text (parent | child)
- `parent_id` - UUID (references profiles)
- `invite_code` - UUID (unique, auto-generated)
- `restricted` - Boolean (default: false)
- `created_at` - Timestamp

### messages
- `id` - UUID (primary key)
- `sender_id` - UUID (references profiles)
- `receiver_id` - UUID (references profiles)
- `content` - Text
- `created_at` - Timestamp

### contacts
- `id` - UUID (primary key)
- `user1_id` - UUID (references profiles)
- `user2_id` - UUID (references profiles)
- `created_at` - Timestamp

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only view their own profiles and messages
- Parents can view children's profiles and messages
- Children cannot send messages when restricted
- Invite codes required for establishing connections

## Next Steps

This MVP is ready for:
- Group chat functionality
- Community servers
- File sharing
- Voice/video calls
- Push notifications

---

**MVP complete — parental control and invite chat functional. Ready for next phase (groups and community servers).**


