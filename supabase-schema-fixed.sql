-- DROP EXISTING TABLES (run this first if tables exist)
drop table if exists message_safety_analysis cascade;
drop table if exists messages cascade;
drop table if exists contacts cascade;
drop table if exists profiles cascade;

-- Profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text,
  auth_email text not null,
  role text check (role in ('parent', 'child')) not null,
  parent_id uuid references profiles(id) on delete cascade,
  invite_code uuid unique default gen_random_uuid() not null,
  restricted boolean default false,
  created_at timestamp default now()
);

-- Messages table
create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade not null,
  receiver_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp default now()
);

-- Contacts table
create table contacts (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid references profiles(id) on delete cascade not null,
  user2_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp default now(),
  unique(user1_id, user2_id)
);

-- Message Safety Analysis table (for OpenAI parental control feature)
create table message_safety_analysis (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  is_safe boolean not null,
  concerns text[] default '{}',
  analysis_details jsonb,
  analyzed_at timestamp default now(),
  unique(message_id)
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table messages enable row level security;
alter table contacts enable row level security;
alter table message_safety_analysis enable row level security;

-- Profiles RLS Policies (FIXED - no recursion)
create policy "Users can view own profile" 
  on profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile on signup"
  on profiles for insert
  with check (auth.uid() = id);

-- Separate policy for viewing all profiles (for invite code lookups)
create policy "Users can view other profiles for invites"
  on profiles for select
  using (true);

-- Messages RLS Policies
create policy "Users can view own messages"
  on messages for select
  using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

create policy "Parents can view children messages"
  on messages for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = messages.sender_id
      and profiles.parent_id = auth.uid()
    ) or
    exists (
      select 1 from profiles
      where profiles.id = messages.receiver_id
      and profiles.parent_id = auth.uid()
    )
  );

create policy "Users can send messages if not restricted"
  on messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from profiles
      where id = auth.uid()
      and (role = 'parent' or (role = 'child' and restricted = false))
    )
  );

-- Contacts RLS Policies
create policy "Users can view own contacts"
  on contacts for select
  using (
    auth.uid() = user1_id or auth.uid() = user2_id
  );

create policy "Parents can view children contacts"
  on contacts for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = contacts.user1_id
      and profiles.parent_id = auth.uid()
    ) or
    exists (
      select 1 from profiles
      where profiles.id = contacts.user2_id
      and profiles.parent_id = auth.uid()
    )
  );

create policy "Users can create contacts"
  on contacts for insert
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- Message Safety Analysis RLS Policies
create policy "Users can view analysis for own messages"
  on message_safety_analysis for select
  using (
    exists (
      select 1 from messages
      where messages.id = message_safety_analysis.message_id
      and (messages.sender_id = auth.uid() or messages.receiver_id = auth.uid())
    )
  );

create policy "Parents can view analysis for children messages"
  on message_safety_analysis for select
  using (
    exists (
      select 1 from messages
      join profiles on profiles.id = messages.sender_id
      where messages.id = message_safety_analysis.message_id
      and profiles.parent_id = auth.uid()
    ) or
    exists (
      select 1 from messages
      join profiles on profiles.id = messages.receiver_id
      where messages.id = message_safety_analysis.message_id
      and profiles.parent_id = auth.uid()
    )
  );

create policy "Service role can insert analysis"
  on message_safety_analysis for insert
  with check (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role can update analysis"
  on message_safety_analysis for update
  using (auth.jwt() ->> 'role' = 'service_role');

-- Enable Realtime for messages table (critical for real-time messaging)
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table contacts;

-- Indexes for better performance
create index idx_messages_sender on messages(sender_id);
create index idx_messages_receiver on messages(receiver_id);
create index idx_messages_created_at on messages(created_at desc);
create index idx_contacts_user1 on contacts(user1_id);
create index idx_contacts_user2 on contacts(user2_id);
create index idx_profiles_parent on profiles(parent_id);
create index idx_profiles_invite_code on profiles(invite_code);
create index idx_profiles_username on profiles(username);
create index idx_profiles_auth_email on profiles(auth_email);
create index idx_message_safety_analysis_message_id on message_safety_analysis(message_id);
create index idx_message_safety_analysis_is_safe on message_safety_analysis(is_safe);
create index idx_message_safety_analysis_analyzed_at on message_safety_analysis(analyzed_at desc);

-- Comments for documentation
comment on table message_safety_analysis is 'Stores OpenAI safety analysis results for messages. Prevents duplicate API calls and provides cached safety information for parental controls.';
comment on column message_safety_analysis.is_safe is 'Overall safety flag: true = safe (green), false = concerns detected (red)';
comment on column message_safety_analysis.concerns is 'Array of detected issues: bullying, swearing, unsafe, etc.';
comment on column message_safety_analysis.analysis_details is 'Full JSON response from OpenAI for detailed information';

