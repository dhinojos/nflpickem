-- Sólo para desarrollo. No ejecutar automáticamente en producción.
insert into users(email,nickname,is_admin) values
 ('admin@example.com','La Comisionada',true),('carlos@example.com','Carlos',false),('david@example.com','David',false),('alex@example.com','Alex',false)
on conflict(email) do nothing;
insert into seasons(year,status) values(2026,'active') on conflict(year) do nothing;
do $$ declare sid uuid; wid uuid; begin
 select id into sid from seasons where year=2026;
 insert into weeks(season_id,week_number,label,week_type,first_kickoff,last_kickoff) values(sid,1,'Semana 1','regular','2026-09-11T00:20:00Z','2026-09-15T00:15:00Z') on conflict(season_id,week_type,week_number) do update set label=excluded.label returning id into wid;
 insert into games(external_id,season_id,week_id,home_team,away_team,home_name,away_name,kickoff_at,status) values
 ('demo-1',sid,wid,'KC','BUF','Kansas City Chiefs','Buffalo Bills','2026-09-11T00:20:00Z','scheduled'),
 ('demo-2',sid,wid,'PHI','DAL','Philadelphia Eagles','Dallas Cowboys','2026-09-14T17:00:00Z','scheduled'),
 ('demo-3',sid,wid,'SF','LAR','San Francisco 49ers','Los Angeles Rams','2026-09-15T00:15:00Z','scheduled') on conflict(external_id) do nothing;
 update weeks set tiebreaker_game_id=(select id from games where external_id='demo-3') where id=wid;
end $$;
