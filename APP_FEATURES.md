# Session Tracker - Feature Overview

A practical guide to the core functionalities of the Session Tracker application.

## 👥 Client Management
- **Centralized Registry**: Keep a detailed list of all clients with their full names and contact information.
- **Visual Identification**: Assign unique colors to clients to easily identify their sessions in the calendar.
- **Client Records**: Quick access to a client's entire history, including past sessions, clinical plans, and medications.

## 📅 Calendar & Scheduling
- **Custom Multi-View Calendar**: Fully custom-built calendar with **Day**, **Week**, and **Month** views.
- **Recurring Sessions**: Create series of sessions (weekly, biweekly, monthly) in one click.
- **Smart Navigation**:
    - Default Week view for immediate focus.
    - Click any day with events to zoom into the Day view.
    - "Clean Bill of Health" badges to quickly see which clients have medications registered.

## 📝 Clinical Documentation
- **Session Notes**: Rich text editor for capturing detailed progress notes during or after sessions.
- **Clinical Plan**: Dedicated section for the client's long-term treatment plan.
- **Medication Tracking**: Keep track of current medications with a visual "success" indicator when no medications are registered (ensuring awareness).

## 📋 Dynamic Forms & Templates
- **Template Builder**: Create custom form templates for assessments, evaluations, or progress tracking.
- **Question Types**:
    - Short & Long Text
    - Numbers
    - Yes/No with conditional "Why Not?" follow-up.
    - **Dropdowns**: Configurable multi-option lists.
    - **Checkbox Groups**: Support for single labels or multi-selection groups.
- **Form Instances**: Fill out templates for specific clients.
- **Progress Tracking**: Real-time progress bars showing completion percentage for each form.

## 🌍 Localization & Performance
- **Full Bi-lingual Support**: Complete interface localization for **English** and **Portuguese**.
- **Local Data Persistence**: Uses a local SQLite database for speed and privacy (no cloud dependency).
- **Auto-Save**: Changes to notes and forms are automatically saved as you type.
- **Optimized UI**: Fast, responsive interface built with React, MUI, and Tauri.
