import { getSupabaseAdmin } from '@/lib/supabase';
import { EspnNFLProvider } from './provider'; import type { WeekType } from '@/lib/types';

export async function syncSeason({ seasonId, year, weekTypes }: { seasonId?: string; year?: number; weekTypes?: WeekType[] } = {}) {
  const db = getSupabaseAdmin(); const provider = new EspnNFLProvider(); const seasonYear = year || provider.getSeason();
  const seasonResult = seasonId ? await db.from('seasons').select().eq('id', seasonId).single() : await db.from('seasons').select().eq('is_active', true).maybeSingle();
  let { data: season, error: seasonError } = seasonResult;
  if (!season && !seasonError && !seasonId) ({ data: season, error: seasonError } = await db.from('seasons').insert({ year: seasonYear, name: `Temporada ${seasonYear}`, is_active: true }).select().single());
  if (seasonError) throw seasonError;
  if (!season) throw new Error('No se encontró la temporada.');
  const selectedWeekTypes = weekTypes || season.week_types || ['regular','wildcard','divisional','conference','superbowl'];
  const providerGames = await provider.getGames(seasonYear, selectedWeekTypes); const groups = new Map<string, typeof providerGames>();
  providerGames.forEach(g => { const key = `${g.weekType}-${g.week}`; groups.set(key, [...(groups.get(key) || []), g]); });
  let count = 0;
  for (const games of groups.values()) {
    const first = games[0]; const sorted = [...games].sort((a,b) => Date.parse(a.kickoffAt) - Date.parse(b.kickoffAt));
    const weekPayload = { season_id: season.id, week_number: first.week, week_type: first.weekType, label: first.weekLabel, first_kickoff: sorted[0].kickoffAt, last_kickoff: sorted.at(-1)!.kickoffAt };
    const { data: week, error } = await db.from('weeks').upsert(weekPayload, { onConflict: 'season_id,week_type,week_number' }).select().single(); if (error) throw error;
    for (const game of games) {
      const winner = game.status !== 'final' ? null : game.homeScore === game.awayScore ? 'tie' : (game.homeScore! > game.awayScore! ? game.homeTeam : game.awayTeam);
      const { error: gameError } = await db.from('games').upsert({ external_id: game.externalId, season_id: season.id, week_id: week.id, home_team: game.homeTeam, away_team: game.awayTeam, home_name: game.homeName, away_name: game.awayName, home_logo: game.homeLogo, away_logo: game.awayLogo, home_score: game.homeScore, away_score: game.awayScore, kickoff_at: game.kickoffAt, status: game.status, winner }, { onConflict: 'season_id,external_id', ignoreDuplicates: false });
      if (gameError) throw gameError; count++;
    }
    const { data: lastGame } = await db.from('games').select('id').eq('season_id', season.id).eq('external_id', sorted.at(-1)!.externalId).single();
    await db.from('weeks').update({ tiebreaker_game_id: lastGame?.id }).eq('id', week.id);
  }
  await db.from('sync_metadata').upsert({ key: 'schedule', last_success: new Date().toISOString(), last_error: null }, { onConflict: 'key' });
  return { season: seasonYear, games: count };
}
