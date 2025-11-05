-- Update Emma's Password
-- Run this in your Supabase SQL Editor (Database > SQL Editor)
-- ==========================================

-- View Emma's current information
SELECT username, email, role, id FROM profiles WHERE username = 'Emma';

-- Update Emma's password to 'testen'
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Find Emma's user ID
  SELECT id INTO user_id FROM profiles WHERE username = 'Emma';
  
  IF user_id IS NOT NULL THEN
    -- Update the password in auth.users
    UPDATE auth.users 
    SET encrypted_password = crypt('testen', gen_salt('bf')),
        updated_at = now()
    WHERE id = user_id;
    
    RAISE NOTICE 'Password updated successfully for Emma (%). New password: testen', user_id;
  ELSE
    RAISE NOTICE 'User Emma not found';
  END IF;
END $$;

-- Verify the update (this just shows the user still exists, can't verify the password directly)
SELECT username, email, role, id, created_at FROM profiles WHERE username = 'Emma';

