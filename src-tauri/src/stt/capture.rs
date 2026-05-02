use std::sync::{Arc, Mutex};

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use rubato::{FftFixedIn, Resampler};

use crate::error::AppError;
use crate::stt::buffer::AudioRingBuffer;

/// Holds the live cpal stream so it stays alive while recording.
/// Dropping this stops the stream.
pub struct MicStream {
    _stream: cpal::Stream,
}

/// List all available audio input devices.
/// Returns a list of (id, display_name) pairs where id == name for simplicity.
pub fn list_input_devices() -> Vec<(String, String)> {
    let host = cpal::default_host();
    match host.input_devices() {
        Ok(devices) => devices
            .filter_map(|d| d.name().ok().map(|n| (n.clone(), n)))
            .collect(),
        Err(e) => {
            eprintln!("[stt] failed to enumerate input devices: {e}");
            vec![]
        }
    }
}

/// Open the given input device (or the system default if `device_name` is None),
/// capture audio, resample to 16 kHz mono, and push samples into the shared ring buffer.
///
/// Returns a `MicStream` guard — drop it to stop recording.
pub fn start_capture(
    buffer: Arc<Mutex<AudioRingBuffer>>,
    device_name: Option<&str>,
) -> Result<MicStream, AppError> {
    let host = cpal::default_host();

    let device = if let Some(name) = device_name {
        // Try to find the named device; fall back to default on failure
        let found = host
            .input_devices()
            .map_err(|e| AppError::Validation(format!("enumerate devices: {e}")))?
            .find(|d| d.name().map(|n| n.contains(name)).unwrap_or(false));

        match found {
            Some(d) => {
                eprintln!("[stt] using selected mic: {:?}", d.name());
                d
            }
            None => {
                eprintln!("[stt] device '{name}' not found, falling back to default");
                host.default_input_device()
                    .ok_or_else(|| AppError::Validation("no input device available".into()))?
            }
        }
    } else {
        host.default_input_device()
            .ok_or_else(|| AppError::Validation("no input device available".into()))?
    };

    let config = device
        .default_input_config()
        .map_err(|e| AppError::Validation(format!("input config: {e}")))?;

    let sample_rate = config.sample_rate().0 as usize;
    let channels = config.channels() as usize;

    // Rubato resampler: src_rate → 16 kHz, mono, chunk = 1024
    let chunk = 1024usize;
    let need_resample = sample_rate != 16_000;

    let resampler: Arc<Mutex<Option<FftFixedIn<f32>>>> = if need_resample {
        let r = FftFixedIn::<f32>::new(sample_rate, 16_000, chunk, 2, 1)
            .map_err(|e| AppError::Validation(format!("rubato init: {e}")))?;
        Arc::new(Mutex::new(Some(r)))
    } else {
        Arc::new(Mutex::new(None))
    };

    // Accumulation buffer for incomplete chunks before resampling
    let leftovers: Arc<Mutex<Vec<f32>>> = Arc::new(Mutex::new(Vec::new()));

    let buf_clone = Arc::clone(&buffer);
    let resampler_clone = Arc::clone(&resampler);
    let leftovers_clone = Arc::clone(&leftovers);

    let err_fn = |e| eprintln!("[cpal] stream error: {e}");

    let stream = match config.sample_format() {
        cpal::SampleFormat::F32 => build_stream::<f32>(
            &device, &config.into(), channels, buf_clone, resampler_clone, leftovers_clone, need_resample, chunk, err_fn,
        ),
        cpal::SampleFormat::I16 => build_stream::<i16>(
            &device, &config.into(), channels, buf_clone, resampler_clone, leftovers_clone, need_resample, chunk, err_fn,
        ),
        cpal::SampleFormat::U8 => build_stream::<u8>(
            &device, &config.into(), channels, buf_clone, resampler_clone, leftovers_clone, need_resample, chunk, err_fn,
        ),
        _ => return Err(AppError::Validation("unsupported sample format".into())),
    }
    .map_err(|e| AppError::Validation(format!("build stream: {e}")))?;

    stream
        .play()
        .map_err(|e| AppError::Validation(format!("play stream: {e}")))?;

    Ok(MicStream { _stream: stream })
}

fn build_stream<T>(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    channels: usize,
    buffer: Arc<Mutex<AudioRingBuffer>>,
    resampler: Arc<Mutex<Option<FftFixedIn<f32>>>>,
    leftovers: Arc<Mutex<Vec<f32>>>,
    need_resample: bool,
    chunk: usize,
    err_fn: impl Fn(cpal::StreamError) + Send + 'static,
) -> Result<cpal::Stream, cpal::BuildStreamError>
where
    T: cpal::Sample + cpal::SizedSample + Send + 'static,
    f32: From<T>,
{
    device.build_input_stream(
        config,
        move |data: &[T], _| {
            // Down-mix to mono f32
            let mono: Vec<f32> = data
                .chunks(channels)
                .map(|frame| frame.iter().map(|&s| f32::from(s)).sum::<f32>() / channels as f32)
                .collect();

            let samples_to_push = if need_resample {
                let mut lo = leftovers.lock().unwrap();
                lo.extend_from_slice(&mono);

                let mut out = Vec::new();
                while lo.len() >= chunk {
                    let slice: Vec<f32> = lo.drain(..chunk).collect();
                    let waves_in = vec![slice];
                    if let Ok(mut r) = resampler.lock() {
                        if let Some(ref mut r) = *r {
                            if let Ok(waves_out) = r.process(&waves_in, None) {
                                out.extend_from_slice(&waves_out[0]);
                            }
                        }
                    }
                }
                out
            } else {
                mono
            };

            if let Ok(mut buf) = buffer.lock() {
                buf.push(&samples_to_push);
            }
        },
        err_fn,
        None,
    )
}
