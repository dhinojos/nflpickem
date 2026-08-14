-- Preseason is no longer part of a pick'em season. Cascades remove its games,
-- picks, and tiebreakers before narrowing the enum used by existing databases.
delete from weeks where week_type = 'preseason';

alter type week_type rename to week_type_legacy;
create type week_type as enum ('regular','wildcard','divisional','conference','superbowl');
alter table weeks alter column week_type type week_type using week_type::text::week_type;
drop type week_type_legacy;
