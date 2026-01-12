-- Add additional profile fields for user customization
-- Run this migration in your Supabase SQL editor

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'online' CHECK (status IN ('online', 'dnd', 'away', 'invisible')),
ADD COLUMN IF NOT EXISTS accent_color VARCHAR(20) DEFAULT 'blue' CHECK (accent_color IN ('blue', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'teal')),
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Set display_name to username for existing users where not set
UPDATE profiles SET display_name = username WHERE display_name IS NULL;

