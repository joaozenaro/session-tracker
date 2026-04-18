import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../services/clientService';
import type { ClientInsert, ClientUpdate } from '../types/client';

export const clientKeys = {
  all: ['clients'] as const,
  counts: ['session-counts'] as const,
};

// ── Queries ──────────────────────────────────────────────────────────────────

export function useClients() {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: clientService.getClients,
  });
}

export function useSessionCounts() {
  return useQuery({
    queryKey: clientKeys.counts,
    queryFn: clientService.getSessionCounts,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientInsert) => clientService.createClient(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClientUpdate }) =>
      clientService.updateClient(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientService.deleteClient(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: clientKeys.all });
      void qc.invalidateQueries({ queryKey: clientKeys.counts });
    },
  });
}
