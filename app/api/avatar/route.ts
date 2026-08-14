import { NextResponse } from 'next/server'; import { readSession } from '@/lib/session'; import { getSupabaseAdmin } from '@/lib/supabase';
export async function POST(request: Request) {
  const session = await readSession(); if (!session) return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  const form = await request.formData(); const file = form.get('file'); if (!(file instanceof File) || file.size > 2_097_152 || !['image/jpeg','image/png','image/webp'].includes(file.type)) return NextResponse.json({ error: 'Usa una imagen JPG, PNG o WebP de máximo 2 MB.' }, { status: 400 });
  const ext = file.type.split('/')[1]; const path = `${session.userId}/${crypto.randomUUID()}.${ext}`; const db = getSupabaseAdmin(); const { error } = await db.storage.from('avatars').upload(path, file, { contentType: file.type }); if (error) return NextResponse.json({ error: 'No pudimos subir la imagen.' }, { status: 500 });
  return NextResponse.json({ url: db.storage.from('avatars').getPublicUrl(path).data.publicUrl });
}
