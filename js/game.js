/* ============================================
   THE GREAT CRYSTAL FISH DEFENSE - GAME ENGINE
   Main game loop, state management, controls,
   dynamic asset loading, shark system, and audio
   ============================================ */

// ============================================
// DYNAMIC ASSET LOADER
// Assets are loaded by trying to fetch them — if the file exists, great!
// If not, the game gracefully falls back to programmatic rendering.
// This means designers can keep adding PNGs and audio and they'll
// appear automatically on the next deploy/refresh.
// ============================================
const AssetLoader = {
    images: {},
    audio: {},
    _loading: new Set(),

    // Try to load an image. Returns the Image if loaded, null if not available.
    loadImage(key, path) {
        if (this.images[key] !== undefined) return; // Already attempted
        this.images[key] = null; // Mark as attempted, null = not loaded
        this._loading.add(key);
        const img = new Image();
        img.onload = () => {
            this.images[key] = img;
            this._loading.delete(key);
            console.log(`✅ Asset loaded: ${path}`);
        };
        img.onerror = () => {
            this.images[key] = null;
            this._loading.delete(key);
            // Silent fail — asset not provided yet, use programmatic fallback
        };
        img.src = path;
    },

    // Try to load audio. Returns HTMLAudioElement or null.
    loadAudio(key, path, loop = false, volume = 0.5) {
        if (this.audio[key] !== undefined) return;
        this.audio[key] = null;
        const audio = new Audio();
        audio.oncanplaythrough = () => {
            audio.loop = loop;
            audio.volume = volume;
            this.audio[key] = audio;
            console.log(`🎵 Audio loaded: ${path}`);
        };
        audio.onerror = () => {
            this.audio[key] = null;
        };
        audio.src = path;
    },

    // Get loaded image or null
    getImage(key) {
        return this.images[key] || null;
    },

    // Get loaded audio or null
    getAudio(key) {
        return this.audio[key] || null;
    },

    // Play audio if loaded and sound is on
    playAudio(key, soundOn) {
        if (!soundOn) return;
        const a = this.audio[key];
        if (a) {
            // Clone for overlapping sounds
            if (a.loop) {
                if (a.paused) a.play().catch(() => { });
            } else {
                const clone = a.cloneNode();
                clone.volume = a.volume;
                clone.play().catch(() => { });
            }
        }
    },

    stopAudio(key) {
        const a = this.audio[key];
        if (a) {
            a.pause();
            a.currentTime = 0;
        }
    }
};

// ---- Load all known assets (they'll silently fail if not present) ----
function loadAllAssets() {
    // Fish sprites
    const fishTypes = ['spike', 'glimmer', 'zoom'];
    const fishStates = ['fw', 'bw', 'idle', 'eat', 'fly', 'baby'];
    for (const type of fishTypes) {
        for (const state of fishStates) {
            AssetLoader.loadImage(`${type}_${state}`, `assets/fish/${type}_${state}.png`);
        }
        AssetLoader.loadImage(`${type}_sheet`, `assets/fish/${type}_sheet.png`);
    }
    AssetLoader.loadImage('zoom_dash', 'assets/fish/zoom_dash.png');

    // Items
    AssetLoader.loadImage('food_pellet', 'assets/items/food_pellet.png');
    AssetLoader.loadImage('food_pellet_wet', 'assets/items/food_pellet_wet.png');
    AssetLoader.loadImage('sparkle_pearl', 'assets/items/sparkle_pearl.png');
    AssetLoader.loadImage('ice_crystal', 'assets/items/ice_crystal.png');
    AssetLoader.loadImage('water_drop', 'assets/items/water_drop.png');

    // Dragon
    AssetLoader.loadImage('dragon_body', 'assets/dragon/dragon_body.png');
    AssetLoader.loadImage('dragon_attack', 'assets/dragon/dragon_attack.png');
    AssetLoader.loadImage('dragon_hit', 'assets/dragon/dragon_hit.png');
    AssetLoader.loadImage('dragon_frozen', 'assets/dragon/dragon_frozen.png');
    AssetLoader.loadImage('dragon_fall', 'assets/dragon/dragon_fall.png');
    AssetLoader.loadImage('dragon_fire', 'assets/dragon/dragon_fire.png');
    AssetLoader.loadImage('dragon_steam', 'assets/dragon/dragon_steam.png');
    AssetLoader.loadImage('ice_overlay', 'assets/dragon/ice_overlay.png');

    // Shark
    AssetLoader.loadImage('shark_body', 'assets/shark/shark_body.png');
    AssetLoader.loadImage('shark_attack', 'assets/shark/shark_attack.png');
    AssetLoader.loadImage('shark_flee', 'assets/shark/shark_flee.png');
    AssetLoader.loadImage('shark_dead', 'assets/shark/shark_dead.png');

    // Submarine
    AssetLoader.loadImage('submarine', 'assets/submarine/submarine.png');
    AssetLoader.loadImage('crystal_projectile', 'assets/submarine/crystal_projectile.png');

    // Bugs
    AssetLoader.loadImage('bug_dragonfly', 'assets/bugs/bug_dragonfly.png');
    AssetLoader.loadImage('bug_firefly', 'assets/bugs/bug_firefly.png');

    // Backgrounds
    AssetLoader.loadImage('bg_sky_normal', 'assets/backgrounds/normal/bg_sky_normal.png');
    AssetLoader.loadImage('bg_sky_dragon', 'assets/backgrounds/dragon/bg_sky_dragon.png');
    AssetLoader.loadImage('bg_moon', 'assets/backgrounds/normal/bg_moon.png');
    AssetLoader.loadImage('bg_cloud_1', 'assets/backgrounds/normal/bg_cloud_1.png');
    AssetLoader.loadImage('bg_cloud_2', 'assets/backgrounds/normal/bg_cloud_2.png');
    AssetLoader.loadImage('bg_cloud_3', 'assets/backgrounds/normal/bg_cloud_3.png');
    AssetLoader.loadImage('bg_landscape', 'assets/backgrounds/normal/bg_landscape.png');
    AssetLoader.loadImage('bg_rocks', 'assets/backgrounds/normal/bg_rocks.png');
    AssetLoader.loadImage('bg_towers', 'assets/backgrounds/dragon/bg_towers.png');

    // UI
    AssetLoader.loadImage('ui_pearl', 'assets/ui/ui_pearl.png');
    AssetLoader.loadImage('ui_food', 'assets/ui/ui_food.png');
    AssetLoader.loadImage('ui_crosshair', 'assets/ui/ui_crosshair.png');

    // Banners
    AssetLoader.loadImage('logo_main', 'assets/banners/logo_main.png');
    AssetLoader.loadImage('banner_dragon', 'assets/banners/banner_dragon.png');
    AssetLoader.loadImage('banner_victory', 'assets/banners/banner_victory.png');

    // Audio
    AssetLoader.loadAudio('music_normal', 'assets/audio/music_normal.mp3', true, 0.3);
    AssetLoader.loadAudio('music_dragon', 'assets/audio/music_dragon.mp3', true, 0.4);
    AssetLoader.loadAudio('sfx_splash_sm', 'assets/audio/sfx_splash_sm.mp3', false, 0.5);
    AssetLoader.loadAudio('sfx_splash_lg', 'assets/audio/sfx_splash_lg.mp3', false, 0.6);
    AssetLoader.loadAudio('sfx_munch', 'assets/audio/sfx_munch.mp3', false, 0.5);
    AssetLoader.loadAudio('sfx_crystal', 'assets/audio/sfx_crystal.mp3', false, 0.5);
    AssetLoader.loadAudio('sfx_shoot', 'assets/audio/sfx_shoot.mp3', false, 0.5);
    AssetLoader.loadAudio('sfx_roar', 'assets/audio/sfx_roar.mp3', false, 0.6);
    AssetLoader.loadAudio('sfx_dragon_hit', 'assets/audio/sfx_dragon_hit.mp3', false, 0.5);
    AssetLoader.loadAudio('sfx_flyfish', 'assets/audio/sfx_flyfish.mp3', false, 0.5);
    AssetLoader.loadAudio('sfx_bug', 'assets/audio/sfx_bug.mp3', false, 0.4);
    AssetLoader.loadAudio('sfx_pearl', 'assets/audio/sfx_pearl.mp3', false, 0.3);
    AssetLoader.loadAudio('sfx_fire', 'assets/audio/sfx_fire.mp3', false, 0.4);
    AssetLoader.loadAudio('sfx_victory', 'assets/audio/sfx_victory.mp3', false, 0.6);
}

// Start loading immediately
loadAllAssets();

// ---- CANVAS SETUP ----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    water.resize();
    for (const fish of fishes) {
        fish.canvasW = canvas.width;
        fish.canvasH = canvas.height;
    }
});

// ---- SYSTEMS ----
const water = new WaterSystem(canvas, ctx);
water.init();

// ---- GAME STATE ----
const GamePhase = {
    MENU: 'menu',
    NORMAL: 'normal',
    DRAGON_INTRO: 'dragon_intro',
    DRAGON_FIGHT: 'dragon_fight',
    VICTORY: 'victory'
};

const state = {
    phase: GamePhase.MENU,
    pearls: 0,
    food: 20,
    level: 1,
    score: 0,
    feedCount: 0,
    feedGoal: 10,
    dragonDefeated: 0,
    soundOn: true
};

// ---- ENTITY ARRAYS ----
let fishes = [];
let foodPellets = [];
let bugs = [];
let sharks = [];
let iceCrystals = [];
let crystalProjectiles = [];
let sparklePearls = [];
let dragon = null;
let submarine = null;

// ---- INPUT ----
const keys = { left: false, right: false, up: false, down: false, space: false };
const mouse = { x: 0, y: 0, down: false };

// ---- LAUNCHER STATE ----
let launcherActive = false;
let launcherStart = { x: 0, y: 0 };

// ---- BACKGROUND ----
let bgStars = [];
for (let i = 0; i < 80; i++) {
    bgStars.push({
        x: Math.random() * 2000,
        y: Math.random() * 800,
        r: 0.5 + Math.random() * 1.5,
        twinkle: Math.random() * Math.PI * 2
    });
}

let bgClouds = [];
for (let i = 0; i < 5; i++) {
    bgClouds.push({
        x: Math.random() * 2000,
        y: 40 + Math.random() * 150,
        w: 80 + Math.random() * 120,
        h: 25 + Math.random() * 20,
        speed: 0.1 + Math.random() * 0.3
    });
}

// ---- TIMERS ----
let dragonIntroTimer = 0;
let victoryTimer = 0;
let bugSpawnTimer = 0;
let crystalSpawnTimer = 0;
let sharkSpawnTimer = 0;
let currentMusic = null;

// ============================================
// EVENT LISTENERS
// ============================================
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-sound').addEventListener('click', toggleSound);

canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.down = true;
    handleClick(e.clientX, e.clientY);
});

canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener('mouseup', (e) => {
    mouse.down = false;
    if (launcherActive) {
        launchFood(e.clientX, e.clientY);
        launcherActive = false;
    }
});

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowLeft': case 'a': keys.left = true; break;
        case 'ArrowRight': case 'd': keys.right = true; break;
        case 'ArrowUp': case 'w': keys.up = true; break;
        case 'ArrowDown': case 's': keys.down = true; break;
        case ' ': keys.space = true; handleSpacebar(); break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'ArrowLeft': case 'a': keys.left = false; break;
        case 'ArrowRight': case 'd': keys.right = false; break;
        case 'ArrowUp': case 'w': keys.up = false; break;
        case 'ArrowDown': case 's': keys.down = false; break;
        case ' ': keys.space = false; break;
    }
});

// ============================================
// MUSIC MANAGEMENT
// ============================================
function switchMusic(trackKey) {
    if (currentMusic === trackKey) return;
    // Stop current music
    if (currentMusic) AssetLoader.stopAudio(currentMusic);
    currentMusic = trackKey;
    AssetLoader.playAudio(trackKey, state.soundOn);
}

function stopAllMusic() {
    if (currentMusic) {
        AssetLoader.stopAudio(currentMusic);
        currentMusic = null;
    }
}

// ============================================
// GAME INIT
// ============================================
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    state.phase = GamePhase.NORMAL;
    state.pearls = 0;
    state.food = 20;
    state.level = 1;
    state.feedCount = 0;

    fishes = [];
    foodPellets = [];
    bugs = [];
    sharks = [];
    iceCrystals = [];
    crystalProjectiles = [];
    sparklePearls = [];
    dragon = null;
    submarine = null;

    spawnFish('spike');
    spawnFish('glimmer');
    spawnFish('zoom');

    for (let i = 0; i < 6; i++) {
        bugs.push(new FlyingBug(canvas.width, water.START_Y));
    }

    water.setDragonMode(false);
    switchMusic('music_normal');
    updateHUD();
}

function spawnFish(type) {
    const x = 100 + Math.random() * (canvas.width - 200);
    const y = water.START_Y + 60 + Math.random() * (water.END_Y - water.START_Y - 120);
    fishes.push(new Fish(type, x, y, canvas.width, canvas.height));
}

function toggleSound() {
    state.soundOn = !state.soundOn;
    document.getElementById('btn-sound').textContent = state.soundOn ? '🔊' : '🔇';
    if (!state.soundOn) {
        stopAllMusic();
    } else if (currentMusic) {
        AssetLoader.playAudio(currentMusic, true);
    }
}

// ============================================
// CLICK / INPUT HANDLERS
// ============================================
function handleClick(mx, my) {
    if (state.phase === GamePhase.NORMAL) {
        // Check if clicking a fly-fish-ready fish
        for (const fish of fishes) {
            if (fish.joy >= 100 && fish.isClickedInWater(mx, my)) {
                if (fish.activateFlyFish(water)) {
                    AssetLoader.playAudio('sfx_flyfish', state.soundOn);
                    return;
                }
            }
        }

        // Start launcher (food slingshot)
        if (my < water.START_Y && state.food > 0) {
            launcherActive = true;
            launcherStart = { x: mx, y: my };
        } else if (state.food > 0) {
            const pellet = new FoodPellet(mx, my, 0, 1);
            foodPellets.push(pellet);
            state.food--;
            AssetLoader.playAudio('sfx_splash_sm', state.soundOn);
            updateHUD();
        }
    } else if (state.phase === GamePhase.DRAGON_FIGHT) {
        if (submarine) {
            const proj = submarine.shootCrystal();
            if (proj) {
                crystalProjectiles.push(new CrystalProjectile(proj.x, proj.y, proj.vx, proj.vy));
                AssetLoader.playAudio('sfx_shoot', state.soundOn);
            }
        }
    }
}

function launchFood(endX, endY) {
    if (state.food <= 0) return;
    const dx = launcherStart.x - endX;
    const dy = launcherStart.y - endY;
    const power = Math.min(Math.hypot(dx, dy) * 0.08, 12);
    const angle = Math.atan2(dy, dx);

    const pellet = new FoodPellet(
        launcherStart.x,
        launcherStart.y,
        Math.cos(angle) * power,
        Math.sin(angle) * power
    );
    foodPellets.push(pellet);
    state.food--;
    AssetLoader.playAudio('sfx_splash_sm', state.soundOn);
    updateHUD();
}

function handleSpacebar() {
    if (state.phase === GamePhase.DRAGON_FIGHT && submarine) {
        const proj = submarine.shootCrystal();
        if (proj) {
            crystalProjectiles.push(new CrystalProjectile(proj.x, proj.y, proj.vx, proj.vy));
            AssetLoader.playAudio('sfx_shoot', state.soundOn);
        }
    }
}

// ============================================
// UPDATE LOOP
// ============================================
function update() {
    water.update();

    switch (state.phase) {
        case GamePhase.NORMAL:
            updateNormal();
            break;
        case GamePhase.DRAGON_INTRO:
            updateDragonIntro();
            break;
        case GamePhase.DRAGON_FIGHT:
            updateDragonFight();
            break;
        case GamePhase.VICTORY:
            updateVictory();
            break;
    }

    // Always update sparkle pearls
    for (let i = sparklePearls.length - 1; i >= 0; i--) {
        sparklePearls[i].update();
        if (!sparklePearls[i].alive) sparklePearls.splice(i, 1);
    }

    // Update clouds
    for (const cloud of bgClouds) {
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width + 200) cloud.x = -200;
    }
}

function updateNormal() {
    // Food pellets
    for (let i = foodPellets.length - 1; i >= 0; i--) {
        foodPellets[i].update(water);
        if (!foodPellets[i].alive) foodPellets.splice(i, 1);
    }

    // Fish
    for (const fish of fishes) {
        fish.update(water, foodPellets, bugs);
        if (fish.hunger > 99 && Math.random() < 0.01) {
            state.pearls += 1;
            AssetLoader.playAudio('sfx_pearl', state.soundOn);
            for (let i = 0; i < 3; i++) {
                sparklePearls.push(new SparklePearl(fish.x, fish.y));
            }
        }
    }

    // Count feeds
    const prevFeedCount = state.feedCount;
    state.feedCount = fishes.reduce((sum, f) => sum + Math.floor(f.joy / 20), 0);
    if (state.feedCount > prevFeedCount) {
        state.pearls += (state.feedCount - prevFeedCount);
        updateHUD();
    }

    // Bugs
    for (let i = bugs.length - 1; i >= 0; i--) {
        bugs[i].update();
        if (!bugs[i].alive) {
            state.pearls += 5;
            AssetLoader.playAudio('sfx_bug', state.soundOn);
            for (let k = 0; k < 5; k++) {
                sparklePearls.push(new SparklePearl(bugs[i].x, bugs[i].y));
            }
            bugs.splice(i, 1);
            updateHUD();
        }
    }

    // Bug respawning
    bugSpawnTimer++;
    if (bugSpawnTimer > 300 && bugs.length < 8) {
        bugs.push(new FlyingBug(canvas.width, water.START_Y));
        bugSpawnTimer = 0;
    }

    // Food refill over time
    if (state.food < 5 && Math.random() < 0.005) {
        state.food += 5;
        updateHUD();
    }

    // ---- SHARK SYSTEM ----
    sharkSpawnTimer++;
    // Sharks spawn more frequently at higher levels
    const sharkInterval = Math.max(400, 900 - state.level * 80);
    if (sharkSpawnTimer > sharkInterval && sharks.length < 2 + Math.floor(state.level / 2)) {
        sharks.push(new Shark(canvas.width, water.START_Y, water.END_Y));
        sharkSpawnTimer = 0;
    }

    // Update sharks
    for (let i = sharks.length - 1; i >= 0; i--) {
        const shark = sharks[i];
        shark.update(fishes, water);

        // Auto-fight: Fish near a shark will fight if fed enough
        if (shark.phase === 'hunting') {
            for (const fish of fishes) {
                if (shark.isNearFish(fish) && fish.canFight()) {
                    fish.fightShark(shark, water);
                    AssetLoader.playAudio('sfx_splash_lg', state.soundOn);
                }
            }
        }

        // Reward for defeating sharks
        if (!shark.alive) {
            if (shark.hp <= 0) {
                state.pearls += 15;
                for (let k = 0; k < 10; k++) {
                    sparklePearls.push(new SparklePearl(shark.x, shark.y));
                }
                updateHUD();
            }
            sharks.splice(i, 1);
        }
    }

    // Dragon event trigger
    const totalJoy = fishes.reduce((sum, f) => sum + f.joy, 0);
    if (totalJoy >= state.feedGoal * 20 && state.dragonDefeated < state.level) {
        startDragonEvent();
    }
}

function startDragonEvent() {
    state.phase = GamePhase.DRAGON_INTRO;
    dragonIntroTimer = 180;
    water.setDragonMode(true);
    switchMusic('music_dragon');
    AssetLoader.playAudio('sfx_roar', state.soundOn);
    document.getElementById('dragon-banner').classList.remove('hidden');

    // Sharks flee when dragon arrives
    for (const shark of sharks) {
        shark.phase = 'fleeing';
    }
}

function updateDragonIntro() {
    dragonIntroTimer--;
    if (dragonIntroTimer <= 0) {
        document.getElementById('dragon-banner').classList.add('hidden');
        state.phase = GamePhase.DRAGON_FIGHT;
        dragon = new Dragon(canvas.width, canvas.height);
        submarine = new Submarine(canvas.width / 2, water.START_Y + 60);

        for (let i = 0; i < 5; i++) {
            const cx = 80 + Math.random() * (canvas.width - 160);
            const cy = water.START_Y + 40 + Math.random() * (water.END_Y - water.START_Y - 80);
            iceCrystals.push(new IceCrystal(cx, cy));
        }
    }
}

function updateDragonFight() {
    if (submarine) {
        submarine.update(keys, water);
    }

    if (dragon) {
        dragon.update(water);

        const fireZone = dragon.getFireZone();
        if (fireZone && submarine) {
            if (submarine.x > fireZone.x && submarine.x < fireZone.x + fireZone.width &&
                submarine.y > fireZone.y && submarine.y < fireZone.y + fireZone.height) {
                submarine.y += 5;
            }
        }

        if (!dragon.alive) {
            state.dragonDefeated++;
            state.phase = GamePhase.VICTORY;
            victoryTimer = 300;
            const bonus = 50 + state.level * 20;
            state.pearls += bonus;
            AssetLoader.playAudio('sfx_victory', state.soundOn);
            document.getElementById('victory-banner').classList.remove('hidden');
            document.getElementById('victory-pearls').textContent = `+${bonus} Sparkle Pearls!`;

            for (let i = 0; i < 40; i++) {
                sparklePearls.push(new SparklePearl(
                    dragon.x + (Math.random() - 0.5) * 200,
                    dragon.y + (Math.random() - 0.5) * 100
                ));
            }

            dragon = null;
            submarine = null;
            updateHUD();
        }
    }

    for (let i = iceCrystals.length - 1; i >= 0; i--) {
        iceCrystals[i].update();
        if (submarine) {
            const dist = Math.hypot(iceCrystals[i].x - submarine.x, iceCrystals[i].y - submarine.y);
            if (dist < 30) {
                submarine.collectCrystal();
                AssetLoader.playAudio('sfx_crystal', state.soundOn);
                iceCrystals.splice(i, 1);
                continue;
            }
        }
    }

    for (let i = crystalProjectiles.length - 1; i >= 0; i--) {
        crystalProjectiles[i].update();
        if (dragon && crystalProjectiles[i].alive) {
            const dist = Math.hypot(
                crystalProjectiles[i].x - dragon.x,
                crystalProjectiles[i].y - dragon.y
            );
            if (dist < 60) {
                dragon.hit(15);
                crystalProjectiles[i].alive = false;
                AssetLoader.playAudio('sfx_dragon_hit', state.soundOn);
                for (let k = 0; k < 8; k++) {
                    sparklePearls.push(new SparklePearl(
                        crystalProjectiles[i].x + (Math.random() - 0.5) * 20,
                        crystalProjectiles[i].y + (Math.random() - 0.5) * 20
                    ));
                }
            }
        }
        if (!crystalProjectiles[i].alive) {
            crystalProjectiles.splice(i, 1);
        }
    }

    crystalSpawnTimer++;
    if (crystalSpawnTimer > 240 && iceCrystals.length < 4) {
        const cx = 80 + Math.random() * (canvas.width - 160);
        const cy = water.START_Y + 40 + Math.random() * (water.END_Y - water.START_Y - 80);
        iceCrystals.push(new IceCrystal(cx, cy));
        crystalSpawnTimer = 0;
    }
}

function updateVictory() {
    victoryTimer--;
    if (victoryTimer <= 0) {
        document.getElementById('victory-banner').classList.add('hidden');
        state.phase = GamePhase.NORMAL;
        state.level++;
        state.feedGoal += 5;
        state.food = Math.max(state.food, 20);
        water.setDragonMode(false);
        iceCrystals = [];
        crystalProjectiles = [];
        switchMusic('music_normal');

        for (let i = 0; i < 4; i++) {
            bugs.push(new FlyingBug(canvas.width, water.START_Y));
        }

        updateHUD();
    }
}

// ============================================
// DRAW LOOP
// ============================================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();

    // Bugs (above water)
    for (const bug of bugs) bug.draw(ctx);

    // Flying fish (above water)
    for (const fish of fishes) {
        if (fish.flyFishMode) fish.draw(ctx);
    }

    // Dragon
    if (dragon) dragon.draw(ctx);

    // Food pellets (above water portion)
    for (const p of foodPellets) {
        if (!p.inWater) p.draw(ctx);
    }

    // Water
    water.draw();

    // Underwater entities
    // Sharks (drawn behind fish)
    for (const shark of sharks) shark.draw(ctx);

    for (const fish of fishes) {
        if (!fish.flyFishMode) fish.draw(ctx);
    }
    for (const p of foodPellets) {
        if (p.inWater) p.draw(ctx);
    }
    for (const c of iceCrystals) c.draw(ctx);
    if (submarine) submarine.draw(ctx);

    // Crystal projectiles
    for (const cp of crystalProjectiles) cp.draw(ctx);

    // Sparkle pearls
    for (const sp of sparklePearls) sp.draw(ctx);

    // Launcher preview
    if (launcherActive && mouse.down) {
        drawLauncherPreview();
    }

    // Dragon fight instructions
    if (state.phase === GamePhase.DRAGON_FIGHT) {
        drawDragonFightHUD();
    }

    // Shark warning indicator
    if (sharks.length > 0 && state.phase === GamePhase.NORMAL) {
        drawSharkWarning();
    }
}

function drawBackground() {
    const isDragon = state.phase === GamePhase.DRAGON_INTRO ||
        state.phase === GamePhase.DRAGON_FIGHT;

    // Sky gradient (or asset if loaded)
    const skyImg = AssetLoader.getImage(isDragon ? 'bg_sky_dragon' : 'bg_sky_normal');
    if (skyImg) {
        ctx.drawImage(skyImg, 0, 0, canvas.width, water.START_Y);
    } else {
        let skyGrad;
        if (isDragon) {
            skyGrad = ctx.createLinearGradient(0, 0, 0, water.START_Y);
            skyGrad.addColorStop(0, '#1a0a2e');
            skyGrad.addColorStop(0.5, '#2d1b4e');
            skyGrad.addColorStop(1, '#3e1f5c');
        } else {
            skyGrad = ctx.createLinearGradient(0, 0, 0, water.START_Y);
            skyGrad.addColorStop(0, '#0a1628');
            skyGrad.addColorStop(0.4, '#0d2137');
            skyGrad.addColorStop(0.7, '#1a3a5c');
            skyGrad.addColorStop(1, '#2d5a7b');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, water.START_Y);
    }

    // Stars
    for (const star of bgStars) {
        star.twinkle += 0.02;
        const alpha = 0.3 + Math.sin(star.twinkle) * 0.3;
        const sx = star.x % canvas.width;
        const sy = star.y % (water.START_Y || 400);
        ctx.beginPath();
        ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
        ctx.fill();
    }

    // Moon
    if (!isDragon) {
        const moonImg = AssetLoader.getImage('bg_moon');
        const moonX = canvas.width * 0.8;
        const moonY = 80;
        if (moonImg) {
            ctx.drawImage(moonImg, moonX - 40, moonY - 40, 80, 80);
        } else {
            ctx.beginPath();
            ctx.arc(moonX, moonY, 30, 0, Math.PI * 2);
            const moonGrad = ctx.createRadialGradient(moonX - 5, moonY - 5, 5, moonX, moonY, 30);
            moonGrad.addColorStop(0, 'rgba(255, 255, 230, 0.9)');
            moonGrad.addColorStop(1, 'rgba(200, 200, 180, 0.1)');
            ctx.fillStyle = moonGrad;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(moonX, moonY, 60, 0, Math.PI * 2);
            const moonGlow = ctx.createRadialGradient(moonX, moonY, 30, moonX, moonY, 60);
            moonGlow.addColorStop(0, 'rgba(255, 255, 200, 0.1)');
            moonGlow.addColorStop(1, 'rgba(255, 255, 200, 0)');
            ctx.fillStyle = moonGlow;
            ctx.fill();
        }
    }

    // Clouds
    ctx.save();
    for (let ci = 0; ci < bgClouds.length; ci++) {
        const cloud = bgClouds[ci];
        const cloudImg = AssetLoader.getImage(`bg_cloud_${(ci % 3) + 1}`);
        if (cloudImg) {
            ctx.drawImage(cloudImg, cloud.x - cloud.w / 2, cloud.y - cloud.h / 2, cloud.w, cloud.h);
        } else {
            ctx.beginPath();
            ctx.ellipse(cloud.x, cloud.y, cloud.w / 2, cloud.h / 2, 0, 0, Math.PI * 2);
            ctx.fillStyle = isDragon ? 'rgba(80, 30, 100, 0.3)' : 'rgba(100, 140, 180, 0.15)';
            ctx.fill();
        }
    }
    ctx.restore();

    // Distant mountains / environment silhouette
    drawSilhouette(isDragon);
}

function drawSilhouette(isDragon) {
    const baseY = water.START_Y;

    // Try asset
    const landscapeImg = AssetLoader.getImage(isDragon ? 'bg_towers' : 'bg_landscape');
    if (landscapeImg) {
        const lh = 120;
        ctx.drawImage(landscapeImg, 0, baseY - lh, canvas.width, lh);
        return;
    }

    ctx.beginPath();
    ctx.moveTo(0, baseY);
    const segments = 20;
    const segW = canvas.width / segments;
    for (let i = 0; i <= segments; i++) {
        const x = i * segW;
        const h = 20 + Math.sin(i * 0.8) * 25 + Math.sin(i * 1.7) * 15;
        ctx.lineTo(x, baseY - h);
    }
    ctx.lineTo(canvas.width, baseY);
    ctx.closePath();
    ctx.fillStyle = isDragon ? 'rgba(30, 10, 40, 0.6)' : 'rgba(10, 25, 50, 0.5)';
    ctx.fill();

    if (isDragon) {
        const towers = [0.15, 0.35, 0.55, 0.75, 0.9];
        for (const frac of towers) {
            const tx = canvas.width * frac;
            const th = 40 + Math.sin(frac * 20) * 30;
            const tw = 12 + Math.sin(frac * 15) * 6;

            ctx.fillStyle = 'rgba(20, 5, 30, 0.7)';
            ctx.fillRect(tx - tw / 2, baseY - th, tw, th);

            ctx.beginPath();
            ctx.moveTo(tx - tw / 2 - 3, baseY - th);
            ctx.lineTo(tx, baseY - th - 15 - Math.random() * 5);
            ctx.lineTo(tx + tw / 2 + 3, baseY - th);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.arc(tx, baseY - th + 10, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 200, 100, 0.4)';
            ctx.fill();
        }
    }
}

function drawLauncherPreview() {
    const dx = launcherStart.x - mouse.x;
    const dy = launcherStart.y - mouse.y;
    const power = Math.min(Math.hypot(dx, dy) * 0.08, 12);

    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(launcherStart.x, launcherStart.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.strokeStyle = `rgba(255, 152, 0, ${0.4 + power * 0.04})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(launcherStart.x, launcherStart.y, 8 + power, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 152, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * power;
    const vy = Math.sin(angle) * power;
    let px = launcherStart.x;
    let py = launcherStart.y;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let t = 0; t < 30; t++) {
        px += vx;
        py += vy + 0.25 * t;
        if (py > water.START_Y) break;
        ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(255, 200, 80, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawDragonFightHUD() {
    ctx.save();
    ctx.font = '14px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(200,230,255,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('⌨️ WASD/Arrows to move • SPACE/Click to shoot crystals', canvas.width / 2, canvas.height - 20);

    if (submarine && submarine.crystals === 0 && iceCrystals.length > 0) {
        ctx.font = 'bold 16px Fredoka One, cursive';
        ctx.fillStyle = 'rgba(79, 195, 247, 0.8)';
        ctx.fillText('💎 Collect Ice Crystals to load your launcher!', canvas.width / 2, canvas.height - 50);
    }
    ctx.restore();
}

function drawSharkWarning() {
    const huntingSharks = sharks.filter(s => s.phase === 'hunting');
    if (huntingSharks.length === 0) return;

    ctx.save();
    ctx.font = 'bold 14px Fredoka One, cursive';
    ctx.textAlign = 'center';
    const alpha = 0.5 + Math.sin(Date.now() * 0.006) * 0.3;
    ctx.fillStyle = `rgba(244, 67, 54, ${alpha})`;
    ctx.fillText(`⚠️ ${huntingSharks.length} SHARK${huntingSharks.length > 1 ? 'S' : ''} ATTACKING! Feed your fish so they can fight!`,
        canvas.width / 2, water.START_Y - 10);
    ctx.restore();
}

// ============================================
// HUD UPDATE
// ============================================
function updateHUD() {
    document.getElementById('pearl-count').textContent = state.pearls;
    document.getElementById('food-count').textContent = state.food;
    document.getElementById('level-text').textContent = `Level ${state.level}`;
}

function updateFishPanel() {
    const panel = document.getElementById('fish-panel');
    let found = false;

    if (state.phase === GamePhase.NORMAL) {
        for (const fish of fishes) {
            if (!fish.flyFishMode && Math.abs(mouse.x - fish.x) < 60 && Math.abs(mouse.y - fish.y) < 60) {
                panel.classList.remove('hidden');
                document.getElementById('fish-panel-name').textContent = `${fish.name} (${fish.type})`;
                document.getElementById('fish-hunger-bar').style.width = `${fish.hunger}%`;
                document.getElementById('fish-joy-bar').style.width = `${fish.joy}%`;
                let statusText = '';
                if (fish.fighting) statusText = '⚔️ Fighting a shark!';
                else if (fish.joy >= 100) statusText = '🚀 Ready for Fly Fish Mode!';
                else if (fish.hunger < 20) statusText = '😢 Very hungry!';
                else if (fish.hunger < 25) statusText = '⚠️ Too hungry to fight!';
                else if (fish.hunger > 80) statusText = '😊 Well fed & battle ready!';
                else statusText = '🐟 Swimming around...';
                document.getElementById('fish-panel-status').textContent = statusText;
                found = true;
                break;
            }
        }
    }

    if (!found) {
        panel.classList.add('hidden');
    }
}

// ============================================
// MAIN GAME LOOP
// ============================================
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (state.phase !== GamePhase.MENU) {
        update();
        draw();
        updateFishPanel();
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
