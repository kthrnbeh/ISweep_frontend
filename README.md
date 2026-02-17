# ISweep_frontend
🧹 ISweep Frontend

Smart AI-powered media filtering — mute, skip, or fast-forward objectionable content in real time.

This repository contains the production-ready frontend prototype for ISweep — a browser-based UI layer that simulates subscription plans, content filtering controls, parental tools, and user account management.

This project is built as a pure frontend application and serves as the foundation for future backend, device, and AI integrations.

✨ Features

🔒 Parental controls with PIN lock

🎚 Adjustable content filtering (profanity, sexual content, violence, etc.)

⏩ Action controls (mute, skip, fast-forward, log only)

📊 Sensitivity slider

📋 Session demo + filter simulation

💳 Subscription plan selection

🌙 Dark mode toggle

💬 Help center + chat widget

💾 Persistent UI state via LocalStorage

📱 Responsive design (Tailwind-based)

🧱 Tech Stack

HTML5

Tailwind CSS (CDN)

Custom CSS

Vanilla JavaScript (no framework)

LocalStorage for frontend state

Fully static — no build tools required

HOW TO RUN LOCALLY
- Open `docs/index.html` with VS Code Live Server (right-click → Open with Live Server) → http://127.0.0.1:5500/ISweep_frontend/docs/
- Ensure backend is running at http://127.0.0.1:5000 so login/preferences work.
- Use the nav to Settings/Account to sign up/login and adjust preferences; settings persist to backend via GET/PUT /preferences.

YouTube smoke test (with extension)
- Load Chrome extension from ISweep_extention/ and set backend URL to http://127.0.0.1:5000 in Options.
- Log in via extension popup with the same email/password used here.
- Open a YouTube video with captions enabled; watch DevTools console for [ISWEEP][YT]/[ISWEEP][BG] logs and confirm mute/skip/fast_forward actions apply.

📁 Project Structure
ISweep/
│
├── index.html        # Landing page + demo
├── Plans.html        # Subscription selection
├── Account.html      # Profile & plan management
├── Settings.html     # Filtering & parental controls
├── Help.html         # FAQ + demo + chat
├── main.js           # Global frontend logic
├── styles/
│     └── site-plan.css
└── images/
      └── (UI assets)

Core Files

index.html – Hero section and demo filter tester


index

Settings.html – Full filtering control panel


Settings

Plans.html – Subscription UI (Free / Flexible / Full)


Plans

Account.html – Displays selected plan + profile info


Account

Help.html – FAQ + interactive demo + chat widget


Help

main.js – Global UI logic and state management


main

🚀 Getting Started
Run Locally
Option 1 — Recommended

Clone the repository

Open in VS Code

Install Live Server

Open index.html with Live Server

Option 2 — Static Open

Double-click index.html.

No Node.js, npm, or build process required.

🧠 Frontend Architecture
1️⃣ Global State Layer

This app uses LocalStorage as a lightweight state manager.

Key	Purpose
currentPlan	Stores active subscription
isweep-theme	Light/Dark mode preference
isweep-settings	Filter & UI preferences

State persists across page reloads and navigation.

2️⃣ Plan System

Three tiers:

Free Tier

Flexible Subscription

Full Ownership

Plan selection:

Stores structured plan object

Redirects to Account page

Enables filtering in demo mode

Filtering logic is currently in developer mode:

function planHasFiltering(planKey) {
  return true;
}


Production version would restrict Free tier.

3️⃣ Filtering Simulation Engine

The frontend includes a demo subtitle scanner.

When text contains blocked words:

["badword","profanity","swear","curse","hell","damn","crap"]


The UI:

Displays broom icon

Simulates mute behavior

Outputs action result

This is a prototype of the future AI audio/text detection engine.

4️⃣ UI Components

Shared header/nav across all pages

Card-based layout system

Tailwind-based pricing grid

Dark mode via .dark class

Responsive design

5️⃣ Settings Engine

The Settings page allows users to configure:

Filter Categories

Profanity

Sexual Content

Violence

Horror

Crude Humor

Filter Actions

Mute

Skip

Fast-forward

Log only

Sensitivity

3-level slider

Notifications

Email summary

In-app summary

Parental Controls

4–6 digit PIN

Require PIN toggle

All stored locally.

📦 Production Notes

This repository is a frontend prototype, not a deployed filtering engine.

Not Yet Included

Authentication system

Secure PIN storage

Real payment processing

Backend database

AI audio/video analysis

Device-level video control

User accounts

🔐 Security Disclaimer

This version stores all data in LocalStorage.

PIN is not encrypted

No authentication

No server validation

This is intentional for prototype phase.

🛣 Roadmap
Phase 1 (Current)

✔ Frontend prototype
✔ Plan simulation
✔ Filtering UI
✔ Demo engine

Phase 2

Backend integration (FastAPI)

Real preference syncing

Secure PIN handling

User authentication

Phase 3

Whisper-based speech detection

Device-level mute/skip commands

Smart TV integration

Profile switching

Parental dashboards

📄 License

Proprietary — ISweep Inc.
All rights reserved.

🎯 Purpose

This frontend exists to:

Validate UX flow

Simulate real filtering behavior

Prepare for Smart TV deployment

Support investor demos

Provide a base for production conversion
