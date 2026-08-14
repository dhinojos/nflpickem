import { getSupabaseAdmin } from './supabase'; import { readSession } from './session'; import { canViewOtherTeamPicks, canViewOtherTiebreakers, calculatePickResult, calculateTiebreakerDifference, markWeeklyWinners, rankSeason } from './domain'; import type { WeeklyStanding } from './types';

export async function getAppData(seasonYear?: number, weekId?: string) {
  const session = await readSession(); if (!session) return null; const db = getSupabaseAdmin();
  const { data: user } = await db.from('users').select('id,nickname,avatar_url,is_admin,status').eq('id', session.userId).single(); if (!user || user.status !== 'active') return null;
  const { data: seasons } = await db.from('seasons').select('*').order('year', { ascending: false }); const season = seasons?.find(s => s.year === seasonYear) || seasons?.[0];
  if (!season) return { user, seasons: [], season: null, weeks: [], week: null, games: [], picks: [], players: [], tiebreakers: [], weekly: [], seasonStandings: [] };
  const { data: weeks } = await db.from('weeks').select('*').eq('season_id', season.id).order('first_kickoff'); const now = Date.now();
  const current = weeks?.find(w => Date.parse(w.first_kickoff) <= now && Date.parse(w.last_kickoff) >= now);
  const upcoming = weeks?.find(w => Date.parse(w.first_kickoff) > now);
  const week = weeks?.find(w => w.id === weekId) || current || upcoming || weeks?.at(-1);
  if (!week) return { user, seasons, season, weeks, week: null, games: [], picks: [], players: [], tiebreakers: [], weekly: [], seasonStandings: [] };
  const [{ data: games }, { data: players }, { data: allPicks }, { data: allTies }] = await Promise.all([
    db.from('games').select('*').eq('week_id', week.id).order('kickoff_at'), db.from('users').select('id,nickname,avatar_url').not('nickname','is',null).order('nickname'), db.from('picks').select('*').in('game_id', (await db.from('games').select('id').eq('week_id', week.id)).data?.map(g=>g.id)||[]), db.from('tiebreakers').select('*').eq('week_id', week.id)
  ]);
  const publicPicks = canViewOtherTeamPicks(week) ? allPicks : allPicks?.filter(p => p.user_id === user.id);
  const publicTies = canViewOtherTiebreakers(week) ? allTies : allTies?.filter(t => t.user_id === user.id);
  const tieGame = games?.find(g => g.id === week.tiebreaker_game_id); const actual = tieGame?.status === 'final' && tieGame.home_score != null && tieGame.away_score != null ? tieGame.home_score + tieGame.away_score : null;
  const weekly: WeeklyStanding[] = (players || []).map(p => { const pp = (allPicks || []).filter(x => x.user_id === p.id); const results = (games || []).map(g => calculatePickResult(g, pp.find(x => x.game_id === g.id)?.selected_team)); const pred = allTies?.find(t => t.user_id === p.id)?.prediction ?? null; return { userId:p.id,nickname:p.nickname,avatarUrl:p.avatar_url,correct:results.filter(x=>x===1).length,incorrect:results.filter(x=>x===0).length,pending:results.filter(x=>x===null).length,prediction:pred,difference:calculateTiebreakerDifference(pred,actual),winner:false }; });
  const marked = games?.every(g => ['final','canceled'].includes(g.status)) ? markWeeklyWinners(weekly) : weekly;
  const seasonWeeks = weeks || []; const { data: seasonGames } = await db.from('games').select('*').in('week_id', seasonWeeks.map(w=>w.id)); const { data: seasonPicks } = await db.from('picks').select('*').in('game_id',(seasonGames||[]).map(g=>g.id)); const { data: seasonTies } = await db.from('tiebreakers').select('*').in('week_id',seasonWeeks.map(w=>w.id));
  const weeklyWins=new Map<string,number>(); for(const sw of seasonWeeks){const wg=(seasonGames||[]).filter(g=>g.week_id===sw.id);if(!wg.length||!wg.every(g=>['final','canceled'].includes(g.status)))continue;const tg=wg.find(g=>g.id===sw.tiebreaker_game_id);const total=tg?.status==='final'?tg.home_score+tg.away_score:null;const rows=(players||[]).map(p=>{const results=wg.map(g=>calculatePickResult(g,seasonPicks?.find(x=>x.user_id===p.id&&x.game_id===g.id)?.selected_team));const prediction=seasonTies?.find(t=>t.user_id===p.id&&t.week_id===sw.id)?.prediction??null;return{userId:p.id,nickname:p.nickname,correct:results.filter(x=>x===1).length,incorrect:results.filter(x=>x===0).length,pending:results.filter(x=>x===null).length,prediction,difference:calculateTiebreakerDifference(prediction,total),winner:false}});markWeeklyWinners(rows).filter(r=>r.winner).forEach(r=>weeklyWins.set(r.userId,(weeklyWins.get(r.userId)||0)+1));}
  const seasonStandings = rankSeason((players||[]).map(p => ({ userId:p.id,nickname:p.nickname,avatarUrl:p.avatar_url,correct:(seasonGames||[]).reduce((n,g)=>n+(calculatePickResult(g,seasonPicks?.find(x=>x.user_id===p.id&&x.game_id===g.id)?.selected_team)===1?1:0),0),weeklyWins:weeklyWins.get(p.id)||0 })));
  return { user, seasons, season, weeks, week, games, picks:publicPicks, players, tiebreakers:publicTies, weekly:marked, seasonStandings, now:new Date().toISOString() };
}
