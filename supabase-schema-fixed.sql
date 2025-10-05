-- DROP EXISTING TABLES (run this first if tables exist)
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

-- Enable Row Level Security
alter table profiles enable row level security;
alter table messages enable row level security;
alter table contacts enable row level security;

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

