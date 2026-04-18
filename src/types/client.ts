export interface Client {
  id: string;
  name: string;
  telephone: string;
  created_at: string;
}

export type ClientInsert = Omit<Client, 'id' | 'created_at'>;
export type ClientUpdate = Partial<ClientInsert>;

/** Map of client_id → session count, returned by `get_session_counts`. */
export type SessionCountMap = Record<string, number>;
