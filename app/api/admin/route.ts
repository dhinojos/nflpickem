import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readSession } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase';
import { syncSeason } from '@/lib/nfl/sync';

const weekTypes = z.array(z.enum(['preseason','regular','wildcard','divisional','conference','superbowl'])).min(1);

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  const db = getSupabaseAdmin();
  const { data: user } = await db.from('users').select('is_admin,status').eq('id', session.userId).single();
  if (!user?.is_admin || user.status !== 'active') return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  try {
    const body = z.object({ pin: z.string(), action: z.enum(['verifyPin','addUser','toggleUser','toggleAdmin','createSeason','deleteSeason','sync','setActiveSeason','setWeek','toggleLock','overrideGame','setTiebreaker']), payload: z.record(z.any()).default({}) }).parse(await request.json());
    if (!process.env.ADMIN_PIN || body.pin !== process.env.ADMIN_PIN) return NextResponse.json({ error: 'PIN incorrecto.' }, { status: 403 });
    let result: any = { ok: true };
    switch (body.action) {
      case 'verifyPin': break;
      case 'addUser': { const email = z.string().email().parse(body.payload.email).toLowerCase(); const { error } = await db.from('users').insert({ email }); if (error) throw error; break; }
      case 'toggleUser': await db.from('users').update({ status: body.payload.status }).eq('id', body.payload.id); break;
      case 'toggleAdmin': await db.from('users').update({ is_admin: !!body.payload.isAdmin }).eq('id', body.payload.id); break;
      case 'createSeason': {
        const year = z.number().int().min(2000).max(2100).parse(body.payload.year);
        const name = z.string().min(2).max(60).parse(body.payload.name);
        const types = weekTypes.parse(body.payload.weekTypes);
        if (body.payload.makeActive) await db.from('seasons').update({ is_active: false }).eq('is_active', true);
        const { data: season, error } = await db.from('seasons').insert({ year, name, week_types: types, is_active: !!body.payload.makeActive }).select().single();
        if (error) throw error;
        result = await syncSeason({ seasonId: season.id, year, weekTypes: types });
        break;
      }
      case 'deleteSeason': { const seasonId = z.string().uuid().parse(body.payload.seasonId); const { error } = await db.from('seasons').delete().eq('id', seasonId); if (error) throw error; break; }
      case 'sync': { const seasonId = z.string().uuid().parse(body.payload.seasonId); result = await syncSeason({ seasonId, weekTypes: weekTypes.optional().parse(body.payload.weekTypes) }); break; }
      case 'setActiveSeason': { const seasonId = z.string().uuid().parse(body.payload.seasonId); await db.from('seasons').update({ is_active: false }).eq('is_active', true); const { error } = await db.from('seasons').update({ is_active: true }).eq('id', seasonId); if (error) throw error; break; }
      case 'setWeek': await db.from('weeks').update({ is_active_override: false }).eq('season_id', body.payload.seasonId); if (body.payload.weekId) await db.from('weeks').update({ is_active_override: true }).eq('id', body.payload.weekId); break;
      case 'toggleLock': await db.from('weeks').update({ manually_locked: !!body.payload.locked }).eq('id', body.payload.weekId); break;
      case 'overrideGame': await db.from('games').update({ ...body.payload.values, result_overridden: true }).eq('id', body.payload.gameId); break;
      case 'setTiebreaker': await db.from('weeks').update({ tiebreaker_game_id: body.payload.gameId }).eq('id', body.payload.weekId); break;
    }
    return NextResponse.json(result);
  } catch (error) { console.error(error); return NextResponse.json({ error: 'No pudimos completar la acción.' }, { status: 400 }); }
}
