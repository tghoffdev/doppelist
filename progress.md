# Einmir Suite - Development Progress

## Overview
MRAID capture toolkit for rich media advertising. Allows loading MRAID ad tags or HTML5 zip files, previewing them with a mock MRAID 3.0 environment, and capturing screenshots/recordings.

## Completed Features

### Core Preview System
- **MRAID Mock Environment** (`src/hooks/use-mraid.ts`, `src/lib/mraid/`)
  - Full MRAID 3.0 implementation with events (ready, viewableChange, stateChange)
  - Supports inline and interstitial placement types
  - Touch event simulation for mobile ads

- **Celtra Integration** (`src/lib/vendors/celtra.ts`, `src/components/celtra-frame.tsx`)
  - Auto-detection of Celtra v3 and v4 tags
  - Preview URL extraction from ad tags
  - Direct iframe rendering for Celtra content

- **Preview Frame** (`src/components/preview-frame.tsx`)
  - Responsive ad preview with configurable dimensions
  - Background color picker
  - Overflow detection with "Resize to fit" option
  - Loading and error states
  - Countdown overlay for reload-and-record

### HTML5 Zip Upload (Latest)
- **Service Worker** (`public/html5-sw.js`)
  - Serves extracted zip files from memory
  - Injects MRAID bridge into HTML responses
  - Version 2 with direct message response

- **Zip Loader** (`src/lib/html5/zip-loader.ts`)
  - Extracts HTML5 zip files using JSZip
  - Auto-detects entry point (index.html, ad.html, etc.)
  - Normalizes paths, handles nested directories
  - MIME type mapping for all common ad assets

- **SW Manager** (`src/lib/html5/sw-manager.ts`)
  - Registers and manages service worker lifecycle
  - Handles file loading and config updates
  - Debug logging for troubleshooting

- **Upload UI** (`src/components/zip-upload.tsx`)
  - Drag-and-drop or click to upload
  - Validation and error handling
  - Loading states during extraction

### Capture System
- **Screenshot** (`src/lib/capture/screenshot.ts`)
  - Canvas-based capture from screen share
  - Crops to exact ad dimensions

- **Recording** (`src/lib/capture/recorder.ts`, `src/hooks/use-recorder.ts`)
  - MediaRecorder with WebM output
  - Two modes: "clip" (cropped to ad) and "full" (entire screen)
  - Dynamic dimension tracking via getter functions
  - Prepared recording flow for reload-and-record

- **Batch Capture** (`src/lib/capture/batch.ts`, `src/lib/capture/zip.ts`)
  - Capture multiple sizes in sequence
  - Export as zip archive

### MP4 Conversion (Latest)
- **FFmpeg WASM** (`src/lib/processing/client.ts`)
  - Client-side WebM to MP4 conversion
  - H.264 codec with AAC audio
  - Scale filter for odd dimension handling
  - Progress tracking during conversion

- **Processing Hook** (`src/hooks/use-processing.ts`)
  - Manages FFmpeg loading and conversion state
  - Progress and status reporting

- **UI Controls** (`src/components/capture-controls.tsx`)
  - Output format toggle (WebM/MP4)
  - Conversion progress indicator

### UI Components
- **Tag Input** (`src/components/tag-input.tsx`)
  - Tabs for "Paste Tag" and "Upload HTML5"
  - Test tags for development
  - Random tag button

- **Size Selector** (`src/components/size-selector.tsx`)
  - Preset sizes (interstitial, banner)
  - Custom dimension input
  - Batch size selection

- **Background Color Picker** (`src/components/background-color-picker.tsx`)
  - Preset colors and custom hex input

## Key Technical Decisions

1. **Service Worker for HTML5**: Chose SW over blob URLs or data URLs because it allows relative paths to work naturally and enables MRAID injection.

2. **FFmpeg WASM for MP4**: Client-side conversion despite being slow, avoiding server costs and privacy concerns.

3. **Dynamic CropConfig**: Using getter functions `() => dimensionsRef.current.width` instead of static values to handle dimension changes during recording.

4. **Screen Capture API**: Using `getDisplayMedia` with cropping via canvas for precise ad capture.

## File Structure
```
src/
  app/
    page.tsx              # Main application
    api/process/route.ts  # Server-side processing (optional)
  components/
    preview-frame.tsx     # Ad preview container
    celtra-frame.tsx      # Celtra-specific rendering
    tag-input.tsx         # Input tabs (tag/html5)
    zip-upload.tsx        # HTML5 zip upload
    capture-controls.tsx  # Recording/screenshot buttons
    size-selector.tsx     # Dimension controls
    background-color-picker.tsx
    ui/                   # shadcn/ui components
  hooks/
    use-mraid.ts          # MRAID mock hook
    use-recorder.ts       # Recording hook
    use-processing.ts     # FFmpeg processing hook
  lib/
    mraid/                # MRAID implementation
    html5/                # HTML5 zip/SW utilities
    capture/              # Screenshot/recording
    processing/           # FFmpeg conversion
    vendors/              # Celtra detection
    export/               # Zip export
public/
  mraid.js                # MRAID script for iframe
  html5-sw.js             # Service worker

## Known Issues / TODOs
- Service worker caching can cause stale versions (need manual unregister)
- MP4 conversion is slow on large files (~10-30 seconds for short clips)

## Git History
- `71bb837` - feat: add HTML5 zip upload and MP4 conversion support
- `a12614f` - feat: initial Einmir Suite implementation
- `ee5a171` - Initial commit from Create Next App
