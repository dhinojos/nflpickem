create extension if not exists pgcrypto;
create type user_status as enum ('active','disabled');
create type week_type as enum ('preseason','regular','wildcard','divisional','conference','superbowl');
create type game_status as enum ('scheduled','in_progress','final','canceled');

create table users (
  id uuid primary key default gen_random_uuid(), email text not null unique check (email = lower(email)), nickname text unique, avatar_url text,
  is_admin boolean not null default false, status user_status not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index users_nickname_lower_unique on users(lower(nickname)) where nickname is not null;
create table seasons (id uuid primary key default gen_random_uuid(), year int not null unique, status text not null default 'active', created_at timestamptz not null default now());
create table weeks (
  id uuid primary key default gen_random_uuid(), season_id uuid not null references seasons on delete cascade, week_number int not null, label text not null,
  week_type week_type not null, first_kickoff timestamptz not null, last_kickoff timestamptz not null, tiebreaker_game_id uuid,
  is_active_override boolean not null default false, manually_locked boolean not null default false, unique(season_id, week_type, week_number)
);
create table games (
  id uuid primary key default gen_random_uuid(), external_id text not null unique, season_id uuid not null references seasons on delete cascade, week_id uuid not null references weeks on delete cascade,
  home_team text not null, away_team text not null, home_name text not null, away_name text not null, home_logo text, away_logo text,
  home_score int, away_score int, kickoff_at timestamptz not null, status game_status not null default 'scheduled', winner text,
  result_overridden boolean not null default false, updated_at timestamptz not null default now()
);
alter table weeks add constraint weeks_tiebreaker_game_fk foreign key(tiebreaker_game_id) references games(id) on delete set null;
create index games_week on games(week_id); create index games_kickoff on games(kickoff_at);
create table picks (id uuid primary key default gen_random_uuid(), user_id uuid not null references users, game_id uuid not null references games on delete cascade, selected_team text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, game_id));
create index picks_game on picks(game_id); create index picks_user on picks(user_id);
create table tiebreakers (id uuid primary key default gen_random_uuid(), user_id uuid not null references users, week_id uuid not null references weeks on delete cascade, prediction int not null check(prediction between 0 and 200), updated_at timestamptz not null default now(), unique(user_id, week_id));
create table sync_metadata (key text primary key, last_success timestamptz, last_error text, updated_at timestamptz not null default now());

alter table users enable row level security; alter table seasons enable row level security; alter table weeks enable row level security; alter table games enable row level security; alter table picks enable row level security; alter table tiebreakers enable row level security;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('avatars','avatars',true,2097152,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
