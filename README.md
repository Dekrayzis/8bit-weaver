# 🧵 Eight-Bit Weaver

A browser-based text adventure editor and player — create, publish, and play classic interactive fiction right from your browser.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### 🗺️ Visual Map Editor
- **Grid-based room layout** — place rooms on a configurable grid (up to 100×100) and connect them automatically via cardinal directions
- **Room inspector** — set descriptions, toggle start/end rooms, mark rooms as dark, locked, or dangerous
- **Up/Down exits** — link rooms vertically for multi-level dungeons beyond the 2D grid

### 📦 Item & Hazard System
- **Item editor** — create portable or fixed items with aliases, examine text, use effects, and flag-based triggers
- **Flag-driven logic** — items can set flags when used, unlocking doors or neutralising room dangers
- **Hazards** — stationary, random, patrol, or chase-type hazards with configurable kill-on-contact and warning text
- **Danger respawns** — repelled hazards can return after a configurable number of turns (plus random jitter)

### 🎮 Playtest Terminal
- **Built-in text parser** — supports movement (`n/s/e/w/u/d`), `look`, `inventory`, `take`, `drop`, `examine`, and `use` commands
- **Timed hazard attacks** — dangers give the player a short grace period before striking, adding real-time tension
- **Health system** — configurable player HP with multi-hit survival or instant death
- **Fog of war** — wandering off the map triggers a fatal fog message (customisable)

### 🖼️ AI Room Illustrations
- **OpenAI DALL·E integration** — auto-generate room artwork via DALL·E 2 or DALL·E 3
- **Art style presets** — choose from Pixel Art, Painterly, Cartoon, or Realistic styles
- **Batch generation** — generate images for all rooms at once, with progress tracking and skip-existing support
- **Retro CRT display** — room images render with a scanline overlay for an authentic retro feel

### 📖 Story Library
- **Publish & browse** — publish finished adventures to a local IndexedDB library and browse them with cover art, metadata, and stats
- **Inline player** — play any published story directly from the library with a full typewriter-style terminal
- **Import/export** — save and load projects as portable JSON files

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (included with Node.js)

### Installation

```bash
git clone https://github.com/Dekrayzis/8bit-weaver.git
cd 8bit-weaver
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🎯 How to Use

1. **Open the Story Editor** from the library landing page
2. **Place rooms** on the grid map — click any cell and fill in the room name and description
3. **Mark a start room** and an **end room** to define the win condition
4. **Add items** in the Items tab — set aliases, use-text, and effect flags
5. **Configure hazards** for dangerous rooms that attack the player on a timer
6. **Playtest** your adventure using the built-in terminal
7. **Publish** to the local library, or **export** as a `.json` file to share

### Supported Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `north`, `south`, `east`, `west` | `n`, `s`, `e`, `w` | Move in a cardinal direction |
| `up`, `down` | `u`, `d` | Move vertically between linked rooms |
| `go <direction>` | — | Alternative movement syntax |
| `look` | `l` | Re-describe the current room |
| `inventory` | `i`, `inv` | List carried items |
| `take <item>` | `get` | Pick up a portable item |
| `drop <item>` | — | Drop an item from your inventory |
| `examine <item>` | `x` | Inspect an item closely |
| `use <item>` | — | Use an item (may set flags) |

---

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Editor/          # Map editor, room inspector, item editor, publish modal
│   ├── Library/         # Story library browser and inline story player
│   └── Playtest/        # Game engine and terminal view
├── context/
│   └── ProjectContext   # Global project state (React Context + localStorage)
├── services/
│   ├── imageService     # OpenAI DALL·E integration for room art generation
│   └── storyLibrary     # IndexedDB CRUD for published stories
├── types.ts             # Core type definitions (Room, Item, Hazard, GameState, etc.)
├── App.tsx              # Root shell — library / editor / player mode switching
└── index.css            # Full application styling
```

---

## 🛠️ Tech Stack

- **React 19** — UI framework
- **TypeScript 6** — type safety
- **Vite 8** — dev server & bundler
- **Lucide React** — iconography
- **IndexedDB** — client-side story persistence
- **OpenAI API** — optional AI image generation (BYOK)
- **localStorage** — editor auto-save

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add my feature"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 Licence

This project is licensed under the [MIT License](LICENSE).
