export interface Client {
  id: string;
  name: string;
  telephone: string;
  created_at: string;
  plan: string;
  medications: string;
}

export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'plan' | 'medications'>;
export type ClientUpdate = Partial<Omit<Client, 'id' | 'created_at'>>;

/** Map of client_id → session count, returned by `get_session_counts`. */
export type SessionCountMap = Record<string, number>;
