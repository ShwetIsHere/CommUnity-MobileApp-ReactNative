-- ============================================
-- Fix RLS Policies for Conversations and Chat
-- Run this in Supabase SQL Editor to fix the message button issue
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view conversations they're part of" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON conversation_participants;

-- ============================================
-- UPDATED: Conversations Table Policies
-- ============================================

-- Allow users to view conversations they're part of
CREATE POLICY "Users can view conversations they're part of"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

-- Allow any authenticated user to create conversations
CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update conversations they're part of
CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

-- ============================================
-- UPDATED: Conversation Participants Policies
-- ============================================

-- Allow any authenticated user to add participants when creating a conversation
-- This fixes the circular dependency issue
CREATE POLICY "Authenticated users can add participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Alternative: Allow users to add themselves and one other person
-- (Uncomment this and comment out the above if you want stricter control)
/*
CREATE POLICY "Users can add participants including themselves"
  ON conversation_participants FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
      )
    )
  );
*/

-- ============================================
-- VERIFICATION
-- ============================================

-- You can verify the policies are applied by running:
-- SELECT * FROM pg_policies WHERE tablename IN ('conversations', 'conversation_participants');

-- Test conversation creation:
-- INSERT INTO conversations (created_at, updated_at) VALUES (NOW(), NOW()) RETURNING *;
