use std::sync::{Arc, Mutex};

use serde::Serialize;
use tauri::Emitter;

use crate::{
    error::{AppError, CmdResult},
    stt::{buffer::AudioRingBuffer, capture::start_capture, engine::transcribe, state::TranscriptionState},
};

// ── Shared state ──────────────────────────────────────────────────────────────

/// The buffer lives in its own Arc so the cpal callback thread and the inference
/// loop thread can both access it without going through the outer Mutex
/// (which would deadlock if cpal held the lock while inference tries to).
pub struct SttInner {
    pub buffer:       Arc<Mutex<AudioRingBuffer>>,
    pub transcription: TranscriptionState,
    pub running:      bool,
    /// Dropping this Sender signals the cpal thread to stop and drop the Stream.
    pub stop_tx:      Option<std::sync::mpsc::SyncSender<()>>,
}

impl Default for SttInner {
    fn default() -> Self {
        Self {
            buffer:        Arc::new(Mutex::new(AudioRingBuffer::default())),
            transcription: TranscriptionState::default(),
            running:       false,
            stop_tx:       None,
        }
    }
}

// SttInner contains no !Send fields now — safe to assert.
// (AudioRingBuffer = VecDeque<f32>, TranscriptionState = Strings, SyncSender = Send)
pub type SttState = Arc<Mutex<SttInner>>;

// ── Event payload ─────────────────────────────────────────────────────────────

#[derive(Clone, Serialize)]
pub struct SttUpdate {
    pub confirmed: String,
    pub unstable:  String,
}

// ── Commands ──────────────────────────────────────────────────────────────────

/// Open the system microphone and begin transcribing.
/// Emits `stt://update` events every ~1 second.
#[tauri::command]
pub async fn start_recording(
    app:   tauri::AppHandle,
    state: tauri::State<'_, SttState>,
) -> CmdResult<()> {
    // ── Set up state, create stop channel ─────────────────────────────────────
    let (buffer_arc, stop_rx) = {
        let mut inner = state
            .lock()
            .map_err(|_| AppError::Validation("lock poisoned".into()))?;

        if inner.running {
            return Ok(());
        }
        inner.running = true;
        inner.transcription.reset();

        // Clear any leftover audio from a previous session
        if let Ok(mut buf) = inner.buffer.lock() {
            buf.clear();
        }

        let (stop_tx, stop_rx) = std::sync::mpsc::sync_channel::<()>(0);
        inner.stop_tx = Some(stop_tx);

        (Arc::clone(&inner.buffer), stop_rx)
    };

    // ── cpal capture thread ───────────────────────────────────────────────────
    // cpal::Stream is !Send, so it must be created AND dropped on the same thread.
    let buf_for_cpal = Arc::clone(&buffer_arc);
    std::thread::spawn(move || match start_capture(buf_for_cpal) {
        Ok(mic) => {
            // Block until the Sender is dropped (stop_recording) or sends.
            let _ = stop_rx.recv();
            drop(mic); // stops the ALSA stream
        }
        Err(e) => eprintln!("[stt] capture error: {e}"),
    });

    // ── Whisper inference loop ────────────────────────────────────────────────
    // Uses spawn_blocking because whisper inference is CPU-bound.
    let state_arc  = Arc::clone(&*state);
    let buffer_clone = Arc::clone(&buffer_arc);

    tokio::task::spawn_blocking(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_millis(1000));

            let running = match state_arc.lock() {
                Ok(g)  => g.running,
                Err(_) => break,
            };
            if !running {
                break;
            }

            let window = match buffer_clone.lock() {
                Ok(b)  => b.window(),
                Err(_) => break,
            };

            // Need at least 0.5 s (8 000 samples @ 16 kHz)
            if window.len() < 8_000 {
                continue;
            }

            let text = match transcribe(&window) {
                Ok(Some(t)) if !t.is_empty() => t,
                Ok(_) => continue, // silence or hallucination — skip
                Err(e) => { eprintln!("[stt] inference error: {e}"); continue; }
            };

            let update = match state_arc.lock() {
                Ok(mut g) => {
                    g.transcription.update(text);
                    SttUpdate {
                        confirmed: g.transcription.confirmed.clone(),
                        unstable:  g.transcription.unstable.clone(),
                    }
                }
                Err(_) => break,
            };

            let _ = app.emit("stt://update", update);
        }
    });

    Ok(())
}

/// Stop the microphone and return the final transcribed text.
#[tauri::command]
pub async fn stop_recording(state: tauri::State<'_, SttState>) -> CmdResult<String> {
    let mut inner = state
        .lock()
        .map_err(|_| AppError::Validation("lock poisoned".into()))?;

    inner.running = false;
    inner.stop_tx = None; // dropping SyncSender unblocks stop_rx.recv() in the cpal thread

    if let Ok(mut buf) = inner.buffer.lock() {
        buf.clear();
    }

    let full = if inner.transcription.unstable.is_empty() {
        inner.transcription.confirmed.clone()
    } else {
        format!("{} {}", inner.transcription.confirmed, inner.transcription.unstable)
            .trim()
            .to_string()
    };
    inner.transcription.reset();
    Ok(full)
}
