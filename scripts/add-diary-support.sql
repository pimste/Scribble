-- Add diary support and image content type for messages
-- Run this migration in your Supabase SQL editor

-- 1. Extend content_type to include 'image'
-- Drop existing check constraint (name may vary; try common patterns)
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_content_type_check;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_content_type_check1;

-- Add new constraint allowing text, gif, and image
ALTER TABLE messages ADD CONSTRAINT messages_content_type_check 
  CHECK (content_type IN ('text', 'gif', 'image'));

-- 2. Create user_saved_messages table for diary saved items
CREATE TABLE IF NOT EXISTS user_saved_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- Enable RLS
ALTER TABLE user_saved_messages ENABLE ROW LEVEL SECURITY;

-- Users can only view their own saved messages
CREATE POLICY "Users can view own saved messages"
  ON user_saved_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved messages (only for messages they can read)
CREATE POLICY "Users can save messages to diary"
  ON user_saved_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_id
      AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
  );

-- Users can delete their own saved messages
CREATE POLICY "Users can remove saved messages"
  ON user_saved_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_saved_messages_user_id ON user_saved_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_messages_created_at ON user_saved_messages(created_at DESC);

-- 3. Allow restricted users to send messages to themselves (diary)
CREATE POLICY "Users can send messages to themselves"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() = receiver_id
  );
