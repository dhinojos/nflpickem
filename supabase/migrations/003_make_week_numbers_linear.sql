-- ESPN numbers postseason rounds from 1. Keep their round in week_type, but
-- number those weeks consecutively after the NFL's 18 regular-season weeks.
update weeks
set week_number = week_number + 18,
    label = case week_type
      when 'wildcard' then 'Semana ' || (week_number + 18) || ' · Comodines'
      when 'divisional' then 'Semana ' || (week_number + 18) || ' · Ronda divisional'
      when 'conference' then 'Semana ' || (week_number + 18) || ' · Finales de conferencia'
      when 'superbowl' then 'Semana ' || (week_number + 18) || ' · Super Bowl'
      else label
    end
where week_type in ('wildcard', 'divisional', 'conference', 'superbowl')
  and week_number between 1 and 4;
