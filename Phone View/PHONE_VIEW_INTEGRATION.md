# 📱 Refra Mobile Phone View — Integration & Architecture Blueprint

> **Status:** ✅ **Verified & Tested**  
> **Target Audience:** Future AI Agents & Developers integrating this Phone UI into the Main Movie Platform  
> **Source Design:** Refra 4K Cinematic Streaming & Anime (Mobile Experience)

---

## 🎯 1. Overview & Project Objective

This directory contains the mobile-first, phone-optimized UI/UX extracted and tested from **Refra** (a modern, minimalist 4K ad-free streaming & anime platform). 

### 💡 Core Objective for the Main Website
When users visit the main movie website on a **mobile device / phone viewport (`< 768px`)**, this exact UI layout should be served. The desktop view remains standard/full-width, while the phone view activates this liquid-glassmorphic, touch-friendly mobile streaming interface.

---

## 🧪 2. Verification & Testing Log

| Parameter | Result | Notes |
| :--- | :--- | :--- |
| **Local Runtime Test** | ✅ PASSED | Tested on local server (`localhost:5500`) |
| **Mobile Viewport Compatibility** | ✅ PASSED | Tested at `390px × 844px` (iPhone/Android standard) |
| **Console & Asset Errors** | ✅ 0 ERRORS | All styles, optical filters, and posters render flawlessly |
| **Horizontal Touch Rails** | ✅ PASSED | Smooth horizontal scrolling with CSS snap points (`snap-x`) |
| **Glassmorphic Backdrops** | ✅ PASSED | Real-time optical blur & displacement filter active |
| **Safe Area Insets** | ✅ PASSED | `safe-top` and `safe-bottom` support for notched phones |

---

## 📂 3. Directory & File Reference Map

```text
c:\HTML\DT\Phone View\
├── refra-4k-ad-free-cinematic-streaming-anime.full-page.Woblo/
│   └── refra-4k-ad-free-cinematic-streaming-anime/
│       ├── index.html       # Complete working standalone HTML with embedded SVGs & structures
│       └── styles.css       # Complete compiled CSS with Google Fonts & glassmorphism utilities
├── refra-4k-ad-free-cinematic-streaming-anime.design-system.Woblo.css  # Root CSS variables
├── refra-4k-ad-free-cinematic-streaming-anime.dtcg.Woblo.tokens.json   # Standard DTCG token specs
├── refra-4k-ad-free-cinematic-streaming-anime.tailwind-v4.Woblo.css   # Tailwind CSS v4 preset
├── refra-4k-ad-free-cinematic-streaming-anime.shadcn.Woblo.css        # Shadcn/UI variable mapping
└── PHONE_VIEW_INTEGRATION.md                                           # This integration document
```

---

## 🎨 4. Design System & Tokens Breakdown

### A. Color Palette (Dark-Mode OLED)
* **Background Canvas:** `#060606` and `#0c0d10`
* **Card & Rails Background:** `#14161d` / `#13151b`
* **Glass Surface Fill:** `rgba(30, 39, 46, 0.58)`
* **Glass Border:** `rgba(255, 255, 255, 0.12)`
* **Primary High-Contrast Accent:** `#F5F6FA` (Text, Primary CTAs)
* **Secondary Accent Colors:** `#0984E3` (Ocean Blue) & `#00CEC9` (Cyan)
* **Rating & Stars:** `#FFFFFF` on translucent black pill

### B. Typography
* **Cinematic Headings:** `Unbounded`, `Syne` (`font-panchange`)
* **Metadata & UI Body:** `Plus Jakarta Sans`, `Inter`, `-apple-system`, `sans-serif`

### C. Glassmorphic Optical Distortion Filter
Included in the `<head>`/`<body>` root for realistic liquid glass diffusion:
```html
<svg aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden;">
  <defs>
    <filter id="liquid-glass" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="2" result="noise" seed="42"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="16" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
</svg>
```

---

## 🧩 5. Component Breakdown & Structure

### 1. **Floating Top Header (`safe-top`)**
* Located fixed top-right with `z-40`.
* Contains a floating glass pill with:
  * **Cast to Screen** icon (`lucide-cast`)
  * **Notifications Bell** with unread indicator (`lucide-bell`)

### 2. **Spotlight Hero Banner (`aspect-[3.5/5]`)**
* High-impact vertical movie poster with dual bottom-to-top gradient overlays (`from-[#0c0d10] via-[#0c0d10]/75 to-transparent`).
* **Metadata Badges**: Year (`2026`), Duration (`1h 43m`), Rating (`★ 7.6`), Genre Pills.
* **Main Actions**:
  * `[ ▶ Play ]` — Primary high-contrast button (`bg-white text-black font-semibold min-h-[44px]`).
  * `[ + ]` — Watchlist button (glass pill).
  * `[ ℹ ]` — Movie details modal trigger (glass pill).
* **Slide Pagination**: 5-indicator dot rail with expanding active pill (`w-5 bg-white`).

### 3. **Horizontal Content Rails (`snap-x scroll-smooth-touch`)**
* Snap-scrolling rails displaying 2:3 vertical movie cards (`w-36 sm:w-44 aspect-[2/3]`).
* Each card includes:
  * Lazy-loaded poster image with hover/touch zoom (`group-hover:scale-105`).
  * Top-right quick-add to watchlist `+` button.
  * Bottom gradient overlay with title, star rating, and release year.
* **Standard Category Rails:**
  1. *Trending Masterworks*
  2. *Trending Anime*
  3. *Top Rated Cinema*
  4. *Sci-Fi & Speculative Fiction*
  5. *Action & Adrenaline*
  6. *Psychological Thrillers*

### 4. **Bottom Floating Navigation Dock (`safe-bottom`)**
* Fixed bottom navigation dock (`fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40`).
* Liquid glass styling (`backdrop-blur-xl bg-[rgba(30,39,46,0.58)] border border-white/10 rounded-full`).
* **5 Key Tabs:**
  1. **Home** (`lucide-house`) — Default active tab with glowing pill indicator.
  2. **Discover** (`lucide-compass`) — Browse genres, trending lists, and curated mixes.
  3. **Search** (`lucide-search`) — Live movie search and filter drawer.
  4. **Saved** (`lucide-bookmark`) — User watchlist and download queue.
  5. **Cinema** (`lucide-clapperboard`) — Direct quick playback / player view.

---

## 🤖 6. Instructions for Future AI to Merge into Main Website

When you ask an AI or developer to merge this phone view into your main movie website, provide the following prompt and rules:

```markdown
### MERGE INSTRUCTIONS FOR AI:

1. **Detection & Routing:**
   - Detect screen width `< 768px` or user-agent `Mobile`.
   - On mobile viewports, render the Phone View UI components instead of the desktop layout.

2. **Connect Live Movie Data API:**
   - Replace static movie data with live API endpoints (e.g., TMDB API or your custom backend).
   - Map movie properties to the UI:
     * `poster_path` -> `<img src="...">` (w500 for cards, w780/original for Hero)
     * `title` -> `<h2>` / `<h4>`
     * `vote_average` -> `★ {rating.toFixed(1)}`
     * `release_date` -> Year `{date.slice(0, 4)}`
     * `genre_ids` -> Formatted genre string (e.g. `Action • Sci-Fi`)

3. **Bottom Navigation Interactivity:**
   - Implement active tab state for:
     - `Home` -> Shows Hero + Category Rails.
     - `Discover` -> Shows categorized grid / genre tags.
     - `Search` -> Opens search input modal with instant query results.
     - `Saved` -> Lists stored watchlist items (localStorage or User Auth DB).
     - `Cinema` -> Opens full-screen video player or trailer.

4. **Watchlist State:**
   - Connect the `+` buttons on cards and hero banner to `localStorage` or user profile API. Toggle to checkmark icon when item is saved.

5. **Video Playback Integration:**
   - When user taps `Play` or a movie poster, open your streaming video player / stream iframe / HLS video modal.
```

---

## 🚀 7. Quick Start / Preview Command

To test or preview this phone view locally at any time, run:

```powershell
# Inside "c:\HTML\DT\Phone View"
python -m http.server 5500
```
Then navigate to:
`http://localhost:5500/refra-4k-ad-free-cinematic-streaming-anime.full-page.Woblo/refra-4k-ad-free-cinematic-streaming-anime/index.html` (Mobile Device Toolbar enabled in DevTools).

---
*Created and verified for the Movie Platform Phone View Integration.*
