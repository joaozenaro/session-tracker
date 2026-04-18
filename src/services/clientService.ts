import { tauriInvoke } from './tauriInvoke';
import type { Client, ClientInsert, ClientUpdate, SessionCountMap } from '../types/client';

/**
 * All functions in this file are the only callers of Tauri commands
 * related to the `clients` domain.
 *
 * Required Rust commands:
 *   - get_clients            → Vec<Client>
 *   - create_client          → Client
 *   - update_client          → Client
 *   - delete_client          → ()
 *   - get_session_counts     → HashMap<String, u32>
 */

export const clientService = {
  /** Fetch all clients ordered by name. */
  getClients(): Promise<Client[]> {
    return tauriInvoke<Client[]>('get_clients');
  },

  /** Create a new client and return the created row. */
  createClient(payload: ClientInsert): Promise<Client> {
    return tauriInvoke<Client>('create_client', { payload });
  },

  /** Update an existing client and return the updated row. */
  updateClient(id: string, payload: ClientUpdate): Promise<Client> {
    return tauriInvoke<Client>('update_client', { id, payload });
  },

  /** Permanently delete a client by id. */
  deleteClient(id: string): Promise<void> {
    return tauriInvoke<void>('delete_client', { id });
  },

  /**
   * Return a map of { client_id → session count } for all clients.
   * Used by ClientsPage to show the badge on each client card.
   */
  getSessionCounts(): Promise<SessionCountMap> {
    return tauriInvoke<SessionCountMap>('get_session_counts');
  },
};
