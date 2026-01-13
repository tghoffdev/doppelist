# Doppelist

> Validate, personalize, and ship ad tags without rebuilding creatives.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## Overview

Doppelist is a tag operations platform for QA-ing ad creatives, injecting macro-driven personalization, and exporting DSP-ready variants with proof packs. Load MRAID tags or HTML5 zip bundles, preview at any size, inspect macros and events, edit DCO text live, and export screenshots or video recordings—all client-side.

## Features

### Tag Ingestion & Preview
- **MRAID 3.0** mock environment with full event simulation
- **HTML5 zip upload** via service worker (no server required)
- **Vendor detection**: Celtra, Google DCM, Flashtalking, Sizmek, Adform, Innovid
- **IAB standard sizes** + custom dimensions
- Live background and border color controls

### Compliance Checking
Multi-DSP validation engine supporting:
- **DV360/CM360**: `${CLICK_URL}` macro detection
- **The Trade Desk**: `%%TTD_CLK%%` macro detection
- **Xandr, Amazon DSP, Sizmek**: Standard macro formats
- File size limits (200KB), load time checks, HTTPS enforcement
- **One-click macro fix**: Insert DSP-appropriate click macros

### Macro Detection & Personalization
- Detects: `${...}`, `%%...%%`, `[...]`, `[[...]]`, `__...__` formats
- **Live DCO text editing** with real-time preview
- Text changes persist across reloads
- Modified tags exported with personalization applied

### Capture & Recording
- **Screenshot capture** with precise ad-only cropping
- **Video recording** with WebM/MP4 output (FFmpeg WASM)
- **Batch capture** across multiple IAB sizes
- Clip mode for ad-only recording

### Proof Pack Export
One-click QA documentation:
```
proof-pack-{WxH}-{timestamp}.zip
├── qa-report.txt           # Human-readable summary
├── screenshot.png          # Ad render capture
├── recording.webm          # 3-second video capture
├── compliance.json         # Full check results
├── events.json             # MRAID/network event log
├── macros.json             # Detected macros
├── personalization.json    # Text changes + tag mods
├── tag-original.html       # Original tag source
├── tag-modified.html       # Fixed/personalized tag
└── metadata.json           # Timestamp, DSP, dimensions
```

### Event Logging
Real-time capture with deduplication:
- MRAID lifecycle (ready, stateChange, viewableChange)
- Click tracking, expand/close events
- Network requests (tracking pixels, beacons, fetch, XHR)
- Custom postMessage events

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI + shadcn/ui |
| Video Processing | FFmpeg WASM |
| Icons | Lucide React |

## Browser Support

- Chrome/Edge 90+ (recommended)
- Firefox 90+
- Safari 15+

Region capture (clip mode) requires Chromium-based browsers with `getDisplayMedia` crop target support.

## Known Limitations

| Limitation | Notes |
|------------|-------|
| 3P Tag Rendering | DCM, Flashtalking, Sizmek tags are detected but cannot render client-side due to CORS. HTML5 bundles work fully. |
| Cross-origin DOM | Cannot scan or personalize Celtra/3P ad DOM content |
| VAST/VPAID | Not yet supported |

## License

MIT

---

Built by [Tommy Hoffman](https://tommyhoffman.io) · [@tghoffdev](https://x.com/tghoffdev)
