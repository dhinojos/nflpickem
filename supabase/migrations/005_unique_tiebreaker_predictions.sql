-- Preserve historical duplicate results, but reject duplicate numbers on all
-- new submissions and updates. The advisory lock makes the check race-safe.
create or replace function prevent_duplicate_tiebreaker_prediction()
returns trigger
language plpgsql
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(NEW.week_id::text, 0));

  if exists (
    select 1
    from tiebreakers
    where week_id = NEW.week_id
      and prediction = NEW.prediction
      and id <> NEW.id
  ) then
    raise exception 'tiebreaker prediction already taken'
      using errcode = '23505';
  end if;

  return NEW;
end;
$$;

drop trigger if exists prevent_duplicate_tiebreaker_prediction on tiebreakers;
create trigger prevent_duplicate_tiebreaker_prediction
before insert or update of week_id, prediction on tiebreakers
for each row execute function prevent_duplicate_tiebreaker_prediction();
