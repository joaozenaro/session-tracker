import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '../services/sessionService';
import type {
  SessionInsert,
  SessionUpdate,
  CreateSeriesPayload,
  ExtendSeriesPayload,
} from '../types/session';

export const sessionKeys = {
  all: ['sessions'] as const,
  byClient: (clientId: string, beforeDate: string, excludeId?: string) =>
    ['sessions', 'by-client', clientId, beforeDate, excludeId ?? null] as const,
};

// ── Queries ──────────────────────────────────────────────────────────────────

export function useSessions() {
  return useQuery({
    queryKey: sessionKeys.all,
    queryFn: sessionService.getSessions,
  });
}

/**
 * Fetch previous sessions for a client before a given date.
 * Only runs when `clientId` and `beforeDate` are non-empty.
 */
export function useSessionsByClient(clientId: string, beforeDate: string, excludeId?: string) {
  const query = useQuery({
    queryKey: sessionKeys.byClient(clientId, beforeDate, excludeId),
    queryFn: () =>
      sessionService.getSessionsByClient({
        client_id: clientId,
        before_date: beforeDate,
        exclude_id: excludeId ?? null,
        limit: 5,
      }),
    enabled: !!clientId && !!beforeDate,
  });

  return {
    ...query,
    data: query.data?.sessions ?? [],
    isLastInSeries: query.data?.is_last_in_series ?? false,
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SessionInsert) => sessionService.createSession(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SessionUpdate }) =>
      sessionService.updateSession(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionService.deleteSession(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useCreateSessionSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSeriesPayload) => sessionService.createSessionSeries(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useExtendSessionSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExtendSeriesPayload) => sessionService.extendSessionSeries(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}
