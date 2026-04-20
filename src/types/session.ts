import type { Client } from './client';

export interface Session {
  id: string;
  client_id: string;
  session_date: string;
  session_time: string;
  notes: string;
  series_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type SessionInsert = Omit<Session, 'id' | 'created_at' | 'updated_at'>;
export type SessionUpdate = Partial<SessionInsert>;

export interface SessionWithClient extends Session {
  client: Client;
}

export interface SessionSeries {
  id: string;
  client_id: string;
  recurrence_type: 'weekly' | 'biweekly' | 'monthly';
  created_at: string;
}

export interface CreateSeriesPayload {
  client_id: string;
  recurrence_type: 'weekly' | 'biweekly' | 'monthly';
  start_date: string;
  start_time: string;
  num_sessions: number;
  notes?: string;
}

export interface ExtendSeriesPayload {
  series_id: string;
  from_date: string;
  recurrence_type: 'weekly' | 'biweekly' | 'monthly';
  num_sessions: number;
  session_time: string;
}

export interface SessionsByClientPayload {
  client_id: string;
  before_date: string;
  exclude_id?: string | null;
  limit: number;
}
