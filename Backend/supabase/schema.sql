-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Create chat sessions table
create table public.chat_sessions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    summary text,
    created_at timestamp with time zone default now() not null,
    last_message_at timestamp with time zone default now() not null
);

-- Create chat messages table
create table public.chat_messages (
    id uuid default uuid_generate_v4() primary key,
    session_id uuid references public.chat_sessions(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    content text not null,
    is_user boolean not null,
    type text not null,
    data jsonb,
    context jsonb,
    created_at timestamp with time zone default now() not null
);

-- Enable full text search on chat messages
create extension if not exists pg_trgm;
create index chat_messages_content_trgm_idx on public.chat_messages using gin (content gin_trgm_ops);

-- Row Level Security policies
create policy "Users can only access their own chat sessions"
    on public.chat_sessions
    for all
    using (auth.uid() = user_id);

create policy "Users can only access their own chat messages"
    on public.chat_messages
    for all
    using (auth.uid() = user_id);

-- Indexes for better performance
create index chat_sessions_user_id_idx on public.chat_sessions(user_id);
create index chat_sessions_last_message_at_idx on public.chat_sessions(last_message_at desc);
create index chat_messages_session_id_idx on public.chat_messages(session_id);
create index chat_messages_created_at_idx on public.chat_messages(created_at);

-- Function to update last_message_at
create or replace function public.update_last_message_timestamp()
returns trigger as $$
begin
    update public.chat_sessions
    set last_message_at = new.created_at
    where id = new.session_id;
    return new;
end;
$$ language plpgsql security definer;

-- Trigger to update last_message_at
create trigger update_chat_session_timestamp
    after insert on public.chat_messages
    for each row
    execute procedure public.update_last_message_timestamp();