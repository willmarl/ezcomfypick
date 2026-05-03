# Handoff: ezcomfypick

## Overview

**ezcomfypick** is a mobile-first web app for reviewing and culling ComfyUI image generation outputs. It runs on a homelab server (FastAPI backend) and is used from a phone browser. The core interaction is a Tinder-style swipe card stack: swipe right to keep an image (moved to a chosen collection folder), swipe left to trash it (moved to `.trash/`). It is designed for speed — one-handed, thumb-reachable, no fuss.

---

## About the Design Files

`ComfyPick.html` is a **high-fidelity interactive prototype** built in plain HTML + React (Babel). It shows the intended look, feel, and interactions of the app. It is **not production code** — do not ship it directly.

Your task is to **recreate this design in a Vite + React (TypeScript) frontend** with a **FastAPI backend**. Use the prototype as the pixel-level source of truth for layout, color, spacing, typography, and interactions.

---

## Fidelity

**High-fidelity.** Recreate pixel-accurately:
- Exact colors (all listed in Design Tokens below)
- Typography sizes, weights, and spacing
- Card swipe physics (rotation, overlay opacity ramp, fly-out animation)
- All interactive states (active pill, disabled undo button, etc.)
- All bottom sheet / modal transitions

---

## Screens / Views

### 1. Main Swipe Screen

The primary screen. Full-viewport, no scroll.

**Layout (flex column, top → bottom):**
```
[Header bar]          ~64px
[Card stack]          flex: 1  (fills remaining height)
[Action buttons]      ~88px
[Bottom pill bar]     ~90px + safe-area-inset-bottom
```

#### Header bar
- `padding: 16px 20px 8px`
- Left: app name `"comfypick"` — `font-size: 17px, font-weight: 700, letter-spacing: -0.02em, color: #f0ede8`
- Left (next to name): image count badge — `font-size: 11px, font-weight: 600, background: #1e1e1e, border: 1px solid #2a2a2a, border-radius: 20px, padding: 2px 8px, color: #6b6b6b`
- Right: two icon buttons (Undo, Settings), each `40×40px, border-radius: 12px, background: #141414, border: 1.5px solid #2a2a2a, color: #a0a0a0`
- Undo button is **disabled** (color: `#2a2a2a`) when history is empty

#### Card stack area
- `padding: 8px 16px 0`, `position: relative`
- Up to 3 cards rendered, stacked with CSS transform:
  - Top card (index 0): `scale(1)`, `translateY(0)`, `z-index: 10`
  - Second card (index 1): `scale(0.95)`, `translateY(18px)`, `z-index: 9`
  - Third card (index 2): `scale(0.90)`, `translateY(34px)`, `z-index: 8`
- `transform-origin: 50% 100%` (rotate from bottom center for natural feel)
- Card shape: `border-radius: 20px`, `overflow: hidden`, `box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4)` (top card only)

**Card contents:**
- Full-bleed image (`object-fit: cover`, `width: 100%, height: 100%`)
- Filename tag pinned to bottom center: `background: rgba(0,0,0,0.55), backdrop-filter: blur(10px), border-radius: 20px, padding: 5px 14px, font-size: 11px, color: rgba(255,255,255,0.55), font-family: monospace`

**KEEP overlay** (shown while dragging right):
- Full-card green wash: `background: oklch(65% 0.18 145 / {opacity * 0.55})`
- Stamp label top-left: `border: 3px solid oklch(65% 0.18 145)`, text `"KEEP"`, `font-size: 26px, font-weight: 700, letter-spacing: 0.12em, color: oklch(65% 0.18 145), transform: rotate(-8deg), border-radius: 10px, padding: 6px 16px`
- Opacity ramps from 0→1 as drag goes 0→100px

**SKIP overlay** (shown while dragging left):
- Full-card red wash: `background: oklch(62% 0.2 25 / {opacity * 0.55})`
- Stamp label top-right: same style but `"SKIP"`, `color: oklch(62% 0.2 25)`, `transform: rotate(8deg)`

#### Action buttons row
- Centered, `gap: 24px`, `padding: 16px 20px 12px`
- Two circular buttons, `60×60px, border-radius: 50%, background: #141414`
- ❌ Delete button: `border: 2px solid oklch(62% 0.2 25 / 0.5)`, icon color `oklch(62% 0.2 25)`, `box-shadow: 0 0 20px oklch(62% 0.2 25 / 0.1)`
- ✓ Keep button: `border: 2px solid oklch(65% 0.18 145 / 0.5)`, icon color `oklch(65% 0.18 145)`, `box-shadow: 0 0 20px oklch(65% 0.18 145 / 0.1)`
- On pointer down: `transform: scale(0.92)`

#### Bottom pill bar
- `padding-bottom: 28px` (+ `env(safe-area-inset-bottom)` in production)
- `background: linear-gradient(to top, #090909 60%, transparent)` — fades into card area
- Label row: `"Save to"` label `font-size: 11px, color: #3a3a3a, text-transform: uppercase, letter-spacing: 0.08em` + `"+ New"` button right-aligned
- Pill scroll row: `display: flex, gap: 8px, overflow-x: auto, padding: 2px 18px, scrollbar-width: none`
- Each pill: `padding: 8px 14px, border-radius: 100px, font-size: 13px, white-space: nowrap`
  - **Inactive:** `border: 1.5px solid #242424, background: #141414, color: #6b6b6b, font-weight: 400`
  - **Active:** `border: 1.5px solid oklch(65% 0.18 145 / 0.6), background: oklch(65% 0.18 145 / 0.12), color: oklch(72% 0.16 145), font-weight: 600`
- Pill contains: emoji icon + label text

---

### 2. Collection Sheet (bottom sheet)

Slides up from bottom when tapping collection picker (if kept as sheet elsewhere in future).

- Backdrop: `background: rgba(0,0,0,0.7), backdrop-filter: blur(4px)`
- Sheet: `background: #141414, border-radius: 20px 20px 0 0, box-shadow: 0 -8px 40px rgba(0,0,0,0.6)`
- Drag handle: `width: 36px, height: 4px, border-radius: 2px, background: #2e2e2e`, centered
- Slide-in animation: `transform: translateY(0)` from `translateY(100%)`, `transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)`
- Each row: `padding: 13px 12px, border-radius: 12px`
  - Icon swatch: `38×38px, border-radius: 10px, background: #1e1e1e, border: 1.5px solid #2a2a2a`
  - Active row icon border: `1.5px solid oklch(65% 0.18 145)`
  - Active row text: `color: #f0ede8, font-weight: 600`

---

### 3. New Collection Modal (bottom sheet)

- Same sheet animation as above
- Fields: Name (text input), Output path (monospace text input, optional)
- Input style: `background: #1e1e1e, border: 1.5px solid #2a2a2a, border-radius: 10px, padding: 12px 14px, color: #f0ede8`
- Create button: disabled state `background: #1e1e1e, color: #3a3a3a`; enabled `background: oklch(65% 0.18 145), color: #0a0a0a, font-weight: 600`

---

### 4. Settings Modal (bottom sheet)

- Path fields for: ComfyUI output path, trash folder path, API base URL
- Toggle rows for: Auto-advance on swipe, Haptic feedback
- Toggle: `44×26px pill, border-radius: 13px`, active `background: oklch(65% 0.18 145)`, inactive `background: #2a2a2a`; thumb `20×20px white circle`
- Save button: same green button style as above

---

### 5. Empty State

Shown when image queue is exhausted.

- Centered in card area
- Large faint checkmark, heading `"All caught up"` `font-size: 20px, font-weight: 600`
- Subtext `font-size: 14px, color: #6b6b6b`
- Reload button: `padding: 10px 24px, background: #1e1e1e, border: 1.5px solid #2a2a2a, border-radius: 24px, color: #a0a0a0`

---

### 6. Toast Notification

- Floats above bottom bar, centered
- `background: rgba(20,20,20,0.92), backdrop-filter: blur(12px), border: 1px solid #2a2a2a, border-radius: 24px, padding: 8px 18px, font-size: 13px, color: #a0a0a0`
- Animates in/out: `opacity + translateY(20px)`, `transition: all 0.2s`
- Auto-dismisses after 1800ms

---

## Interactions & Behavior

### Swipe gesture (top card only)
- Listen for `pointerdown` / `touchstart` on top card
- Track delta X/Y from start point
- Apply `translateX(dx) translateY(dy * 0.3) rotate(dx * 0.08deg)` in real time (no transition)
- On release:
  - `|dx| > 100px` → fly out: animate to `±1.5 * window.innerWidth`, then remove card from queue
  - `|dx| ≤ 100px` → snap back: `transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)`
- `transform-origin: 50% 100%` for natural card-flip feel

### Button swipe
- Tapping ✓/✗ buttons triggers the same swipe action without drag
- Card should animate fly-out in the correct direction

### Undo
- Restores last swiped image to top of queue
- Frontend stores the `undo` object returned by each swipe endpoint
- On undo button tap, POST the stored undo object to `/api/swipe/undo`
- Backend moves file back to original location in output folder
- Button disabled when history is empty
- Current implementation: single-level undo (can be extended to stack multiple)

### Haptic feedback
- `navigator.vibrate([20])` on keep, `navigator.vibrate([10, 30, 10])` on trash
- Controlled by settings toggle

### Toast
- Shows after every swipe: `"Kept → {collection name}"` or `"Moved to trash"`
- Shows `"Undone ↩"` on undo

---

## Implementation Notes (Backend Complete ✓)

**What changed from the design doc:**
- **No image IDs** — Images are identified by their relative filesystem path (e.g. `"20260503/image1.png"`)
- **No database** — Frontend holds the queue; backend just moves files
- **Simpler collections** — Collections are just folder names, not objects with metadata or IDs
- **No pagination** — `GET /api/images` returns all pending images at once (simpler for homelab use)
- **No DELETE collection endpoint** — Collections aren't deleted via API
- **No metadata** — No width/height/size/created_at in image responses (can add later if needed)
- **Single undo** — Current implementation stores one undo descriptor; can be extended to stack multiples

**What stays the same:**
- All visual design (colors, typography, layouts, animations)
- All interaction patterns (swipe, tap, tap-button-as-swipe)
- Settings UI and bottom sheets
- Haptic feedback hooks
- Toast notifications

---

## Component Tree (suggested)

```
src/
├── App.tsx
├── hooks/
│   ├── useSwipe.ts          # drag logic, returns { drag, onPointerDown, flyOut }
│   ├── useImageQueue.ts     # fetches images once at startup, maintains queue locally
│   └── useCollections.ts    # fetches collections, handles create new
├── api/
│   └── client.ts            # typed fetch wrappers:
│       ├── getImages()         // GET /api/images → { images: string[] }
│       ├── getImageUrl(path)   // returns URL to GET /api/image-file/{path}
│       ├── swipeKeep(path, collection)      // POST /api/swipe/keep
│       ├── swipeTrash(path)    // POST /api/swipe/trash
│       ├── swipeUndo(undo)     // POST /api/swipe/undo
│       ├── getCollections()    // GET /api/collections → { collections: string[] }
│       └── createCollection(name)  // POST /api/collections
├── components/
│   ├── SwipeCard.tsx         # single card with drag + overlays
│   ├── CardStack.tsx         # renders top 3 cards stacked
│   ├── ActionButtons.tsx     # ✓/✗ circular buttons
│   ├── PillBar.tsx           # scrollable collection pill selector
│   ├── Header.tsx            # app name + undo + settings buttons
│   ├── EmptyState.tsx
│   ├── Toast.tsx
│   └── sheets/
│       ├── BottomSheet.tsx   # reusable animated sheet wrapper
│       ├── NewCollectionSheet.tsx
│       └── SettingsSheet.tsx
└── types.ts                  # Image, Collection, UndoDescriptor interfaces
```

---

## API Contract (FastAPI backend)

### Types
```typescript
interface Image {
  path: string;  // relative path from output folder, e.g. "20260503/image1.png"
}

interface Collection {
  name: string;  // folder name, e.g. "Cartoony"
}

interface SwipeResponse {
  ok: boolean;
  error?: string;
  undo?: {
    image_path: string;
    action: "keep" | "trash";
    collection?: string;  // only present if action === "keep"
  }
}

interface UndoRequest {
  image_path: string;
  action: "keep" | "trash";
  collection?: string;  // only present if action === "keep"
}
```

### Endpoints (all prefixed with `/api`)

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| `GET` | `/images` | List all pending images from output folder (recursive, all subdirs) | `{ images: string[] }` |
| `GET` | `/image-file/{path:path}` | Serve raw image file. Path can include slashes, e.g. `20260503/image1.png` | binary image data |
| `POST` | `/swipe/keep` | Move image to a collection. Body: `{ image_path: string, collection: string }` | `SwipeResponse` |
| `POST` | `/swipe/trash` | Move image to trash. Body: `{ image_path: string }` | `SwipeResponse` |
| `POST` | `/swipe/undo` | Reverse the last swipe. Body: the `undo` object from previous swipe response | `{ ok: boolean }` |
| `GET` | `/collections` | List all collection folders | `{ collections: string[] }` |
| `POST` | `/collections` | Create a new collection folder. Body: `{ name: string }` | `{ ok: boolean }` |

### Backend architecture (✓ already implemented)
- **Stateless backend** — No session/queue tracking. Frontend fetches images once, maintains its own queue, removes items as they're processed.
- **No database** — Pure filesystem operations. Collections are just folders under `$IMAGE_DIR/good-output/`, trash is `$IMAGE_DIR/trash-output/`, output is `$IMAGE_DIR/output/`
- **Image paths** — Relative to output folder, preserving subdirectories. E.g. `"20260503/image1.png"` stays as one path even though the file lives at `$OUTPUT_DIR/20260503/image1.png`
- **Undo** — Each swipe response includes an undo descriptor. Frontend stores it and replays it on undo request. Only single-level undo supported (frontend can be extended to stack these for multi-undo)
- **File collision handling** — If destination exists, appends `_1`, `_2`, etc.
- **Image filtering** — Only `.jpg .jpeg .png .webp .gif` extensions recognized
- **Config** — Via `IMAGE_DIR` env var (defaults to `/home/cat/Pictures/test/`). All other paths derived from this.

---

## Design Tokens

```
Background:       #090909
Surface 1:        #141414
Surface 2:        #1e1e1e
Border:           #2a2a2a
Border dim:       #242424
Text primary:     #f0ede8
Text muted:       #6b6b6b
Text dim:         #3a3a3a

Green (keep):     oklch(65% 0.18 145)    ≈ #3dba6e
Green light:      oklch(72% 0.16 145)    ≈ #5dce87  (pill active text)
Green bg:         oklch(65% 0.18 145 / 0.12)
Red (trash):      oklch(62% 0.2 25)      ≈ #e0503a

Font:             DM Sans (Google Fonts)
  Weights used:   400, 500, 600, 700
```

---

## Assets

- **Font:** DM Sans from Google Fonts — `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700`
- **Icons:** All hand-crafted inline SVGs (no icon library). See `ComfyPick.html` source for SVG paths.
- **Images:** Placeholder only in prototype. In production, served from `GET /images/{id}/file`.

---

## Files in this package

| File | Description |
|------|-------------|
| `ComfyPick.html` | Full interactive hi-fi prototype. Open in a browser to interact with it. |
| `README.md` | This document. |
