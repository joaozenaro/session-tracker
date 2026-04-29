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

TODO:

File storage and preview.

Each client will have a button to manage files, each client will have a folder for their own files locally, then a simple one dimensional folder view is shown, files can be renamed and previewed. Supported types are .docx and .pdf. 

The files are stored all locally, so there are no limits to what the user can move around. There should also be an easy button to see the actual windows folder.

So this enables managing client files all inside the app.