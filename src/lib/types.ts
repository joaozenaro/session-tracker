// Re-export shim — all types now live in src/types/
export type { Client, ClientInsert, ClientUpdate, SessionCountMap } from '../types/client';

export type {
  Session,
  SessionInsert,
  SessionUpdate,
  SessionWithClient,
  SessionSeries,
  CreateSeriesPayload,
  ExtendSeriesPayload,
} from '../types/session';
