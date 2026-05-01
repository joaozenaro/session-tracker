# 🧾 Session Tracker

## Overview

A desktop-only appointment management app for psychotherapy sessions.

**Stack:**

* Frontend: React + Material UI
* Backend: Rust (Tauri)
* Database: SQLite (local only)

**Features:**

- [x] Fully offline
- [x] Focus on session tracking + notes
- [ ] Integrated transcription and AI text cleanup

## Setup

1. **Install dependencies:**

```bash
pnpm install
```

2. **Download the Whisper model:**
The model is ignored by Git due to its size. You must download it manually to the `src-tauri/resources` directory:
```bash
mkdir -p src-tauri/resources
curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin -o src-tauri/resources/ggml-small.bin
```

3. **Run the app in development mode:**

```bash
pnpm tauri dev
```