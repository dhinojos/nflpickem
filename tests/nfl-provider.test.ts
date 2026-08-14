import { afterEach, describe, expect, it, vi } from 'vitest';
import { EspnNFLProvider } from '../lib/nfl/provider';

const event = (id: string, seasonType: number, week: number) => ({
  id, season: { type: seasonType }, week: { number: week }, date: '2026-09-10T00:00:00Z',
  competitions: [{ competitors: [
    { homeAway: 'home', team: { abbreviation: 'KC', displayName: 'Kansas City Chiefs' }, score: '0' },
    { homeAway: 'away', team: { abbreviation: 'BUF', displayName: 'Buffalo Bills' }, score: '0' },
  ], status: { type: { completed: false, state: 'pre' } } }],
});

afterEach(() => vi.unstubAllGlobals());

describe('EspnNFLProvider', () => {
  it('keeps only regular and four postseason weeks from ESPN responses', async () => {
    const events = [event('preseason', 1, 1), event('regular', 2, 1), event('wildcard', 3, 1), event('superbowl', 3, 4), event('probowl', 3, 5)];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events }) }));

    const games = await new EspnNFLProvider('https://example.test').getGames(2026);

    expect(games.map(game => [game.externalId, game.week, game.weekType])).toEqual([
      ['regular', 1, 'regular'],
      ['wildcard', 19, 'wildcard'],
      ['superbowl', 22, 'superbowl'],
    ]);
  });
});
