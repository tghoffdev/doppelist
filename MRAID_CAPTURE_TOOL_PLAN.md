# MRAID Capture Tool - Development Plan

## Project Overview

A platform-agnostic tool for capturing screenshots and video recordings of MRAID/rich media ad units. Solves the pain of asset gathering for portfolios, QA documentation, and client approvals.

**Core value prop:** Paste any MRAID tag or preview URL → render at any size → capture screenshots or video → export clean assets.

---

## Svelte Prototype (Reference Implementation)

**Celtra Recorder** - working prototype with core capture logic:
- Svelte 5 + Vite
- MediaRecorder API for screen capture with `preferCurrentTab`
- FFmpeg WASM for client-side cropping/transcoding
- URL transformation for Celtra-specific preview URLs
- DPR-aware crop calculations
- Y-offset compensation for Chrome's sharing bar
- Custom cursor overlay
- WebM → MP4 conversion
- Single-file component (~400 lines)

**Live at:** https://rich-media-previewer.vercel.app/
**Repo:** https://github.com/tghoffdev/rich-media-previewer

**Use this as reference for:**
- MediaRecorder configuration
- FFmpeg WASM setup and commands
- Crop calculation logic
- URL transformation patterns

**Do not copy verbatim** - rewrite in TypeScript with React patterns (hooks, components).

---

## Phase 1: MRAID Generalization

### Goal
Transform from Celtra-specific tool to platform-agnostic MRAID renderer.

### Tasks

1. **Build MRAID mock environment**
   - Create lightweight MRAID 3.0 compliant container
   - Implement core MRAID methods: `getState()`, `getPlacementType()`, `getScreenSize()`, `getCurrentPosition()`, `getMaxSize()`, `addEventListener()`, `open()`, `close()`, `expand()`, `resize()`
   - Inject `mraid.js` bridge into iframe
   - Handle MRAID ready event lifecycle

2. **Support multiple input types**
   - Raw MRAID tag (HTML/JS paste)
   - Preview URL (with platform detection)
   - Platform-specific transformations:
     - Celtra (existing)
     - Google/DoubleClick
     - Flashtalking
     - Sizmek
     - Generic iframe fallback

3. **Input UI update**
   - Toggle between "Paste MRAID Tag" and "Enter Preview URL"
   - Syntax highlighting or basic validation for tag input
   - Auto-detect input type if possible

### Acceptance Criteria
- Can render a raw MRAID tag pasted into textarea
- Can render preview URLs from at least 3 platforms
- MRAID methods don't throw errors (graceful mock responses)

---

## Phase 2: Batch Size Capture

### Goal
Capture screenshots/recordings at multiple IAB standard sizes in one operation.

### Tasks

1. **Size presets**
   - IAB standard display sizes:
     - 300x250 (Medium Rectangle)
     - 320x50 (Mobile Leaderboard)
     - 728x90 (Leaderboard)
     - 160x600 (Wide Skyscraper)
     - 300x600 (Half Page)
     - 320x480 (Mobile Interstitial)
     - 970x250 (Billboard)
   - Custom size input
   - "Select all" / "Select none" controls

2. **Batch screenshot mode**
   - Loop through selected sizes
   - Render ad at each size
   - Capture screenshot (canvas or html2canvas)
   - Store in memory until batch complete
   - Progress indicator

3. **Batch video mode**
   - Sequential recording at each size
   - Or single size selection for video (batch video is probably overkill)

4. **Export**
   - Zip file with organized folder structure:
     ```
     export/
     ├── 300x250.png
     ├── 320x50.png
     ├── 728x90.png
     └── ...
     ```
   - Use JSZip for client-side zip creation

### Acceptance Criteria
- Can select multiple sizes from preset list
- Screenshots captured at each size
- Downloads as organized zip file

---

## Phase 3: Hybrid Processing (Client + Server)

### Goal
Offer fast server-side FFmpeg processing as alternative to slow browser WASM.

### Tasks

1. **Server endpoint (Next.js API Route)**
   - Create `/api/process/route.ts`
   - POST handler accepts: WebM blob, crop dimensions, output format
   - Run FFmpeg via child_process or fluent-ffmpeg
   - Return processed MP4/WebM as streaming response
   - Handle temp file cleanup

   ```typescript
   // src/app/api/process/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { exec } from 'child_process';
   import { writeFile, readFile, unlink } from 'fs/promises';
   import { v4 as uuid } from 'uuid';

   export async function POST(request: NextRequest) {
     const formData = await request.formData();
     const video = formData.get('video') as File;
     const cropWidth = formData.get('cropWidth') as string;
     const cropHeight = formData.get('cropHeight') as string;
     const format = formData.get('format') as string; // 'mp4' or 'webm'
     
     // Write temp input file
     // Run FFmpeg
     // Return processed file
     // Cleanup temp files
   }
   ```

   **Note:** Vercel serverless has 10s timeout (50s on Pro). For longer videos, may need:
   - Vercel Pro plan, or
   - Self-hosted on Fly.io/Railway/VPS, or
   - Vercel Edge Functions (limited FFmpeg support)

2. **Processing choice modal**
   - On export, show modal:
     - "Process in browser (free, ~60s)"
     - "Process on server (fast, ~5s) - watch a short ad"
   - Client-side path uses existing FFmpeg WASM
   - Server path uploads blob, shows ad, returns processed file

3. **Video ad integration**
   - VAST-compatible video ad player (Google AdSense for Video or similar)
   - Ad completion callback triggers server processing
   - Fallback to client-side if ad fails to load
   - Skip ad if user has adblocker (graceful degradation to client-side)

4. **Rate limiting**
   - Server-side processing limited per IP
   - Maybe 20 server-side exports/day without limit
   - Prevents abuse while keeping tool free

### Hosting considerations for FFmpeg processing
- **Vercel (Hobby):** 10s function timeout - might be tight for longer videos
- **Vercel (Pro):** 60s timeout - should handle most use cases
- **Fly.io / Railway:** Full control, no timeout limits, ~$5-10/mo
- **Self-hosted VPS:** Hetzner/DigitalOcean, FFmpeg native install, most control

### Acceptance Criteria
- Both processing paths work
- Ad displays and completes before server processing
- Server processes video in <10s for typical captures
- Graceful fallback if server unavailable

---

## Phase 4: Polish & Launch

### Goal
Ship a usable, shareable tool.

### Tasks

1. **UI/UX cleanup**
   - Clean, professional interface
   - Clear instructions for first-time users
   - Loading states and progress indicators
   - Error handling with helpful messages
   - Mobile-responsive (even if capture doesn't work on mobile, UI should be usable)

2. **Branding**
   - Pick a name (MRAIDcap? AdCapture? UnitShot? CreativeGrab?)
   - Simple logo
   - Domain

3. **SEO basics**
   - Meta tags
   - Landing page with clear value prop
   - Target keywords:
     - "MRAID preview tool"
     - "rich media ad recorder"
     - "ad unit screenshot tool"
     - "capture Celtra ad"
     - "IAB ad size screenshots"

4. **Documentation**
   - README for GitHub
   - "How to use" section on site
   - Supported platforms list

5. **Launch**
   - Post on relevant communities:
     - LinkedIn (ad tech network)
     - Reddit (r/advertising, r/adops)
     - Ad tech Slack communities
     - Twitter/X
   - Open source the repo (MIT license)

### Acceptance Criteria
- Tool is live on memorable domain
- Works for the happy path without errors
- README explains what it does and how to use it
- At least one launch post published

---

## Technical Decisions

### Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn (optional, for speed)
- **Zip creation:** JSZip
- **Client-side video:** FFmpeg WASM
- **Server-side video:** FFmpeg binary via API routes
- **Hosting:** Vercel (frontend + serverless API routes) or VPS for heavier FFmpeg processing
- **Video Ads:** Google AdSense for Video or VAST-compatible network

### File structure (proposed)
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Main capture interface
│   ├── api/
│   │   └── process/
│   │       └── route.ts            # Server-side FFmpeg endpoint
│   └── globals.css
├── components/
│   ├── url-input.tsx
│   ├── tag-input.tsx
│   ├── size-selector.tsx
│   ├── preview-frame.tsx
│   ├── capture-controls.tsx
│   ├── processing-modal.tsx
│   ├── ad-player.tsx
│   └── export-button.tsx
├── lib/
│   ├── mraid/
│   │   ├── container.ts            # MRAID mock environment
│   │   ├── bridge.ts               # mraid.js injection
│   │   └── platforms.ts            # Platform-specific URL transforms
│   ├── capture/
│   │   ├── screenshot.ts           # Screenshot capture logic
│   │   ├── recorder.ts             # Video recording
│   │   └── batch.ts                # Batch capture orchestration
│   ├── processing/
│   │   ├── client.ts               # FFmpeg WASM processing
│   │   └── server.ts               # Server upload/download client
│   └── export/
│       └── zip.ts                  # Zip file creation
├── hooks/
│   ├── use-recorder.ts
│   ├── use-mraid.ts
│   └── use-processing.ts
└── types/
    └── index.ts                    # Shared types
```

### Migration Notes (from Svelte prototype)
The core logic from the Svelte Celtra Recorder can be ported directly:
- MediaRecorder setup and configuration
- FFmpeg WASM loading and processing
- Crop calculations with DPR awareness
- Y-offset compensation for Chrome sharing bar
- URL transformation patterns

The main work is re-wrapping this logic in React hooks and components.

### Why Next.js over SvelteKit
- Stronger job market signal (React/Next.js more widely used)
- Better ecosystem for future features (auth, database if needed)
- Portfolio piece in more marketable stack
- Case study narrative: "Prototyped in Svelte, rebuilt in Next.js for production"

---

## Out of Scope (for now)

- User accounts / auth
- Cloud storage / persistence
- Project saving / library management
- Team collaboration
- Commenting / approval workflows
- Anything that requires a database

These can all be added later if there's demand. Ship stateless first.

---

## Open Questions

1. **Domain name?** Need to pick something memorable and available.

2. **Ad network?** Which video ad provider to use for the server-side modal?

3. **Rate limits?** What's reasonable for free server-side processing?

4. **Platform priority?** Which preview URL platforms to support first beyond Celtra?

---

## Success Metrics

- Tool is live and functional
- At least 100 captures in first month (validate demand)
- Positive feedback from ad tech community
- Server costs covered by ad revenue (break-even)
- Portfolio piece that demonstrates product thinking + technical chops

---

## Timeline (rough)

| Phase | Effort | Target |
|-------|--------|--------|
| Phase 1: MRAID Generalization | 2-3 weekends | Week 2 |
| Phase 2: Batch Size Capture | 1-2 weekends | Week 4 |
| Phase 3: Hybrid Processing | 2-3 weekends | Week 6 |
| Phase 4: Polish & Launch | 1 weekend | Week 7 |

**MVP in ~7 weeks** if you're doing weekends only. Faster if you have more time.

---

## Next Immediate Steps

1. [ ] Scaffold Next.js 15 project with TypeScript, Tailwind, App Router
2. [ ] Set up basic UI shell (input, preview iframe, controls)
3. [ ] Port MediaRecorder logic into `useRecorder` hook
4. [ ] Port FFmpeg WASM logic into `useProcessing` hook
5. [ ] Get basic capture working (single size, client-side processing)
6. [ ] Spike MRAID mock environment - validate that arbitrary MRAID tags render correctly
7. [ ] Test with tags from 2-3 different platforms
8. [ ] If MRAID works, proceed to Phase 1 full implementation
