# 🎨 The Great Crystal Fish Defense — Asset Specification

> **For Designers:** This document lists every visual asset needed for the game.
> All assets should use the **claymation / stop-motion** aesthetic described in the game design doc — chunky, textured, handcrafted feel with visible fingerprints and warm, playful character.

---

## 📐 General Guidelines

| Property | Value |
|---|---|
| **Art Style** | Claymation / stop-motion, Tim Burton-esque playful macabre |
| **Format** | PNG with transparency (unless noted) |
| **Resolution** | Designed at **2x** (retina), game will scale down. Dimensions below are at 1x |
| **Color Mode** | sRGB |
| **Naming Convention** | `snake_case.png` |

---

## 🐟 Fish Assets

Each fish needs **6 animation states**. Provide as individual frames or sprite sheets (preferred).

### Spike (Cactus Fish)
| Asset | Filename | Size (1x) | Description |
|---|---|---|---|
| Forward swim | `spike_fw.png` | 110×70 | Swimming right, spines visible on top |
| Backward swim | `spike_bw.png` | 110×70 | Swimming left (mirrored) |
| Idle | `spike_idle.png` | 110×70 | Slight bobbing pose, relaxed spines |
| Eating | `spike_eat.png` | 110×70 | Mouth open, happy expression |
| Fly Fish Mode | `spike_fly.png` | 130×90 | Glowing, fins spread like wings, trailing sparkles |
| Baby variant | `spike_baby.png` | 55×35 | Smaller version for future spawning mechanic |
| **Sprite Sheet** | `spike_sheet.png` | 660×70 | All 6 frames in a horizontal strip (optional alternative) |

### Glimmer (Lantern Fish)
| Asset | Filename | Size (1x) | Description |
|---|---|---|---|
| Forward swim | `glimmer_fw.png` | 80×50 | Swimming right, lantern appendage glowing |
| Backward swim | `glimmer_bw.png` | 80×50 | Swimming left |
| Idle | `glimmer_idle.png` | 80×50 | Soft glow pulse, gentle movement |
| Eating | `glimmer_eat.png` | 80×50 | Mouth open, lantern brightens |
| Fly Fish Mode | `glimmer_fly.png` | 100×70 | Intense golden glow, light rays emanating |
| Baby variant | `glimmer_baby.png` | 40×25 | Tiny version with dim lantern |
| **Sprite Sheet** | `glimmer_sheet.png` | 480×50 | All 6 frames horizontal strip |

### Zoom (Rocket Fish)
| Asset | Filename | Size (1x) | Description |
|---|---|---|---|
| Forward swim | `zoom_fw.png` | 90×56 | Swimming right, streamlined, speed lines |
| Backward swim | `zoom_bw.png` | 90×56 | Swimming left |
| Idle | `zoom_idle.png` | 90×56 | Slightly compressed, ready-to-burst pose |
| Eating | `zoom_eat.png` | 90×56 | Quick snap eating pose |
| Fly Fish Mode | `zoom_fly.png` | 110×76 | Rocket exhaust trail, fins as wings |
| Run/Dash | `zoom_dash.png` | 90×56 | Stretched horizontal, motion blur effect |
| Baby variant | `zoom_baby.png` | 45×28 | Mini rocket fish |
| **Sprite Sheet** | `zoom_sheet.png` | 630×56 | All 7 frames horizontal strip |

---

## 🍖 Food & Items

| Asset | Filename | Size (1x) | Description |
|---|---|---|---|
| Food pellet | `food_pellet.png` | 24×24 | Round, golden-brown clay pellet with texture |
| Food pellet (sinking) | `food_pellet_wet.png` | 24×24 | Same but slightly darker/waterlogged look |
| Sparkle Pearl | `sparkle_pearl.png` | 20×20 | Shimmering golden clay sphere, reward currency |
| Ice Crystal | `ice_crystal.png` | 40×40 | Blue diamond-shaped crystal, faceted, glowing edges |
| Ice Crystal (collected) | `ice_crystal_small.png` | 16×16 | Smaller version for HUD/inventory display |
| Water Droplet | `water_drop.png` | 16×24 | Teardrop-shaped splash particle |

---

## 🐉 Dragon Assets

| Asset | Filename | Size (1x) | Description |
|---|---|---|---|
| Dragon body | `dragon_body.png` | 320×240 | Full dragon, chunky red clay, grumpy expression |
| Dragon attacking | `dragon_attack.png` | 320×280 | Mouth open, breathing fire pose |
| Dragon hit | `dragon_hit.png` | 320×240 | Recoiling, surprised/pained expression |
| Dragon frozen | `dragon_frozen.png` | 340×260 | Encased in wobbly ice block, dramatic silly face |
| Dragon falling | `dragon_fall.png` | 320×300 | Tumbling downward pose, arms flailing |
| Dragon wing left | `dragon_wing_l.png` | 150×100 | Left wing, separate for flap animation |
| Dragon wing right | `dragon_wing_r.png` | 150×100 | Right wing, mirrored |
| Dragon fire | `dragon_fire.png` | 80×160 | Claymation flame column, orange/yellow |
| Dragon fire (steam) | `dragon_steam.png` | 60×80 | Steam/mist effect when ice hits fire |
| Ice buildup overlay | `ice_overlay.png` | 320×240 | Semi-transparent ice texture to overlay on dragon |
| **Sprite Sheet** | `dragon_sheet.png` | 1600×300 | All key frames in horizontal strip |

---

## 🦈 Shark Assets

| Asset | Filename | Size (1x) | Description |
|---|---|---|---|
| Shark body | `shark_body.png` | 260×100 | Sleek, menacing grey shark. Scarred. Red glowing eyes, slit pupils. Rows of white sharp teeth visible. Dark grey top, lighter belly. Tall dorsal fin. Claymation style. |
| Shark attacking | `shark_attack.png` | 260×120 | Jaw wide open, teeth prominent, lunging forward pose |
| Shark fleeing | `shark_flee.png` | 260×100 | Turning away, tail curved, retreating pose |
| Shark dead | `shark_dead.png` | 260×100 | X-eyes, belly slightly up, sinking pose |

> [!NOTE]
> Place shark assets in `assets/shark/`. The game renders sharks procedurally (with chomping jaw animation, glowing red eyes, scars) until PNGs are provided.

---

## 🚤 Submarine (Brine-O-Boat)

| Asset | Filename | Size (1x) | Description |
|---|---|---|---|
| Sub body | `submarine.png` | 120×60 | Steampunky submarine, brass/copper, porthole |
| Sub propeller | `sub_propeller.png` | 30×30 | Spinning propeller, 3-blade |
| Sub periscope | `sub_periscope.png` | 20×40 | Periscope extending upward |
| Sub launcher | `sub_launcher.png` | 40×20 | Crystal launcher mounted on top |
| Crystal projectile | `crystal_projectile.png` | 24×24 | Ice crystal in flight, with trail glow |

---

## 🦟 Flying Bugs

| Asset | Filename | Size (1x) | Description |
|---|---|---|---|
| Bug (dragonfly) | `bug_dragonfly.png` | 24×20 | Mechanical dragonfly, steampunk aesthetic |
| Bug (firefly) | `bug_firefly.png` | 20×20 | Glowing bug, warm light |
| Bug (moth) | `bug_moth.png` | 22×18 | Fluttery moth with patterned wings |
| Bug wing flap (sheet) | `bug_wingflap.png` | 48×20 | 2-frame wing flap for any bug type |

---

## 🌍 Backgrounds & Environment

### Normal Mode (Cheerful Pond)
| Asset | Filename | Size (1x) | Description |
|---|---|---|---|
| Sky background | `bg_sky_normal.png` | 1920×600 | Gradient sky, cheerful pastels, seamless tile |
| Moon | `bg_moon.png` | 80×80 | Soft glowing moon |
| Cloud 1 | `bg_cloud_1.png` | 200×60 | Wispy clay cloud |
| Cloud 2 | `bg_cloud_2.png` | 160×50 | Smaller cloud variant |
| Cloud 3 | `bg_cloud_3.png` | 240×70 | Larger cloud |
| Landscape silhouette | `bg_landscape.png` | 1920×120 | Rolling hills/trees at water edge |
| Underwater rocks | `bg_rocks.png` | 1920×200 | Bottom rocks/coral, seamless tile |
| Seaweed 1 | `bg_seaweed_1.png` | 30×80 | Swaying seaweed strand |
| Seaweed 2 | `bg_seaweed_2.png` | 25×60 | Shorter variant |
| Bubble | `bg_bubble.png` | 12×12 | Single round bubble |

### Dragon Mode (Gothic)
| Asset | Filename | Size (1x) | Description |
|---|---|---|---|
| Sky background | `bg_sky_dragon.png` | 1920×600 | Dark, desaturated plum/teal dreamscape |
| Gothic towers | `bg_towers.png` | 1920×200 | Crooked towers, staircases to nowhere |
| Tower 1 (standalone) | `bg_tower_1.png` | 60×150 | Individual tilted tower with pointed top |
| Tower 2 (standalone) | `bg_tower_2.png` | 50×120 | Shorter tower variant |
| Candle | `bg_candle.png` | 16×32 | Small scattered candle with flickering flame |
| Archway | `bg_archway.png` | 120×80 | Mismatched pointed archway |

---

## 🖥️ UI & HUD

| Asset | Filename | Size (1x) | Description |
|---|---|---|---|
| Pearl icon | `ui_pearl.png` | 32×32 | Sparkle Pearl icon for HUD |
| Food icon | `ui_food.png` | 32×32 | Food pellet icon for HUD |
| Level icon | `ui_wave.png` | 32×32 | Wave/water icon for level display |
| Sound on | `ui_sound_on.png` | 32×32 | Speaker icon |
| Sound off | `ui_sound_off.png` | 32×32 | Muted speaker icon |
| Hunger bar frame | `ui_bar_frame.png` | 80×16 | Bar track border |
| Joy bar frame | `ui_bar_frame_joy.png` | 80×16 | Same but for joy meter |
| Launcher crosshair | `ui_crosshair.png` | 32×32 | Custom cursor for aiming |
| Fly Fish indicator | `ui_fly_ready.png` | 40×40 | Glowing rocket icon above fish |
| Crystal counter | `ui_crystal_count.png` | 32×32 | Ice crystal icon for submarine HUD |

---

## 🎬 Title & Banners

| Asset | Filename | Size (1x) | Description |
|---|---|---|---|
| Game logo | `logo_main.png` | 600×200 | "The Great Crystal Fish Defense" stylized text |
| Dragon warning banner | `banner_dragon.png` | 800×120 | "THE DRAGON APPROACHES!" dramatic text |
| Victory banner | `banner_victory.png` | 800×120 | "You Saved the Fish!" celebratory text |
| Start button | `btn_start.png` | 280×70 | "Start Adventure" button graphic |

---

## 🎵 Audio Assets (Optional)

| Asset | Filename | Format | Description |
|---|---|---|---|
| Background music (normal) | `music_normal.mp3` | MP3/OGG | Cheerful, underwater bubbly tune |
| Background music (dragon) | `music_dragon.mp3` | MP3/OGG | Ominous but playful organ music |
| Victory jingle | `sfx_victory.mp3` | MP3/OGG | Triumphant short fanfare |
| Splash (small) | `sfx_splash_sm.mp3` | MP3/OGG | Food hitting water |
| Splash (large) | `sfx_splash_lg.mp3` | MP3/OGG | Fish/dragon hitting water |
| Munch | `sfx_munch.mp3` | MP3/OGG | Fish eating food |
| Crystal collect | `sfx_crystal.mp3` | MP3/OGG | Chime sound |
| Crystal shoot | `sfx_shoot.mp3` | MP3/OGG | Chunky mechanic launch |
| Dragon roar | `sfx_roar.mp3` | MP3/OGG | Grumbly, playful roar |
| Dragon hit | `sfx_dragon_hit.mp3` | MP3/OGG | Ice impact + sizzle |
| Fly fish launch | `sfx_flyfish.mp3` | MP3/OGG | Whoosh + silly engine noise |
| Bug caught | `sfx_bug.mp3` | MP3/OGG | Quick snap |
| Pearl reward | `sfx_pearl.mp3` | MP3/OGG | Sparkly ding |
| Fire breath | `sfx_fire.mp3` | MP3/OGG | Crackling fire |

---

## 📁 Folder Structure

```
fishgame/
├── assets/
│   ├── fish/
│   │   ├── spike_fw.png
│   │   ├── spike_bw.png
│   │   ├── spike_idle.png
│   │   ├── spike_eat.png
│   │   ├── spike_fly.png
│   │   ├── spike_baby.png
│   │   ├── glimmer_fw.png
│   │   ├── glimmer_bw.png
│   │   ├── glimmer_idle.png
│   │   ├── glimmer_eat.png
│   │   ├── glimmer_fly.png
│   │   ├── glimmer_baby.png
│   │   ├── zoom_fw.png
│   │   ├── zoom_bw.png
│   │   ├── zoom_idle.png
│   │   ├── zoom_eat.png
│   │   ├── zoom_fly.png
│   │   ├── zoom_dash.png
│   │   └── zoom_baby.png
│   ├── items/
│   │   ├── food_pellet.png
│   │   ├── food_pellet_wet.png
│   │   ├── sparkle_pearl.png
│   │   ├── ice_crystal.png
│   │   ├── ice_crystal_small.png
│   │   └── water_drop.png
│   ├── dragon/
│   │   ├── dragon_body.png
│   │   ├── dragon_attack.png
│   │   ├── dragon_hit.png
│   │   ├── dragon_frozen.png
│   │   ├── dragon_fall.png
│   │   ├── dragon_wing_l.png
│   │   ├── dragon_wing_r.png
│   │   ├── dragon_fire.png
│   │   ├── dragon_steam.png
│   │   └── ice_overlay.png
│   ├── shark/
│   │   ├── shark_body.png
│   │   ├── shark_attack.png
│   │   ├── shark_flee.png
│   │   └── shark_dead.png
│   ├── submarine/
│   │   ├── submarine.png
│   │   ├── sub_propeller.png
│   │   ├── sub_periscope.png
│   │   ├── sub_launcher.png
│   │   └── crystal_projectile.png
│   ├── bugs/
│   │   ├── bug_dragonfly.png
│   │   ├── bug_firefly.png
│   │   ├── bug_moth.png
│   │   └── bug_wingflap.png
│   ├── backgrounds/
│   │   ├── normal/
│   │   │   ├── bg_sky_normal.png
│   │   │   ├── bg_moon.png
│   │   │   ├── bg_cloud_1.png
│   │   │   ├── bg_cloud_2.png
│   │   │   ├── bg_cloud_3.png
│   │   │   ├── bg_landscape.png
│   │   │   ├── bg_rocks.png
│   │   │   ├── bg_seaweed_1.png
│   │   │   ├── bg_seaweed_2.png
│   │   │   └── bg_bubble.png
│   │   └── dragon/
│   │       ├── bg_sky_dragon.png
│   │       ├── bg_towers.png
│   │       ├── bg_tower_1.png
│   │       ├── bg_tower_2.png
│   │       ├── bg_candle.png
│   │       └── bg_archway.png
│   ├── ui/
│   │   ├── ui_pearl.png
│   │   ├── ui_food.png
│   │   ├── ui_wave.png
│   │   ├── ui_sound_on.png
│   │   ├── ui_sound_off.png
│   │   ├── ui_bar_frame.png
│   │   ├── ui_bar_frame_joy.png
│   │   ├── ui_crosshair.png
│   │   ├── ui_fly_ready.png
│   │   └── ui_crystal_count.png
│   ├── banners/
│   │   ├── logo_main.png
│   │   ├── banner_dragon.png
│   │   ├── banner_victory.png
│   │   └── btn_start.png
│   └── audio/
│       ├── music_normal.mp3
│       ├── music_dragon.mp3
│       ├── sfx_victory.mp3
│       ├── sfx_splash_sm.mp3
│       ├── sfx_splash_lg.mp3
│       ├── sfx_munch.mp3
│       ├── sfx_crystal.mp3
│       ├── sfx_shoot.mp3
│       ├── sfx_roar.mp3
│       ├── sfx_dragon_hit.mp3
│       ├── sfx_flyfish.mp3
│       ├── sfx_bug.mp3
│       ├── sfx_pearl.mp3
│       └── sfx_fire.mp3
```

---

## 🎯 Priority Order

> [!IMPORTANT]
> Start with these assets — the game can run with programmatic placeholders for everything else.

### Phase 1 (Critical)
1. **Fish sprites** — `spike_fw`, `glimmer_fw`, `zoom_fw` (forward swim only)
2. **Food pellet** — `food_pellet.png`
3. **Game logo** — `logo_main.png`
4. **Background sky** — `bg_sky_normal.png`

### Phase 2 (Dragon Event)
5. **Dragon body** — `dragon_body.png`, `dragon_attack.png`
6. **Ice crystal** — `ice_crystal.png`
7. **Submarine** — `submarine.png`
8. **Dragon sky** — `bg_sky_dragon.png`

### Phase 3 (Polish)
9. All remaining fish states (bw, idle, eat, fly, baby)
10. Bugs, seaweed, rocks, UI icons
11. Banners and button graphics
12. Audio assets

---

> [!TIP]
> **Total unique assets: ~90 images + ~14 audio files**
> The game currently renders everything with programmatic shapes and gradients, so assets can be added incrementally without breaking anything. Just drop files into the correct `assets/` subfolder with the right filename, push, and they appear automatically!
