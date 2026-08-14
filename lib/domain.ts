import type { Game, SeasonStanding, Week, WeeklyStanding } from './types';

export const canEditTeamPicks = (week: Pick<Week, 'first_kickoff' | 'manually_locked'>, now = new Date()) => !week.manually_locked && now.getTime() < new Date(week.first_kickoff).getTime();
export const canViewOtherTeamPicks = (week: Pick<Week, 'first_kickoff'>, now = new Date()) => now.getTime() >= new Date(week.first_kickoff).getTime();
export const canEditTiebreaker = (week: Pick<Week, 'last_kickoff'>, now = new Date()) => now.getTime() < new Date(week.last_kickoff).getTime();
export const canViewOtherTiebreakers = (week: Pick<Week, 'last_kickoff'>, now = new Date()) => now.getTime() >= new Date(week.last_kickoff).getTime();

export function calculatePickResult(game: Pick<Game, 'status' | 'winner'>, selectedTeam?: string | null) {
  if (game.status !== 'final' || !game.winner || !selectedTeam) return game.status === 'final' ? 0 : null;
  return game.winner === 'tie' ? 0 : Number(game.winner === selectedTeam);
}
export const calculateTiebreakerDifference = (prediction: number | null, actual: number | null) => prediction == null || actual == null ? null : Math.abs(prediction - actual);

export function markWeeklyWinners(rows: WeeklyStanding[]) {
  if (!rows.length) return rows;
  const max = Math.max(...rows.map(r => r.correct));
  const contenders = rows.filter(r => r.correct === max);
  const valid = contenders.filter(r => r.difference != null);
  const best = valid.length ? Math.min(...valid.map(r => r.difference!)) : null;
  return rows.map(r => ({ ...r, winner: r.correct === max && (best == null || r.difference === best) }));
}

export function rankSeason(rows: SeasonStanding[]) {
  const sorted = [...rows].sort((a, b) => b.correct - a.correct || b.weeklyWins - a.weeklyWins || a.nickname.localeCompare(b.nickname));
  let rank = 0;
  return sorted.map((row, i) => {
    if (i === 0 || row.correct !== sorted[i - 1].correct || row.weeklyWins !== sorted[i - 1].weeklyWins) rank = i + 1;
    return { ...row, rank };
  });
}

export function winnerForGame(game: Pick<Game, 'status' | 'home_score' | 'away_score' | 'home_team' | 'away_team'>) {
  if (game.status !== 'final' || game.home_score == null || game.away_score == null) return null;
  if (game.home_score === game.away_score) return 'tie';
  return game.home_score > game.away_score ? game.home_team : game.away_team;
}
