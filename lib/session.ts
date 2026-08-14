import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const name = 'pickem_session';
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || 'development-secret-change-me-now');
export type Session = { userId: string; email: string };

export async function createSession(value: Session) {
  const token = await new SignJWT(value).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(secret());
  cookies().set(name, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
}
export async function readSession(): Promise<Session | null> {
  const token = cookies().get(name)?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, secret())).payload as unknown as Session; } catch { return null; }
}
export function clearSession() { cookies().delete(name); }
