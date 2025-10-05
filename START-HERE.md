# 🚀 Scribble - Start Here

## ✅ Development Server is Running!

Your app is now live at: **http://localhost:3000**

---

## 🎯 Before You Can Use the App

### ⚠️ CRITICAL: Set Up Supabase Database

The app **will not work** until you run the SQL schema. This takes 2 minutes:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/ejlvpfbwnnlsiasorcir
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

2. **Copy & Run the Schema**
   ```bash
   # Open the schema file and copy all contents
   cat supabase-schema.sql
   ```
   - Paste into Supabase SQL Editor
   - Click "Run" (or Cmd/Ctrl + Enter)
   - Wait for success message

3. **Verify Tables Created**
   - Click "Table Editor" in sidebar
   - You should see: `profiles`, `messages`, `contacts`

**Once done, you can use the app!** 🎉

---

## 🧪 Quick Test Flow

### 1. Create Parent Account
- Visit: http://localhost:3000
- Click "Sign Up"
- Username: `testparent`
- Email: `parent@test.com`
- Password: `password123`
- Select: **Parent**
- Submit

### 2. Get Your Invite Code
- Click "Invite Friends" (top right)
- Copy your **Personal Invite Code**
- This is also your **Parent Code**

### 3. Create Child Account
- Open **new incognito/private window**
- Visit: http://localhost:3000
- Click "Sign Up"
- Username: `testchild`
- Email: `child@test.com`
- Password: `password123`
- Select: **Child**
- Paste the **Parent Code** from step 2
- Submit

### 4. Connect as Friends
In Parent window:
- Go to "Invite Friends"
- Copy your invite code

In Child window:
- Go to "Invite Friends"
- Paste parent's code in "Add a Contact"
- Click "Add Contact"

### 5. Start Chatting
- Both users should now see each other in contacts list
- Click on the contact to open chat
- Type and send messages
- Messages appear in real-time! ⚡

### 6. Test Parental Controls
In Parent window:
- Click "Parental Controls"
- Click on your child
- See their contacts
- Click a contact to view messages
- Click "Restrict" button

In Child window:
- See restriction banner
- Cannot send messages
- Parent can click "Enable" to unrestrict

---

## 📱 Features You Can Test

✅ **Authentication**
- Sign up / Login
- Parent and Child roles
- Parent-child linking

✅ **Chat**
- Real-time messaging
- 1:1 conversations
- Message history

✅ **Invites**
- Personal invite codes
- Add contacts by code
- View all contacts

✅ **Parental Controls** (Parents only)
- View linked children
- Monitor contacts
- Read all messages
- Restrict/unrestrict messaging

✅ **Theme**
- Toggle light/dark mode (top right)
- Preference persists

---

## 🎨 UI Highlights

The app features:
- 🌓 Beautiful light/dark mode
- 📱 Responsive 3-panel layout
- 💬 Clean modern chat interface
- 🎯 Intuitive navigation
- ⚡ Real-time updates
- 🔒 Security indicators

---

## 📂 Project Files

```
Scribble/
├── app/                  # Next.js pages
│   ├── page.tsx         # Landing page
│   ├── login/           # Login form
│   ├── register/        # Sign up form
│   ├── chat/            # Main chat interface
│   ├── invite/          # Invite code management
│   └── parent/          # Parental controls
├── components/          # React components
│   ├── chat/           # Chat UI components
│   ├── theme-provider/ # Theme system
│   └── theme-toggle/   # Light/dark switch
├── lib/                # Utilities
│   └── supabase.ts     # Supabase client
├── types/              # TypeScript types
└── supabase-schema.sql # Database schema ⚠️ RUN THIS FIRST
```

---

## 🐛 Troubleshooting

### Can't Sign Up?
→ Did you run `supabase-schema.sql`? This is required!

### Can't Add Contact?
→ Make sure both users exist and invite code is correct

### No Real-Time Updates?
→ Check browser console for errors
→ Verify Supabase Realtime is enabled

### Theme Not Working?
→ Clear browser cache and reload

### Server Not Running?
```bash
npm run dev
```

---

## 📚 Documentation

- **README.md** - Full feature documentation
- **MVP-COMPLETE.md** - Development summary
- **SETUP.md** - Detailed setup guide
- **supabase-schema.sql** - Database schema to run

---

## 🎓 What's Next?

Once you've tested the MVP, you can add:
- 📱 Group chats
- 🏢 Community servers
- 📎 File attachments
- 🔔 Push notifications
- 📞 Voice/video calls
- 🔍 Message search
- 👥 User avatars
- 😊 Emoji picker
- 📊 Activity reports

---

## 🚀 Deploy to Production

When ready to deploy:

1. **Vercel** (Recommended)
   ```bash
   npm run build
   vercel deploy
   ```

2. **Environment Variables**
   - Add your `.env.local` values to Vercel
   - Keep Supabase credentials secure

3. **Domain**
   - Connect custom domain in Vercel
   - Update Supabase allowed domains

---

## 💡 Key Technologies

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS v3** - Styling
- **Supabase** - Backend (Auth, DB, Realtime)
- **PostgreSQL** - Database

---

## ✅ MVP Status

**MVP complete — parental control and invite chat functional.**

All core features implemented:
- ✅ Authentication system
- ✅ Parent-child relationships
- ✅ Invite-based connections
- ✅ Real-time messaging
- ✅ Parental oversight
- ✅ Message restrictions
- ✅ Theme system
- ✅ Responsive design

**Ready for next phase: groups and community servers!**

---

**Questions? Issues? Check the other .md files in this folder for detailed help.**

**Happy chatting! 💬**

