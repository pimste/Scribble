-- User Management Script
-- Run this in your Supabase SQL Editor
-- ==========================================

-- STEP 1: View current users
SELECT username, email, role, id FROM profiles;

-- STEP 2: Delete users Kind1, Kind2, and Lisa
-- Note: We delete from auth.users, which cascades to profiles

-- Delete Kind1
DO $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM profiles WHERE username = 'Kind1';
  IF user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = user_id;
    RAISE NOTICE 'Deleted user: Kind1 (%)', user_id;
  ELSE
    RAISE NOTICE 'User Kind1 not found';
  END IF;
END $$;

-- Delete Kind2
DO $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM profiles WHERE username = 'Kind2';
  IF user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = user_id;
    RAISE NOTICE 'Deleted user: Kind2 (%)', user_id;
  ELSE
    RAISE NOTICE 'User Kind2 not found';
  END IF;
END $$;

-- Delete Lisa
DO $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM profiles WHERE username = 'Lisa';
  IF user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = user_id;
    RAISE NOTICE 'Deleted user: Lisa (%)', user_id;
  ELSE
    RAISE NOTICE 'User Lisa not found';
  END IF;
END $$;

-- STEP 3: Create new user Ellen
-- This is a two-step process

-- 3a. Create auth user (run this in your Supabase dashboard or SQL editor)
-- If running via SQL, you need proper permissions

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Try to create the auth user
  -- Note: This requires service role privileges
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'ellen@example.com',
    crypt('testen', gen_salt('bf')),  -- Password: testen
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- 3b. Create profile
  INSERT INTO profiles (id, username, email, auth_email, role, restricted)
  VALUES (
    new_user_id,
    'Ellen',
    'ellen@example.com',
    'ellen@example.com',
    'parent',
    false
  );

  RAISE NOTICE 'Created user: Ellen (%), Password: testen', new_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating Ellen: %. You may need to create via Supabase Dashboard instead.', SQLERRM;
END $$;

-- ALTERNATIVE for creating Ellen via Dashboard:
-- If the above fails, follow these steps:
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Add User" and create:
--    Email: ellen@example.com
--    Password: testen
--    Auto Confirm: Yes
-- 3. Copy the UUID from the created user
-- 4. Run this query (replace the UUID):
/*
INSERT INTO profiles (id, username, email, auth_email, role, restricted)
VALUES (
  'PASTE_UUID_HERE'::uuid,
  'Ellen',
  'ellen@example.com',
  'ellen@example.com',
  'parent',
  false
);
*/

-- STEP 4: Verify the changes
SELECT username, email, role, id FROM profiles ORDER BY created_at DESC;

