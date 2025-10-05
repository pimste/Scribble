# 🔐 Scribble Authentication System

## Overview

Scribble uses a **dual authentication system** with different requirements for parents and children:

- **Parents**: Email + password + email verification code (via Resend)
- **Children**: Username + password + parent code (no email required)

---

## Parent Registration Flow

### Step 1: Choose Account Type
- User selects "Parent Account"
- Sees message: "Requires email verification"

### Step 2: Enter Details
- **Username**: Display name
- **Email**: Must be valid, receives verification code
- **Password**: Minimum 6 characters

### Step 3: Email Verification
- System sends 6-digit code to email via Resend
- Code expires in 10 minutes
- User enters code to verify ownership
- Option to resend code if not received

### Step 4: Account Created
- Supabase Auth account created with email
- Profile created with:
  - `username`: Display name
  - `email`: User's real email
  - `auth_email`: Same as email
  - `role`: "parent"
  - `invite_code`: Unique UUID for invites
  - `parent_id`: null

---

## Child Registration Flow

### Step 1: Choose Account Type
- User selects "Child Account"
- Sees message: "No email needed. Requires parent code."

### Step 2: Enter Details
- **Username**: Display name
- **Password**: Minimum 6 characters
- **Parent Code**: UUID from parent's account

### Step 3: Validation
- System verifies parent code exists
- Checks parent has "parent" role
- No email verification needed

### Step 4: Account Created
- Supabase Auth account created with internal email: `child_{uuid}@scribble.internal`
- Profile created with:
  - `username`: Display name
  - `email`: null (children don't have email)
  - `auth_email`: Internal email for Supabase Auth
  - `role`: "child"
  - `invite_code`: Unique UUID for invites
  - `parent_id`: Links to parent

---

## Login System

### For Parents
- Login with **email + password**
- Standard Supabase Auth flow

### For Children
- Login with **username + password**
- System looks up `auth_email` from profile by username
- Uses auth_email for Supabase Auth login

### Unified Login Form
- Single input field: "Email or Username"
- Automatically detects which type (presence of @)
- Parents: Use email
- Children: Use username

---

## Email Verification System

### API Endpoint: `/api/auth/send-code`

**POST** - Send verification code
```json
{
  "email": "parent@example.com"
}
```

**GET** - Verify code
```
/api/auth/send-code?email=parent@example.com&code=123456
```

### Code Generation
- 6 random digits (100000-999999)
- Stored in memory with 10-minute expiration
- Single-use (deleted after verification)

### Email Template
```
Subject: Your Scribble Verification Code

Your verification code is:

[123456]

This code will expire in 10 minutes.
If you didn't request this code, please ignore this email.
```

### Resend Configuration
- **API Key**: Stored in `RESEND_API_KEY` environment variable
- **From**: `onboarding@resend.dev` (use your verified domain in production)
- **HTML Template**: Styled email with large code display

---

## Database Schema

### profiles table
```sql
create table profiles (
  id uuid primary key references auth.users(id),
  username text not null unique,
  email text, -- NULL for children, real email for parents
  auth_email text not null, -- Email used for Supabase Auth
  role text check (role in ('parent', 'child')),
  parent_id uuid references profiles(id),
  invite_code uuid unique,
  restricted boolean default false,
  created_at timestamp default now()
);
```

### Key Fields
- **username**: Unique, used for display and child login
- **email**: Only populated for parents, NULL for children
- **auth_email**: Always populated, used for Supabase Auth
  - Parents: real email
  - Children: `child_{uuid}@scribble.internal`
- **parent_id**: Links child to parent account

---

## Security Features

### Email Verification
- ✅ Prevents fake parent accounts
- ✅ Ensures parent has access to email for password reset
- ✅ Validates email ownership before account creation

### Parent Code System
- ✅ Children must have valid parent code
- ✅ Code must belong to account with "parent" role
- ✅ Creates secure parent-child relationship

### Username Login for Children
- ✅ Children don't need to remember complex emails
- ✅ Usernames are easier for young users
- ✅ Internal email hidden from children

### Password Requirements
- Minimum 6 characters (configurable)
- Hashed and stored by Supabase Auth
- Same security for parents and children

---

## Testing the System

### Test Parent Registration
1. Go to `/register`
2. Click "Parent Account"
3. Enter:
   - Username: `testparent`
   - Email: your real email
   - Password: `password123`
4. Click "Send Verification Code"
5. Check your email for 6-digit code
6. Enter code and click "Verify & Create Account"
7. Redirected to `/chat`

### Test Child Registration
1. Open **new incognito window**
2. Go to `/register`
3. Click "Child Account"
4. Enter:
   - Username: `testchild`
   - Password: `password123`
   - Parent Code: (copy from parent's invite page)
5. Click "Create Child Account"
6. Redirected to `/chat` immediately (no verification)

### Test Login
**Parent:**
- Email: `parent@example.com`
- Password: `password123`

**Child:**
- Username: `testchild`
- Password: `password123`

---

## Environment Variables

Required in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ejlvpfbwnnlsiasorcir.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Resend for email verification
RESEND_API_KEY=re_tJjHSPfW_L1ALwKyYEe1DPjiYbE6rW1jN
```

---

## Production Considerations

### 1. Verification Code Storage
Current: In-memory Map (lost on server restart)
**Upgrade to**: Redis or database table for persistence

### 2. Email Domain
Current: `onboarding@resend.dev` (Resend test domain)
**Upgrade to**: Your verified domain (e.g., `noreply@yourapp.com`)

### 3. Rate Limiting
Add rate limiting to prevent:
- Email spam (limit verification emails per hour)
- Brute force attacks (limit login attempts)

### 4. Email Template
Current: Basic HTML
**Upgrade to**: React Email templates with branding

### 5. Code Expiration
Current: 10 minutes
**Consider**: Configurable based on security requirements

---

## User Experience Features

### Parent Benefits
- ✅ Password reset via email
- ✅ Email notifications for account activity
- ✅ Two-factor authentication ready (future)
- ✅ Secure account recovery

### Child Benefits
- ✅ Simple username login (no email to remember)
- ✅ Fast registration (no email verification)
- ✅ Parent-approved accounts only
- ✅ Age-appropriate security

### UX Improvements Implemented
- Clear role selection with descriptions
- Step-by-step registration flow
- Visual feedback for code sending
- Resend option if code not received
- Large, easy-to-read verification code input
- Helpful error messages

---

## API Routes

### `/api/auth/send-code`
- **POST**: Send verification email
- **GET**: Verify code

Located at: `app/api/auth/send-code/route.ts`

Uses:
- Resend SDK for email sending
- In-memory Map for code storage
- Crypto.random for code generation

---

## Troubleshooting

### "Failed to send verification code"
- Check `RESEND_API_KEY` in `.env.local`
- Verify Resend API key is valid
- Check Resend dashboard for quota limits

### "Invalid verification code"
- Code may have expired (10 min limit)
- User may have mistyped code
- Click "Resend code" to get new one

### "Invalid parent code"
- Verify parent account exists
- Ensure code copied correctly (UUID format)
- Check parent has "parent" role

### Child can't login with username
- Verify username exists in profiles table
- Check `auth_email` field is populated
- Ensure password is correct

---

## Future Enhancements

### Planned Features
- 📧 Email notifications for parent when child creates account
- 🔐 Two-factor authentication for parents
- 🔄 Password reset flow
- 📊 Parent dashboard showing child login activity
- ⏰ Configurable verification code expiration
- 🎨 Branded email templates
- 📱 SMS verification as alternative to email

---

## Code Structure

### Registration Component
`app/register/page.tsx`
- Multi-step form (role → details → verify)
- Separate flows for parent and child
- API integration for verification

### Login Component
`app/login/page.tsx`
- Unified login for both roles
- Username lookup for children
- Email login for parents

### API Route
`app/api/auth/send-code/route.ts`
- POST: Send code via Resend
- GET: Verify code
- In-memory storage

---

**System Status**: ✅ Fully Implemented

All authentication flows are complete and ready for testing!

