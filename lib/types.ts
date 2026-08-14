export type WeekType = 'regular' | 'wildcard' | 'divisional' | 'conference' | 'superbowl';
export type GameStatus = 'scheduled' | 'in_progress' | 'final' | 'canceled';
export type UserStatus = 'active' | 'disabled';

export interface Week { id: string; season_id: string; week_number: number; label: string; week_type: WeekType; first_kickoff: string; last_kickoff: string; tiebreaker_game_id: string | null; manually_locked: boolean; }
export interface Game { id: string; external_id: string; week_id: string; home_team: string; away_team: string; home_name: string; away_name: string; home_logo: string | null; away_logo: string | null; home_score: number | null; away_score: number | null; kickoff_at: string; status: GameStatus; winner: string | null; }
export interface Pick { user_id: string; game_id: string; selected_team: string; }
export interface Player { id: string; nickname: string; avatar_url: string | null; }
export interface WeeklyStanding { userId: string; nickname: string; avatarUrl?: string | null; correct: number; incorrect: number; pending: number; prediction: number | null; difference: number | null; winner: boolean; }
export interface SeasonStanding { userId: string; nickname: string; avatarUrl?: string | null; correct: number; weeklyWins: number; rank?: number; }
