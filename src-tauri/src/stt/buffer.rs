use std::collections::VecDeque;

/// 10 seconds of audio at 16 kHz.
const MAX_SAMPLES: usize = 16_000 * 10;

/// Rolling audio ring buffer that keeps the latest `MAX_SAMPLES` f32 samples.
#[derive(Default)]
pub struct AudioRingBuffer {
    buf: VecDeque<f32>,
}

impl AudioRingBuffer {
    /// Push incoming samples, trimming the oldest if we exceed `MAX_SAMPLES`.
    pub fn push(&mut self, samples: &[f32]) {
        for &s in samples {
            if self.buf.len() == MAX_SAMPLES {
                self.buf.pop_front();
            }
            self.buf.push_back(s);
        }
    }

    /// Return all buffered samples as a contiguous slice.
    /// Whisper needs at least ~0.5 s (8 000 samples); callers should check length.
    pub fn window(&self) -> Vec<f32> {
        self.buf.iter().copied().collect()
    }

    pub fn clear(&mut self) {
        self.buf.clear();
    }
}
