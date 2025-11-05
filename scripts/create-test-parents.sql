-- Create Two Test Parent Users: pim-1 and pim-2
-- Both with password: 'testen'
-- Both added to each other's contacts
-- ==========================================
-- Run this in your Supabase SQL Editor (Database > SQL Editor)

DO $$
DECLARE
  user1_id uuid := gen_random_uuid();
  user2_id uuid := gen_random_uuid();
  user1_email text := 'pim1@test.com';
  user2_email text := 'pim2@test.com';
BEGIN
  -- Create first parent user (pim-1)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    user1_id,
    '00000000-0000-0000-0000-000000000000',
    user1_email,
    crypt('testen', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    'authenticated',
    'authenticated'
  );

  -- Create profile for pim-1
  INSERT INTO public.profiles (
    id,
    username,
    email,
    auth_email,
    role,
    parent_id,
    restricted,
    created_at
  ) VALUES (
    user1_id,
    'pim-1',
    user1_email,
    user1_email,
    'parent',
    NULL,
    false,
    now()
  );

  RAISE NOTICE 'Created parent user: pim-1 (ID: %, Email: %)', user1_id, user1_email;

  -- Create second parent user (pim-2)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    user2_id,
    '00000000-0000-0000-0000-000000000000',
    user2_email,
    crypt('testen', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    'authenticated',
    'authenticated'
  );

  -- Create profile for pim-2
  INSERT INTO public.profiles (
    id,
    username,
    email,
    auth_email,
    role,
    parent_id,
    restricted,
    created_at
  ) VALUES (
    user2_id,
    'pim-2',
    user2_email,
    user2_email,
    'parent',
    NULL,
    false,
    now()
  );

  RAISE NOTICE 'Created parent user: pim-2 (ID: %, Email: %)', user2_id, user2_email;

  -- Create contact relationship between pim-1 and pim-2
  INSERT INTO public.contacts (
    user1_id,
    user2_id,
    created_at
  ) VALUES (
    user1_id,
    user2_id,
    now()
  );

  RAISE NOTICE 'Added pim-1 and pim-2 as contacts';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUCCESS! Test users created:';
  RAISE NOTICE '  Username: pim-1, Email: %, Password: testen', user1_email;
  RAISE NOTICE '  Username: pim-2, Email: %, Password: testen', user2_email;
  RAISE NOTICE '  Both users are now in each others contacts!';
  RAISE NOTICE '========================================';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error occurred: %', SQLERRM;
  RAISE;
END $$;

-- Verify the users were created
SELECT 
  p.username,
  p.email,
  p.role,
  p.restricted,
  p.id,
  au.email as auth_email,
  au.email_confirmed_at IS NOT NULL as email_confirmed
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.username IN ('pim-1', 'pim-2')
ORDER BY p.username;

-- Verify the contact relationship
SELECT 
  c.id as contact_id,
  p1.username as user1,
  p2.username as user2,
  c.created_at
FROM contacts c
JOIN profiles p1 ON p1.id = c.user1_id
JOIN profiles p2 ON p2.id = c.user2_id
WHERE p1.username IN ('pim-1', 'pim-2') 
   OR p2.username IN ('pim-1', 'pim-2');

