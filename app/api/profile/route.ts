import { NextResponse } from 'next/server';
import { z } from 'zod'; import { readSession } from '@/lib/session'; import { getSupabaseAdmin } from '@/lib/supabase';
export async function POST(request: Request) {
  const session = await readSession(); if (!session) return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  try { const body = z.object({ nickname: z.string().trim().min(2).max(24), avatarUrl: z.string().url().nullable().optional() }).parse(await request.json());
    const { error } = await getSupabaseAdmin().from('users').update({ nickname: body.nickname, avatar_url: body.avatarUrl, updated_at: new Date().toISOString() }).eq('id', session.userId);
    if (error?.code === '23505') return NextResponse.json({ error: 'Ese apodo ya está en uso.' }, { status: 409 }); if (error) throw error; return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'No pudimos guardar tu perfil.' }, { status: 400 }); }
}
