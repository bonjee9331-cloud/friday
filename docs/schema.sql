-- Friday Supabase schema.
-- Paste this into your Supabase SQL editor to set up the backend.
-- Safe to run multiple times... all statements are CREATE IF NOT EXISTS.

-- ============================================================
-- CORE: Conversations and messages (the memory)
-- ============================================================

create table if not exists friday_conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  module text,
  source text,
  created_at timestamptz default now(),
  last_message_at timestamptz default now()
);

create table if not exists friday_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references