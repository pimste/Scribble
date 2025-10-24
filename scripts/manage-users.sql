-- User Management Script
-- Run this in your Supabase SQL Editor

-- First, let's see which users exist
SELECT username, email, role, id FROM profiles;

-- Delete children users "Kind1" and "Kind2" and parent "Lisa"
-- Note: We need to delete from auth.users, which will cascade to profiles

-- Delete Kind1
DO $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM profiles WHERE username = 'Kind1';
  IF user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = user_id;
    RAISE NOTICE 'Deleted user: Kind1 (%)' user_id;
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
    RAISE NOTICE 'Deleted user: Kind2 (%)' user_id;
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
    RAISE NOTICE 'Deleted user: Lisa (%)' user_id;
  ELSE
    RAISE NOTICE 'User Lisa not found';
  END IF;
END $$;

-- Create new user Ellen
-- Note: You'll need to create the auth user first via Supabase Dashboard
-- Then use this query to create the profile:

-- INSTRUCTIONS FOR CREATING ELLEN:
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Add User" and create:
--    Email: ellen@example.com
--    Password: testen
-- 3. Copy the UUID from the created user
-- 4. Replace 'YOUR_USER_UUID_HERE' below with that UUID and run the query

-- INSERT INTO profiles (id, username, email, auth_email, role, restricted)
-- VALUES (
--   'YOUR_USER_UUID_HERE'::uuid,  -- Replace with actual UUID from auth.users
--   'Ellen',
--   'ellen@example.com',
--   'ellen@example.com',
--   'parent',
--   false
-- );

-- Verify the changes
SELECT username, email, role, id FROM profiles;

