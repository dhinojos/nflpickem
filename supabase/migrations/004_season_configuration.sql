-- Allow separate competitions for the same NFL calendar year and let one be
-- the default season shown to participants.
alter table seasons drop constraint if exists seasons_year_key;
alter table seasons add column if not exists name text;
alter table seasons add column if not exists is_active boolean not null default false;
alter table seasons add column if not exists week_types text[] not null default array['regular','wildcard','divisional','conference','superbowl'];

update seasons
set name = coalesce(name, 'Temporada ' || year::text);

alter table seasons alter column name set not null;
create unique index if not exists seasons_one_active_idx on seasons (is_active) where is_active;
create unique index if not exists seasons_name_unique_idx on seasons (lower(name));

update seasons set is_active = true
where id = (select id from seasons order by year desc, created_at desc limit 1)
  and not exists (select 1 from seasons where is_active);

alter type week_type add value if not exists 'preseason';

alter table games drop constraint if exists games_external_id_key;
create unique index if not exists games_season_external_id_unique_idx on games (season_id, external_id);
