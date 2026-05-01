use std::path::Path;

use once_cell::sync::OnceCell;
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

use crate::error::AppError;

/// Lazily-initialised Whisper context. Created once per process.
static WHISPER_CTX: OnceCell<WhisperContext> = OnceCell::new();

/// Minimum RMS level required before even calling Whisper.
/// Samples below this are essentially silence — skip inference entirely.
const MIN_RMS: f32 = 0.005;

/// Whisper's own "no speech" probability threshold.
/// Segments above this are discarded (hallucinations like "[Música]").
const NO_SPEECH_THR: f32 = 0.6;

/// Initialise (or no-op if already done).
pub fn init_engine(model_path: &Path) -> Result<(), AppError> {
    WHISPER_CTX.get_or_try_init(|| {
        let path_str = model_path
            .to_str()
            .ok_or_else(|| AppError::Validation("invalid model path".into()))?;
        WhisperContext::new_with_params(path_str, WhisperContextParameters::default())
            .map_err(|e| AppError::Validation(format!("whisper init: {e}")))
    })?;
    Ok(())
}

/// Compute root-mean-square of a sample window.
pub fn rms(samples: &[f32]) -> f32 {
    if samples.is_empty() {
        return 0.0;
    }
    let sum_sq: f32 = samples.iter().map(|s| s * s).sum();
    (sum_sq / samples.len() as f32).sqrt()
}

/// Run a full transcription on `samples` (f32, 16 kHz, mono).
/// Returns `None` if the audio is silent or Whisper is confident there is no speech.
/// Returns `Some("")` is a valid result (Whisper heard something but transcribed nothing).
pub fn transcribe(samples: &[f32]) -> Result<Option<String>, AppError> {
    // ── Silence gate ──────────────────────────────────────────────────────────
    if rms(samples) < MIN_RMS {
        return Ok(None);
    }

    let ctx = WHISPER_CTX
        .get()
        .ok_or_else(|| AppError::Validation("whisper not initialised".into()))?;

    let mut state = ctx
        .create_state()
        .map_err(|e| AppError::Validation(format!("whisper state: {e}")))?;

    let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
    params.set_language(Some("pt"));
    params.set_translate(false);
    params.set_print_special(false);
    params.set_print_progress(false);
    params.set_print_realtime(false);
    params.set_print_timestamps(false);
    params.set_no_context(false);
    // Tell Whisper to suppress segments it rates as "probably no speech"
    params.set_no_speech_thold(NO_SPEECH_THR);
    params.set_n_threads(
        std::thread::available_parallelism()
            .map(|n| n.get() as i32)
            .unwrap_or(4)
            .min(8),
    );

    state
        .full(params, samples)
        .map_err(|e| AppError::Validation(format!("whisper inference: {e}")))?;

    let n = state
        .full_n_segments()
        .map_err(|e| AppError::Validation(format!("whisper segments: {e}")))?;

    let mut text = String::new();
    for i in 0..n {
        if let Ok(seg) = state.full_get_segment_text(i) {
            let seg = seg.trim();
            // Also skip well-known hallucination tokens
            if is_hallucination(seg) {
                continue;
            }
            text.push_str(seg);
            text.push(' ');
        }
    }

    Ok(Some(text.trim().to_string()))
}

/// Reject known Whisper hallucination patterns.
fn is_hallucination(seg: &str) -> bool {
    // Whisper wraps special tokens in brackets — any [Token] is suspect when alone
    let trimmed = seg.trim();
    if trimmed.starts_with('[') && trimmed.ends_with(']') {
        return true;
    }
    // Common Portuguese / English hallucinations on silence
    matches!(
        trimmed,
        "[Música]"
            | "[música]"
            | "[Music]"
            | "[music]"
            | "[Ruído]"
            | "[BLANK_AUDIO]"
            | "(Música)"
            | "(Music)"
    )
}
