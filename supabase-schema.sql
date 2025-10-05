-- Profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text, -- Optional, only for parents
  auth_email text not null, -- Internal email used for Supabase Auth
  role text check (role in ('parent', 'child')) not null,
  parent_id uuid references profiles(id) on delete cascade,
  invite_code uuid unique default gen_random_uuid() not null,
  restricted boolean default false,
  created_at timestamp default now()
);

-- Message s table
create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade not null,
  receiver_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp default now()
);

-- Contacts table (chat connections based on invite codes)
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

-- Profiles RLS Policies
create policy "Users can view own profile" 
  on profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);

create policy "Parents can view children profiles" 
  on profiles for select 
  using (
    auth.uid() = parent_id or
    id in (select parent_id from profiles where id = auth.uid())
  );

create policy "Anyone can view profiles by invite code or username"
  on profiles for select
  using (true);

create policy "Anyone can insert profiles on signup"
  on profiles for insert
  with check (true);

-- Messages RLS Policies
create policy "Users can view messages they sent or received"
  on messages for select
  using (
    auth.uid() = sender_id or
    auth.uid() = receiver_id or
    sender_id in (select id from profiles where parent_id = auth.uid()) or
    receiver_id in (select id from profiles where parent_id = auth.uid())
  );

create policy "Users can send messages"
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
create policy "Users can view their contacts"
  on contacts for select
  using (
    auth.uid() = user1_id or 
    auth.uid() = user2_id or
    user1_id in (select id from profiles where parent_id = auth.uid()) or
    user2_id in (select id from profiles where parent_id = auth.uid())
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
