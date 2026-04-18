import { invoke } from '@tauri-apps/api/core';

/**
 * Thin wrapper around Tauri `invoke` that converts Rust error strings/objects
 * into proper JS `Error` instances, making them compatible with React Query's
 * error handling.
 */
export async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (e) {
    if (e instanceof Error) throw e;
    // Tauri surfaces Rust errors as plain strings or serialised objects
    const message =
      typeof e === 'string' ? e : ((e as { message?: string })?.message ?? JSON.stringify(e));
    throw new Error(message);
  }
}
