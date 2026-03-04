/* ============================================
   THE GREAT CRYSTAL FISH DEFENSE - GAME ENGINE
   Fish control, dragon fight, screen shake, audio
   ============================================ */

// ---- DYNAMIC ASSET LOADER ----
const AssetLoader = {
    images: {}, audio: {}, _loading: new Set(),
    loadImage(key, path) {
        if (this.images[key] !== undefined) return;
        this.images[key] = null;
        const img = new Image();
        img.onload = () => { this.images[key] = img; };
        img.onerror = () => { this.images[key] = null; };
        img.src = path;
    },
    loadAudio(key, path, loop = false, vol = 0.5) {
        if (this.audio[key] !== undefined) return;
        this.audio[key] = null;
        const a = new Audio();
        a.oncanplaythrough = () => { a.loop = loop; a.volume = vol; this.audio[key] = a; };
        a.onerror = () => { this.audio[key] = null; };
        a.src = path;
    },
    getImage(k) { return this.images[k] || null; },
    playAudio(key, on) {
        if (!on) return;
        const a = this.audio[key];
        if (a) { if (a.loop) { if (a.paused) a.play().catch(() => { }); } else { const c = a.cloneNode(); c.volume = a.volume; c.play().catch(() => { }); } }
    },
    stopAudio(key) { const a = this.audio[key]; if (a) { a.pause(); a.currentTime = 0; } }
};

function loadAllAssets() {
    ['spike', 'glimmer', 'zoom'].forEach(t => {
        ['fw', 'bw', 'idle', 'eat', 'fly', 'baby', 'front'].forEach(s => AssetLoader.loadImage(`${t}_${s}`, `assets/fish/${t}_${s}.png`));
    });
    ['food_pellet', 'sparkle_pearl', 'ice_crystal', 'water_drop'].forEach(k => AssetLoader.loadImage(k, `assets/items/${k}.png`));
    ['shark_body', 'shark_attack', 'shark_flee', 'shark_dead'].forEach(k => AssetLoader.loadImage(k, `assets/shark/${k}.png`));
    ['bg_sky_normal', 'bg_moon', 'bg_cloud_1', 'bg_cloud_2', 'bg_cloud_3', 'bg_landscape'].forEach(k => AssetLoader.loadImage(k, `assets/backgrounds/normal/${k}.png`));
    ['bg_sky_dragon', 'bg_towers'].forEach(k => AssetLoader.loadImage(k, `assets/backgrounds/dragon/${k}.png`));
    AssetLoader.loadImage('poster_start', 'assets/banners/poster_start.png');
    AssetLoader.loadImage('logo_main', 'assets/banners/logo_main.png');
    AssetLoader.loadAudio('music_normal', 'assets/audio/music_normal.mp3', true, 0.3);
    AssetLoader.loadAudio('music_dragon', 'assets/audio/music_dragon.mp3', true, 0.4);
    ['sfx_splash_sm', 'sfx_splash_lg', 'sfx_munch', 'sfx_crystal', 'sfx_shoot', 'sfx_roar',
        'sfx_dragon_hit', 'sfx_flyfish', 'sfx_bug', 'sfx_pearl', 'sfx_fire', 'sfx_victory'].forEach(k =>
            AssetLoader.loadAudio(k, `assets/audio/${k}.mp3`, false, 0.5));
}
loadAllAssets();

// ---- CANVAS ----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resizeCanvas();
window.addEventListener('resize', () => { resizeCanvas(); water.resize(); fishes.forEach(f => { f.canvasW = canvas.width; f.canvasH = canvas.height; }); });

const water = new WaterSystem(canvas, ctx);
water.init();

// ---- STATE ----
const GP = { MENU: 'menu', NORMAL: 'normal', COUNTDOWN: 'countdown', FISH_SELECT: 'fish_select', DRAGON_FIGHT: 'dragon_fight', VICTORY: 'victory' };
const state = { phase: GP.MENU, pearls: 0, food: 20, level: 1, feedCount: 0, feedGoal: 10, dragonDefeated: 0, soundOn: true };

let fishes = [], foodPellets = [], bugs = [], sharks = [], iceDarts = [], sparklePearls = [];
let dragon = null, controlledFish = null, currentMusic = null;
const mouse = { x: 0, y: 0, down: false };
let launcherActive = false, launcherStart = { x: 0, y: 0 };

// Screen shake
let shakeTimer = 0, shakeBig = false;
function triggerShake(big) {
    shakeBig = big;
    shakeTimer = big ? 25 : 8;
    document.body.classList.add(big ? 'screen-shake-big' : 'screen-shake');
    setTimeout(() => document.body.classList.remove('screen-shake', 'screen-shake-big'), big ? 400 : 150);
}

// Water blood hue
let waterBloodHue = 0;

// Background
let bgStars = [], bgClouds = [];
for (let i = 0; i < 80; i++) bgStars.push({ x: Math.random() * 2000, y: Math.random() * 800, r: 0.5 + Math.random() * 1.5, twinkle: Math.random() * Math.PI * 2 });
for (let i = 0; i < 5; i++) bgClouds.push({ x: Math.random() * 2000, y: 40 + Math.random() * 150, w: 80 + Math.random() * 120, h: 25 + Math.random() * 20, speed: 0.1 + Math.random() * 0.3 });

let countdownTimer = 0, countdownValue = 5, victoryTimer = 0, bugSpawnTimer = 0, sharkSpawnTimer = 0;

// ---- MUSIC ----
function switchMusic(k) { if (currentMusic === k) return; if (currentMusic) AssetLoader.stopAudio(currentMusic); currentMusic = k; AssetLoader.playAudio(k, state.soundOn); }

// ---- EVENTS ----
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-sound').addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    document.getElementById('btn-sound').textContent = state.soundOn ? '🔊' : '🔇';
    if (!state.soundOn && currentMusic) AssetLoader.stopAudio(currentMusic);
    else if (state.soundOn && currentMusic) AssetLoader.playAudio(currentMusic, true);
});

canvas.addEventListener('mousedown', e => { e.preventDefault(); mouse.x = e.clientX; mouse.y = e.clientY; mouse.down = true; handleClick(e.clientX, e.clientY); });
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mouseup', e => { mouse.down = false; if (launcherActive) { launchFood(e.clientX, e.clientY); launcherActive = false; } });
canvas.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; mouse.x = t.clientX; mouse.y = t.clientY; mouse.down = true; handleClick(t.clientX, t.clientY); }, { passive: false });
canvas.addEventListener('touchmove', e => { const t = e.touches[0]; mouse.x = t.clientX; mouse.y = t.clientY; }, { passive: false });
canvas.addEventListener('touchend', e => { mouse.down = false; if (launcherActive) { launchFood(mouse.x, mouse.y); launcherActive = false; } });

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    state.phase = GP.NORMAL; state.pearls = 0; state.food = 20; state.level = 1; state.feedCount = 0;
    fishes = []; foodPellets = []; bugs = []; sharks = []; iceDarts = []; sparklePearls = [];
    dragon = null; controlledFish = null;
    spawnFish('spike'); spawnFish('glimmer'); spawnFish('zoom');
    for (let i = 0; i < 6; i++) bugs.push(new FlyingBug(canvas.width, water.START_Y));
    water.setDragonMode(false); switchMusic('music_normal'); updateHUD();
}

function spawnFish(type) {
    const x = 100 + Math.random() * (canvas.width - 200);
    const y = water.START_Y + 60 + Math.random() * (water.END_Y - water.START_Y - 120);
    fishes.push(new Fish(type, x, y, canvas.width, canvas.height));
}

function handleClick(mx, my) {
    if (state.phase === GP.NORMAL) {
        for (const fish of fishes) {
            if (fish.joy >= 100 && fish.isClickedInWater(mx, my)) {
                if (fish.activateFlyFish(water)) { AssetLoader.playAudio('sfx_flyfish', state.soundOn); return; }
            }
        }
        if (my < water.START_Y && state.food > 0) { launcherActive = true; launcherStart = { x: mx, y: my }; }
        else if (state.food > 0) { foodPellets.push(new FoodPellet(mx, my, 0, 1)); state.food--; AssetLoader.playAudio('sfx_splash_sm', state.soundOn); updateHUD(); }
    } else if (state.phase === GP.FISH_SELECT) {
        // Player picks a fish to control
        for (const fish of fishes) {
            if (fish.isClickedInWater(mx, my)) {
                controlledFish = fish;
                state.phase = GP.DRAGON_FIGHT;
                document.getElementById('fish-select-prompt').classList.add('hidden');
                document.getElementById('dragon-hp-bar').classList.remove('hidden');
                return;
            }
        }
    } else if (state.phase === GP.DRAGON_FIGHT) {
        // Tap to move controlled fish / throw ice dart towards dragon
        if (controlledFish && dragon) {
            if (my < water.START_Y && controlledFish.hunger >= 10) {
                // Throw ice dart upward toward dragon
                const dx = dragon.x - controlledFish.x;
                const dy = dragon.y - controlledFish.y;
                const angle = Math.atan2(dy, dx);
                iceDarts.push(new IceDart(controlledFish.x, controlledFish.y, Math.cos(angle) * 10, Math.sin(angle) * 10));
                controlledFish.hunger = Math.max(0, controlledFish.hunger - 5);
                AssetLoader.playAudio('sfx_shoot', state.soundOn);
            } else {
                // Move fish toward tap point
                controlledFish.targetX = mx;
                controlledFish.targetY = Math.max(water.START_Y + 20, Math.min(water.END_Y - 20, my));
            }
        }
        // Activate special power with double-tap on own fish
        if (controlledFish && Math.abs(mx - controlledFish.x) < 40 && Math.abs(my - controlledFish.y) < 40) {
            activateFishPower(controlledFish);
        }
    }
}

function activateFishPower(fish) {
    if (fish.fightCooldown > 0 || fish.hunger < 20) return;
    fish.fightCooldown = 180;
    fish.hunger = Math.max(0, fish.hunger - 25);
    const dmg = { spike: 30, glimmer: 0, zoom: 40 }[fish.type] || 20;

    if (fish.type === 'spike') {
        // Electric thunderbolt!
        if (dragon) dragon.hit(dmg);
        triggerShake(true);
        fish.abilityFx.push({ type: 'shockwave', x: fish.x, y: fish.y, radius: 10, maxRadius: 300, alpha: 1 });
        // Screen flash
        fish.abilityFx.push({ type: 'flash', x: canvas.width / 2, y: canvas.height / 2, radius: 50, maxRadius: canvas.width, alpha: 0.8 });
    } else if (fish.type === 'glimmer') {
        // Shield glow — makes all fish invulnerable briefly
        fish.abilityFx.push({ type: 'flash', x: fish.x, y: fish.y, radius: 20, maxRadius: 200, alpha: 1 });
        fishes.forEach(f => { f.shielded = true; f.shieldTimer = 120; });
    } else if (fish.type === 'zoom') {
        // Super fast jump, bite dragon, splash back!
        if (dragon) {
            fish.flyFishMode = true;
            fish.flyX = fish.x; fish.flyY = fish.y;
            fish.flyVx = (dragon.x - fish.x) * 0.05;
            fish.flyVy = -15;
            fish.flyFishTimer = 90;
            fish.zoomBiteTarget = dragon;
            dragon.hit(dmg);
            triggerShake(false);
        }
    }
}

function launchFood(endX, endY) {
    if (state.food <= 0) return;
    const dx = launcherStart.x - endX, dy = launcherStart.y - endY;
    const power = Math.min(Math.hypot(dx, dy) * 0.08, 12);
    const angle = Math.atan2(dy, dx);
    foodPellets.push(new FoodPellet(launcherStart.x, launcherStart.y, Math.cos(angle) * power, Math.sin(angle) * power));
    state.food--; AssetLoader.playAudio('sfx_splash_sm', state.soundOn); updateHUD();
}

// ---- UPDATE ----
function update() {
    water.update();
    if (waterBloodHue > 0) waterBloodHue = Math.max(0, waterBloodHue - 0.003);

    if (state.phase === GP.NORMAL) updateNormal();
    else if (state.phase === GP.COUNTDOWN) updateCountdown();
    else if (state.phase === GP.DRAGON_FIGHT || state.phase === GP.FISH_SELECT) updateDragonFight();
    else if (state.phase === GP.VICTORY) updateVictory();

    for (let i = sparklePearls.length - 1; i >= 0; i--) { sparklePearls[i].update(); if (!sparklePearls[i].alive) sparklePearls.splice(i, 1); }
    for (const c of bgClouds) { c.x += c.speed; if (c.x > canvas.width + 200) c.x = -200; }

    // Shield timers
    fishes.forEach(f => { if (f.shieldTimer > 0) { f.shieldTimer--; if (f.shieldTimer <= 0) f.shielded = false; } });
}

function updateNormal() {
    for (let i = foodPellets.length - 1; i >= 0; i--) { foodPellets[i].update(water); if (!foodPellets[i].alive) foodPellets.splice(i, 1); }
    for (const fish of fishes) {
        fish.update(water, foodPellets, bugs);
        if (fish.hunger > 99 && Math.random() < 0.01) { state.pearls++; for (let i = 0; i < 3; i++) sparklePearls.push(new SparklePearl(fish.x, fish.y)); }
    }
    const prev = state.feedCount;
    state.feedCount = fishes.reduce((s, f) => s + Math.floor(f.joy / 20), 0);
    if (state.feedCount > prev) { state.pearls += state.feedCount - prev; updateHUD(); }

    for (let i = bugs.length - 1; i >= 0; i--) { bugs[i].update(); if (!bugs[i].alive) { state.pearls += 5; for (let k = 0; k < 5; k++) sparklePearls.push(new SparklePearl(bugs[i].x, bugs[i].y)); bugs.splice(i, 1); updateHUD(); } }
    bugSpawnTimer++; if (bugSpawnTimer > 300 && bugs.length < 8) { bugs.push(new FlyingBug(canvas.width, water.START_Y)); bugSpawnTimer = 0; }
    if (state.food < 5 && Math.random() < 0.005) { state.food += 5; updateHUD(); }

    // Sharks
    sharkSpawnTimer++;
    if (sharkSpawnTimer > Math.max(400, 900 - state.level * 80) && sharks.length < 2 + Math.floor(state.level / 2)) {
        sharks.push(new Shark(canvas.width, water.START_Y, water.END_Y)); sharkSpawnTimer = 0;
    }
    for (let i = sharks.length - 1; i >= 0; i--) {
        sharks[i].update(fishes, water);
        if (sharks[i].phase === 'hunting') for (const f of fishes) if (sharks[i].isNearFish(f) && f.canFight()) { f.fightShark(sharks[i], water); AssetLoader.playAudio('sfx_splash_lg', state.soundOn); }
        if (!sharks[i].alive) { if (sharks[i].hp <= 0) { state.pearls += 15; for (let k = 0; k < 10; k++) sparklePearls.push(new SparklePearl(sharks[i].x, sharks[i].y)); updateHUD(); } sharks.splice(i, 1); }
    }

    // Dragon trigger
    const totalJoy = fishes.reduce((s, f) => s + f.joy, 0);
    if (totalJoy >= state.feedGoal * 20 && state.dragonDefeated < state.level) startDragonCountdown();
}

function startDragonCountdown() {
    state.phase = GP.COUNTDOWN;
    countdownValue = 5; countdownTimer = 0;
    water.setDragonMode(true); switchMusic('music_dragon');
    AssetLoader.playAudio('sfx_roar', state.soundOn);
    document.getElementById('dragon-countdown').classList.remove('hidden');
    for (const s of sharks) s.phase = 'fleeing';
}

function updateCountdown() {
    countdownTimer++;
    if (countdownTimer % 60 === 0) {
        countdownValue--;
        document.getElementById('countdown-number').textContent = countdownValue;
        triggerShake(false);
    }
    if (countdownValue <= 0) {
        document.getElementById('dragon-countdown').classList.add('hidden');
        dragon = new Dragon(canvas.width, canvas.height, state.level);
        state.phase = GP.FISH_SELECT;
        document.getElementById('fish-select-prompt').classList.remove('hidden');
    }
}

function updateDragonFight() {
    if (dragon) {
        dragon.update(water);
        // Update dragon HP bar UI
        const hpPct = Math.max(0, dragon.hp / dragon.maxHp * 100);
        document.getElementById('dragon-hp-fill').style.width = hpPct + '%';
        document.getElementById('dragon-hp-text').textContent = Math.ceil(hpPct) + '%';

        // Check fireballs hitting water — screen shake + blood
        for (const fb of dragon.fireballs) {
            if (fb.hitWater) { fb.hitWater = false; triggerShake(true); waterBloodHue = 0; /* fire splash, no blood */ }
        }
        // Fireballs near fish — scatter them!
        for (const fb of dragon.fireballs) {
            if (!fb.alive) continue;
            for (const fish of fishes) {
                if (fish.shielded) continue;
                const dist = Math.hypot(fb.x - fish.x, fb.y - fish.y);
                if (dist < 60) { fish.vx += (fish.x - fb.x) * 0.3; fish.vy += (fish.y - fb.y) * 0.2; }
            }
            for (const shark of sharks) {
                const dist = Math.hypot(fb.x - shark.x, fb.y - shark.y);
                if (dist < 60) shark.vx += (shark.x - fb.x) * 0.3;
            }
        }

        if (!dragon.alive) {
            state.dragonDefeated++; state.phase = GP.VICTORY; victoryTimer = 300;
            const bonus = 50 + state.level * 20; state.pearls += bonus;
            AssetLoader.playAudio('sfx_victory', state.soundOn);
            document.getElementById('dragon-hp-bar').classList.add('hidden');
            document.getElementById('victory-banner').classList.remove('hidden');
            document.getElementById('victory-pearls').textContent = `+${bonus} Sparkle Pearls!`;
            for (let i = 0; i < 40; i++) sparklePearls.push(new SparklePearl(dragon.x + (Math.random() - 0.5) * 200, dragon.y + (Math.random() - 0.5) * 100));
            dragon = null; controlledFish = null; updateHUD();
        }
    }

    // Dragon blood → red water
    if (dragon) {
        for (const b of dragon.bloodDrops) {
            if (b.y >= water.START_Y && b.alpha > 0.5) waterBloodHue = Math.min(0.25, waterBloodHue + 0.03);
        }
    }

    // Ice darts
    for (let i = iceDarts.length - 1; i >= 0; i--) {
        iceDarts[i].update();
        if (dragon && iceDarts[i].alive) {
            const dist = Math.hypot(iceDarts[i].x - dragon.x, iceDarts[i].y - dragon.y);
            if (dist < 70) { dragon.hit(12 + state.level * 2); iceDarts[i].alive = false; AssetLoader.playAudio('sfx_dragon_hit', state.soundOn); waterBloodHue = Math.min(0.25, waterBloodHue + 0.05); triggerShake(false); for (let k = 0; k < 5; k++) sparklePearls.push(new SparklePearl(iceDarts[i].x, iceDarts[i].y)); }
        }
        if (!iceDarts[i].alive) iceDarts.splice(i, 1);
    }

    // Controlled fish movement
    if (controlledFish && state.phase === GP.DRAGON_FIGHT) {
        // Other fish follow loosely
        for (const f of fishes) {
            if (f === controlledFish) continue;
            const dx = controlledFish.x + (Math.random() - 0.5) * 80 - f.x;
            const dy = controlledFish.y + (Math.random() - 0.5) * 40 - f.y;
            f.vx += dx * 0.003; f.vy += dy * 0.003;
        }
    }

    // Food still works during dragon fight
    for (let i = foodPellets.length - 1; i >= 0; i--) { foodPellets[i].update(water); if (!foodPellets[i].alive) foodPellets.splice(i, 1); }
    for (const fish of fishes) fish.update(water, foodPellets, bugs);
}

function updateVictory() {
    victoryTimer--;
    if (victoryTimer <= 0) {
        document.getElementById('victory-banner').classList.add('hidden');
        state.phase = GP.NORMAL; state.level++; state.feedGoal += 5;
        state.food = Math.max(state.food, 20); water.setDragonMode(false);
        iceDarts = []; switchMusic('music_normal');
        for (let i = 0; i < 4; i++) bugs.push(new FlyingBug(canvas.width, water.START_Y));
        updateHUD();
    }
}

// ---- DRAW ----
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    for (const bug of bugs) bug.draw(ctx);
    for (const fish of fishes) if (fish.flyFishMode) fish.draw(ctx);
    if (dragon) dragon.draw(ctx);
    for (const p of foodPellets) if (!p.inWater) p.draw(ctx);

    water.draw();

    // Blood-red water overlay
    if (waterBloodHue > 0) {
        ctx.save();
        ctx.globalAlpha = waterBloodHue;
        ctx.fillStyle = 'rgba(180, 20, 20, 0.3)';
        ctx.fillRect(0, water.START_Y, canvas.width, water.END_Y - water.START_Y);
        ctx.restore();
    }

    for (const shark of sharks) shark.draw(ctx);
    for (const fish of fishes) {
        if (!fish.flyFishMode) fish.draw(ctx);
        // Shield glow
        if (fish.shielded) {
            ctx.save(); ctx.globalAlpha = 0.2 + Math.sin(Date.now() * 0.01) * 0.1;
            ctx.beginPath(); ctx.arc(fish.x, fish.y, fish.width * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd54f'; ctx.fill(); ctx.restore();
        }
        // Controlled fish indicator
        if (fish === controlledFish) {
            ctx.save(); ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.005) * 0.2;
            ctx.beginPath(); ctx.arc(fish.x, fish.y, fish.width * 0.7, 0, Math.PI * 2);
            ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        }
    }
    for (const p of foodPellets) if (p.inWater) p.draw(ctx);
    for (const d of iceDarts) d.draw(ctx);
    for (const sp of sparklePearls) sp.draw(ctx);

    if (launcherActive && mouse.down) drawLauncherPreview();
    if (state.phase === GP.DRAGON_FIGHT) drawDragonFightHUD();
    if (sharks.length > 0 && state.phase === GP.NORMAL) drawSharkWarning();
}

function drawBackground() {
    const isDragon = state.phase === GP.COUNTDOWN || state.phase === GP.FISH_SELECT || state.phase === GP.DRAGON_FIGHT;
    const skyImg = AssetLoader.getImage(isDragon ? 'bg_sky_dragon' : 'bg_sky_normal');
    if (skyImg) { ctx.drawImage(skyImg, 0, 0, canvas.width, water.START_Y); }
    else {
        let g; if (isDragon) { g = ctx.createLinearGradient(0, 0, 0, water.START_Y); g.addColorStop(0, '#1a0a2e'); g.addColorStop(0.5, '#2d1b4e'); g.addColorStop(1, '#3e1f5c'); }
        else { g = ctx.createLinearGradient(0, 0, 0, water.START_Y); g.addColorStop(0, '#0a1628'); g.addColorStop(0.4, '#0d2137'); g.addColorStop(0.7, '#1a3a5c'); g.addColorStop(1, '#2d5a7b'); }
        ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, water.START_Y);
    }
    for (const s of bgStars) { s.twinkle += 0.02; const a = 0.3 + Math.sin(s.twinkle) * 0.3; ctx.beginPath(); ctx.arc(s.x % canvas.width, s.y % (water.START_Y || 400), s.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(200,220,255,${a})`; ctx.fill(); }
    if (!isDragon) {
        const mx = canvas.width * 0.8, my = 80;
        ctx.beginPath(); ctx.arc(mx, my, 30, 0, Math.PI * 2);
        const mg = ctx.createRadialGradient(mx - 5, my - 5, 5, mx, my, 30); mg.addColorStop(0, 'rgba(255,255,230,0.9)'); mg.addColorStop(1, 'rgba(200,200,180,0.1)');
        ctx.fillStyle = mg; ctx.fill();
    }
    for (const c of bgClouds) { ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2); ctx.fillStyle = isDragon ? 'rgba(80,30,100,0.3)' : 'rgba(100,140,180,0.15)'; ctx.fill(); }
    drawSilhouette(isDragon);
}

function drawSilhouette(isDragon) {
    const baseY = water.START_Y;
    ctx.beginPath(); ctx.moveTo(0, baseY);
    for (let i = 0; i <= 20; i++) { const x = i * (canvas.width / 20); ctx.lineTo(x, baseY - 20 - Math.sin(i * 0.8) * 25 - Math.sin(i * 1.7) * 15); }
    ctx.lineTo(canvas.width, baseY); ctx.closePath();
    ctx.fillStyle = isDragon ? 'rgba(30,10,40,0.6)' : 'rgba(10,25,50,0.5)'; ctx.fill();
}

function drawLauncherPreview() {
    const dx = launcherStart.x - mouse.x, dy = launcherStart.y - mouse.y, power = Math.min(Math.hypot(dx, dy) * 0.08, 12);
    ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(launcherStart.x, launcherStart.y); ctx.lineTo(mouse.x, mouse.y);
    ctx.strokeStyle = `rgba(255,152,0,${0.4 + power * 0.04})`; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
}

function drawDragonFightHUD() {
    ctx.save(); ctx.font = '14px Outfit,sans-serif'; ctx.fillStyle = 'rgba(200,230,255,0.7)'; ctx.textAlign = 'center';
    if (controlledFish) {
        const name = controlledFish.name;
        const power = { spike: '⚡ TAP FISH for THUNDER!', glimmer: '✨ TAP FISH for SHIELD!', zoom: '💨 TAP FISH for BITE ATTACK!' }[controlledFish.type];
        ctx.fillText(`🐟 Controlling ${name} • TAP WATER to move • TAP SKY to throw ice • ${power}`, canvas.width / 2, canvas.height - 20);
        if (controlledFish.hunger < 20) { ctx.font = 'bold 16px Fredoka One,cursive'; ctx.fillStyle = '#f44336'; ctx.fillText('⚠️ Feed your fish! Low on energy!', canvas.width / 2, canvas.height - 50); }
    }
    ctx.restore();
}

function drawSharkWarning() {
    const h = sharks.filter(s => s.phase === 'hunting');
    if (!h.length) return;
    ctx.save(); ctx.font = 'bold 14px Fredoka One,cursive'; ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(244,67,54,${0.5 + Math.sin(Date.now() * 0.006) * 0.3})`;
    ctx.fillText(`⚠️ ${h.length} SHARK${h.length > 1 ? 'S' : ''} ATTACKING! Feed fish to fight!`, canvas.width / 2, water.START_Y - 10);
    ctx.restore();
}

function updateHUD() {
    document.getElementById('pearl-count').textContent = state.pearls;
    document.getElementById('food-count').textContent = state.food;
    document.getElementById('level-text').textContent = `Level ${state.level}`;
}

function updateFishPanel() {
    const panel = document.getElementById('fish-panel'); let found = false;
    if (state.phase === GP.NORMAL || state.phase === GP.DRAGON_FIGHT) {
        for (const fish of fishes) {
            if (!fish.flyFishMode && Math.abs(mouse.x - fish.x) < 60 && Math.abs(mouse.y - fish.y) < 60) {
                panel.classList.remove('hidden');
                document.getElementById('fish-panel-name').textContent = `${fish.name} (${fish.type})`;
                document.getElementById('fish-hunger-bar').style.width = `${fish.hunger}%`;
                document.getElementById('fish-joy-bar').style.width = `${fish.joy}%`;
                let s = fish.fighting ? '⚔️ Fighting!' : fish.joy >= 100 ? '🚀 Fly Fish Ready!' : fish.hunger < 20 ? '😢 Hungry!' : fish.hunger > 80 ? '😊 Battle ready!' : '🐟 Swimming...';
                document.getElementById('fish-panel-status').textContent = s;
                found = true; break;
            }
        }
    }
    if (!found) panel.classList.add('hidden');
}

// ---- GAME LOOP ----
function gameLoop(ts) {
    if (state.phase !== GP.MENU) { update(); draw(); updateFishPanel(); }
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
