import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSession, clearSession } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(await request.json()); const normalized = email.trim().toLowerCase();
    const { data: user } = await getSupabaseAdmin().from('users').select('*').eq('email', normalized).eq('status', 'active').maybeSingle();
    if (!user) return NextResponse.json({ error: 'Este correo no está autorizado para participar.' }, { status: 403 });
    await createSession({ userId: user.id, email: user.email });
    return NextResponse.json({ ok: true, needsProfile: !user.nickname });
  } catch { return NextResponse.json({ error: 'Ingresa un correo válido.' }, { status: 400 }); }
}
export async function DELETE() { clearSession(); return NextResponse.json({ ok: true }); }
