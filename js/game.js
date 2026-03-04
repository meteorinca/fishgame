/* ============================================
   THE GREAT CRYSTAL FISH DEFENSE - GAME ENGINE
   Main game loop, state management, and controls
   ============================================ */

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
    // Update fish bounds
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
    feedGoal: 10, // feeds to trigger dragon event
    dragonDefeated: 0,
    soundOn: true
};

// ---- ENTITY ARRAYS ----
let fishes = [];
let foodPellets = [];
let bugs = [];
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
    iceCrystals = [];
    crystalProjectiles = [];
    sparklePearls = [];
    dragon = null;
    submarine = null;

    // Spawn initial fish
    spawnFish('spike');
    spawnFish('glimmer');
    spawnFish('zoom');

    // Spawn some bugs
    for (let i = 0; i < 6; i++) {
        bugs.push(new FlyingBug(canvas.width, water.START_Y));
    }

    water.setDragonMode(false);
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
                    return;
                }
            }
        }

        // Start launcher (food slingshot)
        if (my < water.START_Y && state.food > 0) {
            launcherActive = true;
            launcherStart = { x: mx, y: my };
        } else if (state.food > 0) {
            // Direct drop food into water
            const pellet = new FoodPellet(mx, my, 0, 1);
            foodPellets.push(pellet);
            state.food--;
            updateHUD();
        }
    } else if (state.phase === GamePhase.DRAGON_FIGHT) {
        // Shoot crystal
        if (submarine) {
            const proj = submarine.shootCrystal();
            if (proj) {
                crystalProjectiles.push(new CrystalProjectile(proj.x, proj.y, proj.vx, proj.vy));
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
    updateHUD();
}

function handleSpacebar() {
    if (state.phase === GamePhase.DRAGON_FIGHT && submarine) {
        const proj = submarine.shootCrystal();
        if (proj) {
            crystalProjectiles.push(new CrystalProjectile(proj.x, proj.y, proj.vx, proj.vy));
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
        // Check if fish ate — reward pearls
        if (fish.hunger > 99 && Math.random() < 0.01) {
            state.pearls += 1;
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

    // Dragon event trigger
    const totalJoy = fishes.reduce((sum, f) => sum + f.joy, 0);
    if (totalJoy >= state.feedGoal * 20 && state.dragonDefeated < state.level) {
        startDragonEvent();
    }
}

function startDragonEvent() {
    state.phase = GamePhase.DRAGON_INTRO;
    dragonIntroTimer = 180; // 3 seconds
    water.setDragonMode(true);
    document.getElementById('dragon-banner').classList.remove('hidden');
}

function updateDragonIntro() {
    dragonIntroTimer--;
    if (dragonIntroTimer <= 0) {
        document.getElementById('dragon-banner').classList.add('hidden');
        state.phase = GamePhase.DRAGON_FIGHT;
        dragon = new Dragon(canvas.width, canvas.height);
        submarine = new Submarine(canvas.width / 2, water.START_Y + 60);

        // Spawn ice crystals in water
        for (let i = 0; i < 5; i++) {
            const cx = 80 + Math.random() * (canvas.width - 160);
            const cy = water.START_Y + 40 + Math.random() * (water.END_Y - water.START_Y - 80);
            iceCrystals.push(new IceCrystal(cx, cy));
        }
    }
}

function updateDragonFight() {
    // Submarine
    if (submarine) {
        submarine.update(keys, water);
    }

    // Dragon
    if (dragon) {
        dragon.update(water);

        // Check fire zone vs submarine
        const fireZone = dragon.getFireZone();
        if (fireZone && submarine) {
            if (submarine.x > fireZone.x && submarine.x < fireZone.x + fireZone.width &&
                submarine.y > fireZone.y && submarine.y < fireZone.y + fireZone.height) {
                // Push submarine away
                submarine.y += 5;
            }
        }

        if (!dragon.alive) {
            // Dragon defeated!
            state.dragonDefeated++;
            state.phase = GamePhase.VICTORY;
            victoryTimer = 300;
            const bonus = 50 + state.level * 20;
            state.pearls += bonus;
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

    // Ice crystals
    for (let i = iceCrystals.length - 1; i >= 0; i--) {
        iceCrystals[i].update();

        // Collect with submarine
        if (submarine) {
            const dist = Math.hypot(iceCrystals[i].x - submarine.x, iceCrystals[i].y - submarine.y);
            if (dist < 30) {
                submarine.collectCrystal();
                iceCrystals.splice(i, 1);
                continue;
            }
        }
    }

    // Crystal projectiles
    for (let i = crystalProjectiles.length - 1; i >= 0; i--) {
        crystalProjectiles[i].update();

        // Hit dragon
        if (dragon && crystalProjectiles[i].alive) {
            const dist = Math.hypot(
                crystalProjectiles[i].x - dragon.x,
                crystalProjectiles[i].y - dragon.y
            );
            if (dist < 60) {
                dragon.hit(15);
                crystalProjectiles[i].alive = false;
                // Steam particles
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

    // Respawn crystals
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

        // Spawn more bugs
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
}

function drawBackground() {
    const isDragon = state.phase === GamePhase.DRAGON_INTRO ||
        state.phase === GamePhase.DRAGON_FIGHT;

    // Sky gradient
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
        const moonX = canvas.width * 0.8;
        const moonY = 80;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 30, 0, Math.PI * 2);
        const moonGrad = ctx.createRadialGradient(moonX - 5, moonY - 5, 5, moonX, moonY, 30);
        moonGrad.addColorStop(0, 'rgba(255, 255, 230, 0.9)');
        moonGrad.addColorStop(1, 'rgba(200, 200, 180, 0.1)');
        ctx.fillStyle = moonGrad;
        ctx.fill();

        // Moon glow
        ctx.beginPath();
        ctx.arc(moonX, moonY, 60, 0, Math.PI * 2);
        const moonGlow = ctx.createRadialGradient(moonX, moonY, 30, moonX, moonY, 60);
        moonGlow.addColorStop(0, 'rgba(255, 255, 200, 0.1)');
        moonGlow.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = moonGlow;
        ctx.fill();
    }

    // Clouds
    ctx.save();
    for (const cloud of bgClouds) {
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.w / 2, cloud.h / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = isDragon ? 'rgba(80, 30, 100, 0.3)' : 'rgba(100, 140, 180, 0.15)';
        ctx.fill();
    }
    ctx.restore();

    // Distant mountains / environment silhouette
    drawSilhouette(isDragon);
}

function drawSilhouette(isDragon) {
    const baseY = water.START_Y;
    ctx.beginPath();
    ctx.moveTo(0, baseY);

    // Jagged landscape
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

    // Gothic towers during dragon phase
    if (isDragon) {
        const towers = [0.15, 0.35, 0.55, 0.75, 0.9];
        for (const frac of towers) {
            const tx = canvas.width * frac;
            const th = 40 + Math.sin(frac * 20) * 30;
            const tw = 12 + Math.sin(frac * 15) * 6;

            ctx.fillStyle = 'rgba(20, 5, 30, 0.7)';
            ctx.fillRect(tx - tw / 2, baseY - th, tw, th);

            // Pointed top
            ctx.beginPath();
            ctx.moveTo(tx - tw / 2 - 3, baseY - th);
            ctx.lineTo(tx, baseY - th - 15 - Math.random() * 5);
            ctx.lineTo(tx + tw / 2 + 3, baseY - th);
            ctx.closePath();
            ctx.fill();

            // Tiny window
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

    // Draw line
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(launcherStart.x, launcherStart.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.strokeStyle = `rgba(255, 152, 0, ${0.4 + power * 0.04})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Power indicator
    ctx.beginPath();
    ctx.arc(launcherStart.x, launcherStart.y, 8 + power, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 152, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Trajectory preview
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

// ============================================
// HUD UPDATE
// ============================================
function updateHUD() {
    document.getElementById('pearl-count').textContent = state.pearls;
    document.getElementById('food-count').textContent = state.food;
    document.getElementById('level-text').textContent = `Level ${state.level}`;
}

// Update fish panel on hover (simplified — shows first fish near mouse)
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
                if (fish.joy >= 100) statusText = '🚀 Ready for Fly Fish Mode!';
                else if (fish.hunger < 20) statusText = '😢 Very hungry!';
                else if (fish.hunger > 80) statusText = '😊 Well fed!';
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
