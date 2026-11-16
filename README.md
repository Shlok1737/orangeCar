# 🐱 Desktop Cat (Windows Electron Pet)

A charming, interactive 2D pixel-art orange tabby cat that lives and walks on your Windows desktop above the taskbar!

---

## 🌟 Core Features Implemented

1. **Transparent & Click-Through Window**:
   - Frameless, transparent, always-on-top overlay.
   - **Full click-through**: clicks pass right through empty space so your desktop, web browsers, code editors, and games work normally.
   - Only the cat itself captures mouse clicks and drags!

2. **Natural Physics & Movement**:
   - The cat walks along the bottom of the screen, parked comfortably right above the Windows taskbar.
   - **Drag & Drop**: Click and hold the cat to pick it up anywhere on your screen. Release it, and it will fall down with gravity and land on the floor with a slight bounce!
   - Boundary detection: flips direction when reaching screen edges.

3. **Procedural Pixel-Art Sprite Engine**:
   - Crisp 32x32 retro pixel art generated directly in code:
     - 🐾 `idle`: Gentle breathing, blinking, tail flicking.
     - 🐾 `walk`: 4-legged quadruped trot cycle with tail bobbing.
     - 🐾 `sit`: Cute upright loafing with ear twitches and slow blinks.
     - 🐾 `sleep`: Curled loaf with rhythmic breathing and floating `Zzz`.
     - 🐾 `purr`: Blushing cheeks, happy squint eyes, vibrating purr, floating hearts (`♥`).
     - 🐾 `smack`: Rears up on hind legs and swats paw with claw slash streaks.
     - 🐾 `dance`: Upright swaying, alternating paws, and musical notes.
     - 🐾 `sulk`: Turned away with back coat stripes, drooping ears, and gloomy mood marks.
     - 🐾 `zoomies`: Low-flying rocket sprint with airplane ears and dust trails.
     - 🐾 `dragged` & `falling`: Dangling paws and parachute flail.
     - 🐾 `dizzy`: Swirly spiral eyes (`@ @`) and orbiting gold stars.

4. **State Machine & `config.json` Tuning**:
   - All behavior speeds, durations, gravity, and transition probabilities are exposed in `config.json`.
   - **Auto-Reloading**: Edit `config.json` and save—the cat instantly updates without needing a restart!

5. **System Tray Integration**:
   - Desktop Cat tray icon in Windows notification area:
     - **Pause / Resume Cat**
     - **OIIA Dance Reaction Toggle** (with persistent state)
     - **Open Config (config.json)**
     - **Quit**
   - Global Hotkey: `Ctrl + Alt + O` (or `Cmd + Alt + O`) to toggle OIIA dance anytime.

---

## 🚀 How to Run

### Development Mode:
```bash
npm start
```

---

## 📦 How to Package as an `.exe`

To compile and package the cat into a standalone Windows installer or executable:

1. Install `electron-builder`:
```bash
npm install --save-dev electron-builder
```

2. Add a `build` section to `package.json` (already preconfigured):
```json
"build": {
  "appId": "com.desktop.cat",
  "productName": "DesktopCat",
  "win": {
    "target": "nsis",
    "icon": "assets/tray-icon.png"
  }
}
```

3. Run the packager:
```bash
npm run dist
```
The output `.exe` will be generated in the `dist/` directory.

---

## 🎨 How to Replace the Sprites (Custom Sprite Pack)

The app is built to allow dropping in any custom sprite pack or PNG sheet:

1. Place your PNG sprite sheets inside `assets/sprites/`.
2. Open `config.json` and change:
```json
"sprites": {
  "source": "custom",
  "pixelSize": 32,
  "frameRate": 8,
  "custom": {
    "spriteSheetPath": "assets/sprites/my_cat.png",
    "frameWidth": 32,
    "frameHeight": 32
  }
}
```
3. Save `config.json` and the cat will auto-load your new sprites!

---

## ⚙️ Config Options (`config.json`)

| Setting | Default | Description |
|---|---|---|
| `display.scale` | `3` | Pixel scale multiplier (3x = 96x96 px) |
| `display.floorOffset` | `4` | Pixel offset above Windows taskbar |
| `display.debug` | `false` | Set `true` to show live state and physics telemetry |
| `physics.gravity` | `0.65` | Gravitational pull when dropped in air |
| `physics.bounce` | `0.15` | Floor bounce elasticity |
| `movement.walkSpeed` | `1.4` | Normal walking speed |
| `movement.zoomiesSpeed` | `5.2` | Sprint speed during zoomies |
| `behaviors.click.rapidClickThreshold` | `5` | Clicks in window needed to trigger swat |
| `behaviors.click.rapidClickWindowMs` | `2000` | Rapid-click time window in milliseconds |
| `behaviors.sleep.inactivityMinutes` | `10` | Inactivity before falling asleep |
| `behaviors.sulk.hoursWithoutInteraction` | `4` | Hours of neglect before sulking |
