import { NextResponse } from 'next/server'; import { z } from 'zod'; import { readSession } from '@/lib/session'; import { getSupabaseAdmin } from '@/lib/supabase'; import { calculatePickResult, calculateWeeklyWinStatuses, canEditTiebreaker } from '@/lib/domain';

export async function POST(request:Request){
  const s=await readSession(); if(!s)return NextResponse.json({error:'Sesión no válida.'},{status:401});
  try{
    const b=z.object({weekId:z.string().uuid(),prediction:z.number().int().min(0).max(200)}).parse(await request.json());
    const db=getSupabaseAdmin();
    const {data:w}=await db.from('weeks').select('*').eq('id',b.weekId).single();
    if(!w)return NextResponse.json({error:'La semana no existe.'},{status:404});
    const {data:games}=await db.from('games').select('*').eq('week_id',w.id).order('kickoff_at');
    const tieGame=games?.find(g=>g.id===w.tiebreaker_game_id);
    const sundayNightGame=games?.at(-2);
    if(!tieGame||!canEditTiebreaker(sundayNightGame,tieGame))return NextResponse.json({error:'El desempate sólo está disponible después del partido del domingo por la noche y antes del partido del lunes por la noche.'},{status:409});
    const [{data:players},{data:picks}]=await Promise.all([
      db.from('users').select('id,nickname').eq('status','active').not('nickname','is',null),
      db.from('picks').select('*').in('game_id',(games||[]).map(g=>g.id))
    ]);
    const rows=(players||[]).map(player=>{const own=(picks||[]).filter(p=>p.user_id===player.id);const results=(games||[]).map(game=>calculatePickResult(game,own.find(p=>p.game_id===game.id)?.selected_team));return {userId:player.id,nickname:player.nickname,correct:results.filter(x=>x===1).length,incorrect:results.filter(x=>x===0).length,pending:results.filter(x=>x===null).length,prediction:null,difference:null,winner:false};});
    if(calculateWeeklyWinStatuses(rows,games||[],picks||[]).get(s.userId)!=='tiebreaker')return NextResponse.json({error:'Sólo los jugadores con posibilidad de empate pueden elegir desempate.'},{status:403});
    const {data:existing}=await db.from('tiebreakers').select('prediction').eq('week_id',w.id).eq('user_id',s.userId).maybeSingle();
    if(existing)return NextResponse.json({error:'El desempate ya fue enviado y no se puede cambiar.',code:'TIEBREAKER_LOCKED'},{status:409});
    const {data:used}=await db.from('tiebreakers').select('user_id').eq('week_id',w.id).eq('prediction',b.prediction).limit(1).maybeSingle();
    if(used&&used.user_id!==s.userId)return NextResponse.json({error:'Ese número ya fue elegido por otro jugador.',code:'TIEBREAKER_TAKEN'},{status:409});
    const {error}=await db.from('tiebreakers').insert({user_id:s.userId,week_id:w.id,prediction:b.prediction,updated_at:new Date().toISOString()});
    if(error){if(error.code==='23505')return NextResponse.json({error:'Ese número ya fue elegido por otro jugador.',code:'TIEBREAKER_TAKEN'},{status:409});throw error;}
    return NextResponse.json({ok:true});
  }catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:'El número de desempate no es válido.'},{status:400});return NextResponse.json({error:'No pudimos guardar el desempate.'},{status:400});}
}
