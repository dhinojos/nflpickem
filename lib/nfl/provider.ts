import type { GameStatus, WeekType } from '@/lib/types';

export type ProviderGame = { externalId: string; season: number; week: number; weekType: WeekType; weekLabel: string; kickoffAt: string; homeTeam: string; awayTeam: string; homeName: string; awayName: string; homeLogo: string | null; awayLogo: string | null; homeScore: number | null; awayScore: number | null; status: GameStatus };
export interface NFLDataProvider { getSeason(): number; getGames(season: number): Promise<ProviderGame[]>; }

const typeMap: Record<number, WeekType> = { 1: 'preseason', 2: 'regular', 3: 'wildcard', 4: 'superbowl' };
export class EspnNFLProvider implements NFLDataProvider {
  constructor(private baseUrl = process.env.NFL_PROVIDER_BASE_URL || 'https://site.api.espn.com/apis/site/v2/sports/football/nfl') {}
  getSeason() { const now = new Date(); return now.getUTCMonth() < 3 ? now.getUTCFullYear() - 1 : now.getUTCFullYear(); }
  async getGames(season: number) {
    const all: ProviderGame[] = [];
    for (const seasonType of [1, 2, 3]) {
      const response = await fetch(`${this.baseUrl}/scoreboard?limit=1000&dates=${season}&seasontype=${seasonType}`, { next: { revalidate: 3600 } });
      if (!response.ok) throw new Error(`NFL provider: ${response.status}`);
      const json = await response.json();
      for (const event of json.events || []) {
        const competition = event.competitions?.[0]; const competitors = competition?.competitors || [];
        const home = competitors.find((c: any) => c.homeAway === 'home'); const away = competitors.find((c: any) => c.homeAway === 'away');
        if (!home || !away) continue;
        const completed = competition.status?.type?.completed; const state = competition.status?.type?.state;
        const weekNumber = event.week?.number || 1;
        let weekType = typeMap[seasonType] || 'regular';
        if (seasonType === 3) weekType = weekNumber === 1 ? 'wildcard' : weekNumber === 2 ? 'divisional' : weekNumber === 3 ? 'conference' : 'superbowl';
        all.push({ externalId: event.id, season, week: weekNumber, weekType, weekLabel: event.week?.text || `Semana ${weekNumber}`, kickoffAt: event.date,
          homeTeam: home.team.abbreviation, awayTeam: away.team.abbreviation, homeName: home.team.displayName, awayName: away.team.displayName,
          homeLogo: home.team.logo || null, awayLogo: away.team.logo || null, homeScore: home.score == null ? null : Number(home.score), awayScore: away.score == null ? null : Number(away.score),
          status: completed ? 'final' : state === 'in' ? 'in_progress' : competition.status?.type?.name === 'STATUS_CANCELED' ? 'canceled' : 'scheduled' });
      }
    }
    return all;
  }
}
