# SafePath 🛡️
> **Proactive Personal Safety & Informed Safe Journey Platform**
> *Built for hackathons, mobile-first, and designed to help users make better route choices before reaching potentially uncomfortable or hazardous situations.*

---

## 🌟 Executive Summary

SafePath is a smartphone-first safety web application designed primarily for women who travel alone or through unfamiliar areas. Unlike traditional safety apps that only react after an emergency has already occurred, SafePath is **proactive**:

- **Compares multiple route options** using transparent, explainable safety indicators (street lighting, open late-night businesses, footfall, verified reports).
- **Proactive rerouting prompts**: If an active caution zone or newly reported hazard lies on the user's path, the app notifies the user and offers a safer, well-lit alternative with 1 tap.
- **Ambient & Voice Guard**: Optional hands-free keyword listening (e.g. "SafePath emergency") and ambient noise spike detection.
- **Emergency SOS & Guardian Dashboard**: One-tap SOS with countdown cancellation, automatic emergency broadcast payload generation, and a demo response view.
- **Privacy First**: Ethical, non-stigmatizing route suggestions based on verifiable environmental features (open storefronts, transit hubs, active streetlights) rather than biased demographic heuristics.

---

## 🚀 Key Features

### 1. Informed Safe Journey Planning (`/journey`)
- Multi-criteria route comparison:
  - **Overall Route Score** (0–100 weighted index)
  - **Lighting Score** (verified illuminated street sections)
  - **Open Businesses Score** (accessible safe havens like 24/7 pharmacies, cafes, transit hubs)
  - **Caution Factor** (proximity to reported hazards or user-defined caution zones)
- Transparent breakdown tags: `Well Lit`, `Active Storefronts`, `Busier Route`, `Direct Path`.
- Interactive Leaflet/OpenStreetMap preview showing routes, waypoints, and markers.

### 2. Live Journey HUD (`/live-journey`)
- Turn-by-turn simulation along the selected route.
- Proximity detection for caution zones:
  - Dynamic alert banner triggers when approaching a low-light area or obstacle.
  - "Reroute via High Street" button allows 1-tap detour to the safest alternate path.
- Check-in timer: periodic safe-status confirmation for trusted guardians.

### 3. Caution Zones & Hazard Reporting (`/caution-zones`, `/hazards`)
- **Personal Caution Zones**: User-defined geofenced zones (e.g. "Underpass near North Station") with custom warning radius and trigger times (e.g. after 8:00 PM).
- **Community Hazard Reports**: Real-time reporting of street lighting outages, construction detours, or isolated spots with status verification.

### 4. Voice Guard & Ambient Monitoring (`/voice-guard`)
- Web Speech Recognition API listening for activation keywords ("SafePath Help", "Emergency", "Code Red").
- Real-time AudioContext frequency analyzer measuring decibel levels for sudden loud noise spikes.
- Visual audio visualizer bar and simulated trigger testing for demonstrations.

### 5. Emergency SOS & Response Dashboard (`/sos`, `/response-dashboard`)
- Rapid hold-to-activate or 1-tap SOS trigger.
- 5-second cancel countdown window to prevent false alarms.
- Generates structured emergency event payload:
  - Precise GPS coordinates
  - Reverse-geocoded address
  - Battery level & network connection status
  - Guardian notification status
  - 1-click test SMS link generation
- Live demo Response Dashboard showing guardian arrival status and emergency resolution controls.

### 6. Verified Nearby Help (`/nearby-help`)
- Quick directory of verified emergency stations, 24/7 pharmacies, police departments, and campus security points with direct distance calculations and instant dial action.

---

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) with custom dark neon/surface palette and responsive mobile viewport container
- **Maps**: [Leaflet](https://leafletjs.com/) with OpenStreetMap tiles (fully offline-ready fallback with synthetic map canvas)
- **Audio & Speech**: HTML5 Web Audio API (`AudioContext`, `AnalyserNode`) and Web Speech API (`webkitSpeechRecognition`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context (`AppContext`) with `localStorage` persistence

---

## 📱 Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
```bash
# Clone or navigate to the directory
cd hackathon2

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser (preferably in mobile view or mobile emulation).

### Production Build
```bash
npm run build
npm run preview
```

---

## 🎯 2-Minute Demo Flow (Hackathon Pitch Script)

1. **Home Screen (`/`)**:
   - Point out the active safety status badge, quick actions, and simulated nighttime environmental conditions.
2. **Journey Planner (`/journey`)**:
   - Tap **"Plan Safe Journey"**.
   - Show how Route A (Safest) has a **94 Safety Score** due to 92% lighting and 14 open shops, compared to Route B (Fastest, 61 Safety Score) which cuts through a dark alley.
3. **Live Journey HUD (`/live-journey`)**:
   - Tap **"Start Safe Journey"**.
   - Watch the simulated journey progress.
   - Show the dynamic **Caution Zone Alert** pop up when nearing the dimly lit park lane.
   - Tap **"Reroute via High Street"** to demonstrate proactive avoidance!
4. **Voice Guard (`/voice-guard`)**:
   - Demonstrate the live microphone visualizer and keyword trigger ("SafePath Help").
5. **SOS & Dashboard (`/sos` -> `/response-dashboard`)**:
   - Tap the bottom SOS button.
   - Show the 5-second countdown with audible vibration/cancellation feedback.
   - View the Guardian Response Dashboard displaying live telemetry, dispatch status, and one-click resolution.
