-- Add support for GIFs and other media in messages
-- Run this migration in your Supabase SQL editor

-- Add new columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS content_type VARCHAR(10) DEFAULT 'text' CHECK (content_type IN ('text', 'gif')),
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Create index for faster queries on content_type
CREATE INDEX IF NOT EXISTS idx_messages_content_type ON messages(content_type);

-- Update existing messages to have 'text' as content_type
UPDATE messages SET content_type = 'text' WHERE content_type IS NULL;

