# 🎤 Local Real-Time Portuguese Transcription (Tauri + whisper-rs)

## 🧠 Overview

Build a **fully offline, near real-time speech-to-text system** using:

- Tauri (Rust backend + web frontend)
- whisper-rs (Rust bindings for whisper.cpp)
- Rolling audio buffer + repeated inference (“pseudo-streaming”)
- Dual-layer UI:
  - ✅ Confirmed text (stable)
  - ⚡ Unstable text (live updates)

---

## 🏗️ Architecture

```

Mic (frontend)
↓ (chunks ~250ms)
Tauri command (push_audio_chunk)
↓
Audio ring buffer (5–10s)
↓ (every 1s)
Whisper inference (whisper-rs)
↓
Diff engine
↓
Frontend UI update:

* confirmed_text
* unstable_text

```

---

## 📦 Project Structure

```

src-tauri/
├── src/
│   ├── audio/
│   │   ├── buffer.rs
│   │   ├── resampler.rs
│   │
│   ├── whisper/
│   │   ├── engine.rs
│   │   ├── inference.rs
│   │
│   ├── transcription/
│   │   ├── diff.rs
│   │   ├── state.rs
│   │
│   ├── commands.rs
│   └── main.rs

```

---

## 🎙️ Step 1 — Frontend Audio Capture

- Use `navigator.mediaDevices.getUserMedia`
- Use `MediaRecorder`
- Emit audio chunks every **~250ms**

```js
recorder.start(250);
```

- Send chunks to Tauri via `invoke("push_audio_chunk")`

---

## 🔊 Step 2 — Audio Processing (Rust)

### Requirements

Convert all audio to:

- mono
- 16kHz
- `f32`

### Tasks

- Decode browser audio (webm/opus → PCM)
- Resample to 16kHz
- Convert to mono
- Normalize to `f32`

---

## 🧱 Step 3 — Ring Buffer

### Purpose

Maintain a rolling window of recent audio (5–10 seconds)

### Behavior

- Append incoming samples
- Trim overflow from the front
- Always expose latest window

---

## 🧠 Step 4 — Whisper Engine

### Initialization (once)

- Load model (e.g. `ggml-base.bin` or `ggml-small.bin`)
- Create `WhisperContext`

### Parameters

- language: `"pt"`
- translate: `false`
- threads: based on CPU
- no_context: `false`

---

## ⏱️ Step 5 — Inference Loop

Run a background loop:

- Interval: **1000ms**
- Steps:
  1. Read buffer window
  2. Run transcription
  3. Pass result to diff engine
  4. Emit UI update event

---

## ✂️ Step 6 — Diff Engine

### Goal

Split transcription into:

- stable (confirmed)
- unstable (changing)

### Strategy

- Compare previous and current word arrays
- Find longest common prefix
- Split at divergence point

---

## 🧾 Step 7 — Transcription State

Maintain:

```
confirmed_text: String
unstable_text: String
previous_full_text: String
```

Update each inference cycle.

---

## 🖥️ Step 8 — Frontend UI

### Rendering

- Show confirmed text normally
- Show unstable text with reduced opacity

### Example

```
[confirmed text][unstable text...]
```

---

## ⚙️ Configuration

### Model Selection

| Model | Speed  | Accuracy |
| ----- | ------ | -------- |
| base  | fast   | good     |
| small | medium | better   |

Recommended: `small` (if CPU allows)

---

### Buffer Settings

- Buffer size: 5–10 seconds
- Chunk size: 250ms
- Inference interval: 1000ms

---

## ⚡ Performance Optimization

- Reuse Whisper context (DO NOT recreate)
- Run inference on background thread
- Limit inference frequency
- Trim silence (optional VAD)

---

## 🧠 Advanced Enhancements (Optional)

### 1. Stabilization Heuristics

- Lock words after appearing unchanged N times

### 2. Overlapping Windows

- Improve sentence continuity

### 3. Voice Activity Detection (VAD)

- Skip silent chunks

### 4. Incremental Processing

- Reuse previous tokens (advanced)

---

## 🚨 Common Pitfalls

- Not resampling audio to 16kHz
- Recreating Whisper context per inference
- Too small buffer → broken sentences
- UI replacing full text → flickering

---

## ✅ Success Criteria

- Text updates every ~1 second
- Minimal flicker
- Accurate Portuguese transcription
- Fully offline operation

---

## 🚀 Final Result

A **desktop app** that provides:

- 🎤 Live microphone transcription
- 🇧🇷 High-quality Portuguese recognition
- ⚡ Real-time feeling UX
- 🔒 Fully local processing
