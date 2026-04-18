import { tauriInvoke } from './tauriInvoke';
import type {
  Session,
  SessionInsert,
  SessionUpdate,
  SessionWithClient,
  SessionSeries,
  CreateSeriesPayload,
  ExtendSeriesPayload,
} from '../types/session';

/**
 * All functions in this file are the only callers of Tauri commands
 * related to the `sessions` domain.
 *
 * Required Rust commands:
 *   - get_sessions                 → Vec<SessionWithClient>   (joined with clients)
 *   - get_sessions_by_client       → Vec<Session>             (filtered, ordered desc, limited)
 *   - create_session               → Session
 *   - update_session               → Session
 *   - delete_session               → ()
 *   - create_session_series        → SessionSeries            (+ bulk-inserts sessions)
 *   - extend_session_series        → ()                       (bulk-inserts sessions)
 */

export const sessionService = {
  /**
   * Fetch all sessions joined with their client data, ordered by
   * session_date DESC, session_time ASC.
   */
  getSessions(): Promise<SessionWithClient[]> {
    return tauriInvoke<SessionWithClient[]>('get_sessions');
  },

  /**
   * Fetch the most recent sessions for `clientId` that fall strictly
   * before `beforeDate` (YYYY-MM-DD), excluding `excludeId` if given.
   * Ordered session_date DESC, limited to `limit` rows.
   */
  getSessionsByClient(
    clientId: string,
    beforeDate: string,
    excludeId?: string,
    limit = 5
  ): Promise<Session[]> {
    return tauriInvoke<Session[]>('get_sessions_by_client', {
      client_id: clientId,
      before_date: beforeDate,
      exclude_id: excludeId ?? null,
      limit,
    });
  },

  /** Create a single session and return the created row. */
  createSession(payload: SessionInsert): Promise<Session> {
    return tauriInvoke<Session>('create_session', { payload });
  },

  /** Update a session by id and return the updated row. */
  updateSession(id: string, payload: SessionUpdate): Promise<Session> {
    return tauriInvoke<Session>('update_session', { id, payload });
  },

  /** Permanently delete a session by id. */
  deleteSession(id: string): Promise<void> {
    return tauriInvoke<void>('delete_session', { id });
  },

  /**
   * Create a new SessionSeries and bulk-insert `payload.num_sessions`
   * sessions starting at `payload.start_date` with the given recurrence.
   * Returns the created SessionSeries row.
   */
  createSessionSeries(payload: CreateSeriesPayload): Promise<SessionSeries> {
    return tauriInvoke<SessionSeries>('create_session_series', { payload });
  },

  /**
   * Extend an existing series by bulk-inserting `payload.num_sessions`
   * additional sessions starting from `payload.from_date`.
   */
  extendSessionSeries(payload: ExtendSeriesPayload): Promise<void> {
    return tauriInvoke<void>('extend_session_series', { payload });
  },
};
