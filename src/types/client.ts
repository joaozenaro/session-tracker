export interface Client {
  id: string;
  name: string;
  telephone: string;
  created_at: string;
  plan: string;
  medications: string;
  color: string;
  folder_name: string;
}

export type ClientInsert = Omit<
  Client,
  'id' | 'created_at' | 'plan' | 'medications' | 'folder_name'
>;
export type ClientUpdate = Partial<Omit<Client, 'id' | 'created_at' | 'folder_name'>>;

/** Map of client_id → session count, returned by `get_session_counts`. */
export type SessionCountMap = Record<string, number>;
