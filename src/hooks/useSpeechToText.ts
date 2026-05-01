import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useAppContext } from '../lib/AppContext';
import { t } from '../lib/i18n';

interface SttUpdate {
  confirmed: string;
  unstable: string;
}

interface UseSpeechToTextReturn {
  isRecording: boolean;
  confirmedText: string;
  unstableText: string;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>;
  error: string | null;
}

export function useSpeechToText(): UseSpeechToTextReturn {
  const { locale } = useAppContext();
  const [isRecording, setIsRecording] = useState(false);
  const [confirmedText, setConfirmedText] = useState('');
  const [unstableText, setUnstableText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  // Subscribe to Rust inference-loop events
  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    listen<SttUpdate>('stt://update', (event) => {
      setConfirmedText(event.payload.confirmed);
      setUnstableText(event.payload.unstable);
    }).then((fn) => {
      unlisten = fn;
      unlistenRef.current = fn;
    });
    return () => {
      unlisten?.();
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setConfirmedText('');
    setUnstableText('');
    try {
      await invoke('start_recording');
      setIsRecording(true);
    } catch (err) {
      console.error('[stt] start error:', err);
      setError(t(locale, 'micPermissionDenied'));
    }
  }, [locale]);

  const stopRecording = useCallback(async (): Promise<string> => {
    let finalText = '';
    try {
      finalText = await invoke<string>('stop_recording');
    } catch (err) {
      console.error('[stt] stop error:', err);
    }
    setIsRecording(false);
    setConfirmedText('');
    setUnstableText('');
    return finalText;
  }, []);

  return { isRecording, confirmedText, unstableText, startRecording, stopRecording, error };
}
