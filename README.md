<<<<<<< HEAD
<<<<<<< HEAD
﻿# Tabletop Battle Planner

Mobile-first PWA for planning tabletop battles on a 2D board. This is a tactical planning and tracking tool only — no rules engine, no LOS, no combat logic.

## Setup

```bash
npm install
npm run dev
```

## Features

- 2D board with zoom/pan and optional grid
- Units with draggable planned moves and movement previews
- Multiple measurements with snap-to-unit edge support
- Range overlays per unit
- Terrain (rect/circle) with simple inspector controls
- Unit inspector with per-model wound tracking
- Dice roller with per-section rolls
- Game tracker (VP/CP, round, phase, active player)
- Background image support
- Scene save/load via IndexedDB

## Notes / Limitations

- Background image URLs are stored as object URLs; after a full reload the saved scene image may not restore unless reselected.
- No rule enforcement or validation; all interactions are manual.
- No backend or multiplayer.

## License

Private project.
=======
# tabletop-battle-planner
>>>>>>> e6939825315341552c2eaa121307522ef8fbbe64
=======
# Tabletop Battle Planner

A mobile-first PWA for planning and simulating tabletop battles on a 2D board.

## Features

- 2D board with real-world dimensions
- Draggable unit icons
- Measurement tools
- Range visualization
- Abstract terrain elements
- Per-model wound tracking
- Fullscreen dice roller
- Game tracker
- Local scene save/load

## Tech Stack

- React
- TypeScript
- Vite
- Konva
- Zustand
- IndexedDB
- PWA
>>>>>>> bcb45064ffbc869621d7ccded3e80a64fe605e46
