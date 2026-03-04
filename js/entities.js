/* ============================================
   GAME ENTITIES
   Fish, Food Pellets, Ice Crystals, Dragon, Submarine
   ============================================ */

// ---- FOOD PELLET ----
class FoodPellet {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.gravity = 0.25;
        this.radius = 6;
        this.alive = true;
        this.inWater = false;
        this.sinking = false;
        this.sinkSpeed = 0.5;
        this.color = '#ff9800';
        this.trail = [];
    }

    update(waterSystem) {
        if (!this.alive) return;

        // Trail
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > 12) this.trail.shift();
        for (const t of this.trail) t.alpha -= 0.08;

        if (!this.inWater) {
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;

            // Check water collision
            const surfaceY = waterSystem.getSurfaceY(this.x);
            if (this.y >= surfaceY) {
                this.inWater = true;
                this.sinking = true;
                waterSystem.splashAtX(this.x, this.vy * 3);
                this.vy = this.sinkSpeed;
                this.vx *= 0.1;
            }
        } else {
            // Slow sink
            this.vy = this.sinkSpeed;
            this.vx *= 0.98;
            this.x += this.vx;
            this.y += this.vy;

            if (this.y > waterSystem.END_Y + 30) {
                this.alive = false;
            }
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        // Trail
        for (const t of this.trail) {
            if (t.alpha > 0) {
                ctx.save();
                ctx.globalAlpha = t.alpha * 0.4;
                ctx.beginPath();
                ctx.arc(t.x, t.y, this.radius * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.restore();
            }
        }

        // Pellet
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(this.x - 2, this.y - 2, 1, this.x, this.y, this.radius);
        grad.addColorStop(0, '#ffe082');
        grad.addColorStop(1, this.color);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    }
}

// ---- ICE CRYSTAL ----
class IceCrystal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.alive = true;
        this.bobPhase = Math.random() * Math.PI * 2;
        this.bobSpeed = 0.03;
        this.baseY = y;
        this.sparkle = 0;
    }

    update() {
        if (!this.alive) return;
        this.bobPhase += this.bobSpeed;
        this.y = this.baseY + Math.sin(this.bobPhase) * 8;
        this.sparkle += 0.05;
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Glow
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 200, 255, ${0.15 + Math.sin(this.sparkle) * 0.1})`;
        ctx.fill();

        // Crystal diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.7, 0);
        ctx.lineTo(0, this.radius);
        ctx.lineTo(-this.radius * 0.7, 0);
        ctx.closePath();
        const cGrad = ctx.createLinearGradient(0, -this.radius, 0, this.radius);
        cGrad.addColorStop(0, '#b3e5fc');
        cGrad.addColorStop(0.5, '#4fc3f7');
        cGrad.addColorStop(1, '#0288d1');
        ctx.fillStyle = cGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Sparkle dots
        const sparkleAngle = this.sparkle * 3;
        for (let i = 0; i < 3; i++) {
            const angle = sparkleAngle + (i * Math.PI * 2 / 3);
            const sx = Math.cos(angle) * this.radius * 1.3;
            const sy = Math.sin(angle) * this.radius * 1.3;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fill();
        }

        ctx.restore();
    }
}

// ---- FISH ----
class Fish {
    constructor(type, x, y, canvasW, canvasH) {
        this.type = type; // 'spike', 'glimmer', 'zoom'
        this.x = x;
        this.y = y;
        this.canvasW = canvasW;
        this.canvasH = canvasH;
        this.width = 50;
        this.height = 30;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.baseSpeed = 1;
        this.facingRight = this.vx >= 0;

        this.hunger = 50; // 0-100
        this.joy = 0;    // 0-100
        this.hungerDecay = 0.015;
        this.alive = true;

        this.flyFishMode = false;
        this.flyFishTimer = 0;
        this.flyFishMaxTime = 300; // frames
        this.flyX = 0;
        this.flyY = 0;
        this.flyVx = 0;
        this.flyVy = 0;
        this.flyGravity = 0.3;
        this.bugsCollected = 0;

        this.glowPhase = 0;
        this.swimPhase = Math.random() * Math.PI * 2;

        // Personality specifics
        switch (type) {
            case 'spike':
                this.name = 'Spike';
                this.color1 = '#4caf50';
                this.color2 = '#2e7d32';
                this.spikeColor = '#81c784';
                this.width = 55;
                this.height = 35;
                this.baseSpeed = 0.8;
                this.hungerDecay = 0.025; // hungrier
                break;
            case 'glimmer':
                this.name = 'Glimmer';
                this.color1 = '#ffd54f';
                this.color2 = '#f9a825';
                this.width = 40;
                this.height = 25;
                this.baseSpeed = 1.0;
                this.hungerDecay = 0.012;
                break;
            case 'zoom':
                this.name = 'Zoom';
                this.color1 = '#e91e63';
                this.color2 = '#ad1457';
                this.width = 45;
                this.height = 28;
                this.baseSpeed = 2.0;
                this.hungerDecay = 0.018;
                break;
        }

        this.targetX = null;
        this.targetY = null;
        this.idleTimer = 0;
    }

    feed(amount) {
        this.hunger = Math.min(100, this.hunger + amount);
        this.joy = Math.min(100, this.joy + amount * 0.6);
    }

    update(waterSystem, foodPellets, bugs) {
        if (this.flyFishMode) {
            this._updateFlyFish(waterSystem, bugs);
            return;
        }

        this.swimPhase += 0.08;
        this.hunger = Math.max(0, this.hunger - this.hungerDecay);
        this.glowPhase += 0.05;

        // Joy decays slowly
        if (this.joy < 100) {
            this.joy = Math.max(0, this.joy - 0.003);
        }

        // If joy is full, enable fly fish readiness glow 
        // (actual activation is by clicking)

        // Seek food
        let nearestFood = null;
        let nearestDist = Infinity;
        for (const f of foodPellets) {
            if (!f.alive || !f.inWater) continue;
            const dist = Math.hypot(f.x - this.x, f.y - this.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestFood = f;
            }
        }

        const waterMinY = waterSystem.START_Y + 20;
        const waterMaxY = waterSystem.END_Y - 20;

        if (nearestFood && nearestDist < 250) {
            // Chase food
            const dx = nearestFood.x - this.x;
            const dy = nearestFood.y - this.y;
            const angle = Math.atan2(dy, dx);
            const speed = this.baseSpeed * 1.5;
            this.vx += Math.cos(angle) * speed * 0.1;
            this.vy += Math.sin(angle) * speed * 0.1;
            this.facingRight = dx > 0;

            // Eat food
            if (nearestDist < 25) {
                nearestFood.alive = false;
                this.feed(20);
            }
        } else {
            // Idle swimming
            this.idleTimer--;
            if (this.idleTimer <= 0) {
                this.targetX = 50 + Math.random() * (this.canvasW - 100);
                this.targetY = waterMinY + 30 + Math.random() * (waterMaxY - waterMinY - 60);
                this.idleTimer = 120 + Math.random() * 180;
            }
            if (this.targetX !== null) {
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                this.vx += dx * 0.002;
                this.vy += dy * 0.002;
                this.facingRight = dx > 0;
            }
        }

        // Damping
        this.vx *= 0.96;
        this.vy *= 0.96;

        // Speed limit
        const maxSpd = this.baseSpeed * 2;
        const spd = Math.hypot(this.vx, this.vy);
        if (spd > maxSpd) {
            this.vx = (this.vx / spd) * maxSpd;
            this.vy = (this.vy / spd) * maxSpd;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Keep in water
        if (this.y < waterMinY) { this.y = waterMinY; this.vy = Math.abs(this.vy) * 0.5; }
        if (this.y > waterMaxY) { this.y = waterMaxY; this.vy = -Math.abs(this.vy) * 0.5; }
        if (this.x < 30) { this.x = 30; this.vx = Math.abs(this.vx); }
        if (this.x > this.canvasW - 30) { this.x = this.canvasW - 30; this.vx = -Math.abs(this.vx); }
    }

    activateFlyFish(waterSystem) {
        if (this.joy < 100 || this.flyFishMode) return false;
        this.flyFishMode = true;
        this.flyFishTimer = this.flyFishMaxTime;
        this.flyX = this.x;
        this.flyY = waterSystem.START_Y;
        this.flyVx = (this.facingRight ? 1 : -1) * (4 + Math.random() * 3);
        this.flyVy = -(8 + Math.random() * 4);
        this.bugsCollected = 0;
        waterSystem.splashAtX(this.x, 120);
        return true;
    }

    _updateFlyFish(waterSystem, bugs) {
        this.flyFishTimer--;
        this.glowPhase += 0.15;

        this.flyVy += this.flyGravity;
        this.flyX += this.flyVx;
        this.flyY += this.flyVy;
        this.facingRight = this.flyVx > 0;

        // Bounce off walls
        if (this.flyX < 30 || this.flyX > this.canvasW - 30) {
            this.flyVx *= -1;
            this.flyX = Math.max(30, Math.min(this.canvasW - 30, this.flyX));
        }

        // Catch bugs
        if (bugs) {
            for (const bug of bugs) {
                if (!bug.alive) continue;
                const dist = Math.hypot(bug.x - this.flyX, bug.y - this.flyY);
                if (dist < 30) {
                    bug.alive = false;
                    this.bugsCollected++;
                }
            }
        }

        // Check if landed back in water
        const surfaceY = waterSystem.getSurfaceY(this.flyX);
        if (this.flyY >= surfaceY && this.flyVy > 0) {
            // Splash down
            waterSystem.splashAtX(this.flyX, 150);
            this.flyFishMode = false;
            this.x = this.flyX;
            this.y = surfaceY + 30;
            this.vx = this.flyVx * 0.3;
            this.vy = 1;
            this.joy = 50; // Reset after flight
            return;
        }

        if (this.flyFishTimer <= 0 && this.flyY < surfaceY) {
            // Force descent
            this.flyVy = Math.abs(this.flyVy) + 2;
        }
    }

    draw(ctx) {
        if (this.flyFishMode) {
            this._drawFlyFish(ctx);
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        if (!this.facingRight) ctx.scale(-1, 1);

        const bodyWobble = Math.sin(this.swimPhase) * 2;

        // Ready glow when joy is full
        if (this.joy >= 100) {
            ctx.beginPath();
            ctx.arc(0, 0, this.width * 0.9, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 215, 0, ${0.15 + Math.sin(this.glowPhase) * 0.1})`;
            ctx.fill();
        }

        // Body
        ctx.beginPath();
        ctx.ellipse(0, bodyWobble, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        const bGrad = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
        bGrad.addColorStop(0, this.color1);
        bGrad.addColorStop(1, this.color2);
        ctx.fillStyle = bGrad;
        ctx.fill();

        // Belly highlight
        ctx.beginPath();
        ctx.ellipse(0, bodyWobble + this.height * 0.1, this.width * 0.35, this.height * 0.25, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fill();

        // Tail
        const tailWag = Math.sin(this.swimPhase * 1.5) * 8;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, bodyWobble);
        ctx.lineTo(-this.width / 2 - 15, bodyWobble - 12 + tailWag);
        ctx.lineTo(-this.width / 2 - 15, bodyWobble + 12 + tailWag);
        ctx.closePath();
        ctx.fillStyle = this.color2;
        ctx.fill();

        // Dorsal fin
        ctx.beginPath();
        ctx.moveTo(-5, bodyWobble - this.height / 2);
        ctx.lineTo(8, bodyWobble - this.height / 2 - 10);
        ctx.lineTo(15, bodyWobble - this.height / 2);
        ctx.closePath();
        ctx.fillStyle = this.color1;
        ctx.fill();

        // Eye
        ctx.beginPath();
        ctx.arc(this.width / 4, bodyWobble - 4, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.width / 4 + 1.5, bodyWobble - 4, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();

        // Type-specific features
        if (this.type === 'spike') {
            // Spines on top
            for (let i = 0; i < 4; i++) {
                const sx = -10 + i * 8;
                ctx.beginPath();
                ctx.moveTo(sx, bodyWobble - this.height / 2);
                ctx.lineTo(sx + 2, bodyWobble - this.height / 2 - 8 - Math.sin(this.swimPhase + i) * 3);
                ctx.lineTo(sx + 4, bodyWobble - this.height / 2);
                ctx.fillStyle = this.spikeColor;
                ctx.fill();
            }
        } else if (this.type === 'glimmer') {
            // Light glow
            const lightR = 20 + Math.sin(this.glowPhase * 2) * 5;
            ctx.beginPath();
            ctx.arc(this.width / 3, bodyWobble, lightR, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 235, 59, ${0.12 + Math.sin(this.glowPhase) * 0.08})`;
            ctx.fill();
        } else if (this.type === 'zoom') {
            // Speed lines when moving fast
            const spd = Math.hypot(this.vx, this.vy);
            if (spd > 1.5) {
                for (let i = 0; i < 3; i++) {
                    const ly = bodyWobble - 8 + i * 8;
                    ctx.beginPath();
                    ctx.moveTo(-this.width / 2 - 10, ly);
                    ctx.lineTo(-this.width / 2 - 10 - spd * 4, ly);
                    ctx.strokeStyle = `rgba(255,255,255,${0.3 - i * 0.08})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }
        }

        ctx.restore();

        // Draw meters above fish
        this._drawMeters(ctx);
    }

    _drawFlyFish(ctx) {
        ctx.save();
        ctx.translate(this.flyX, this.flyY);
        if (!this.facingRight) ctx.scale(-1, 1);

        // Glow aura
        const glowR = this.width * 1.2;
        const glowAlpha = 0.3 + Math.sin(this.glowPhase) * 0.15;
        ctx.beginPath();
        ctx.arc(0, 0, glowR, 0, Math.PI * 2);
        const gGrad = ctx.createRadialGradient(0, 0, this.width * 0.3, 0, 0, glowR);
        gGrad.addColorStop(0, `rgba(255, 215, 0, ${glowAlpha})`);
        gGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gGrad;
        ctx.fill();

        // Particle trail
        for (let i = 0; i < 5; i++) {
            const px = -20 - Math.random() * 30 * (this.facingRight ? 1 : -1);
            const py = (Math.random() - 0.5) * 20;
            ctx.beginPath();
            ctx.arc(px, py, 1 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 200, 50, ${0.3 + Math.random() * 0.4})`;
            ctx.fill();
        }

        // Body (same as normal but brighter)
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color1;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,0,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eye
        ctx.beginPath();
        ctx.arc(this.width / 4, -4, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.width / 4 + 1.5, -4, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();

        // Wings (fly fish!)
        const wingFlap = Math.sin(this.glowPhase * 4) * 15;
        ctx.beginPath();
        ctx.moveTo(-5, -this.height / 2);
        ctx.quadraticCurveTo(-20, -this.height / 2 - 20 - wingFlap, -35, -this.height / 2 + 5);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(5, -this.height / 2);
        ctx.quadraticCurveTo(15, -this.height / 2 - 18 - wingFlap, 30, -this.height / 2 + 5);
        ctx.stroke();

        ctx.restore();
    }

    _drawMeters(ctx) {
        const meterX = this.x - 20;
        const meterY = this.y - this.height / 2 - 22;
        const meterW = 40;
        const meterH = 4;

        // Hunger bar
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(meterX, meterY, meterW, meterH);
        ctx.fillStyle = this.hunger > 30 ? '#ff9800' : '#f44336';
        ctx.fillRect(meterX, meterY, meterW * (this.hunger / 100), meterH);

        // Joy bar
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(meterX, meterY + 6, meterW, meterH);
        const joyGrad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
        joyGrad.addColorStop(0, '#42a5f5');
        joyGrad.addColorStop(0.5, '#ab47bc');
        joyGrad.addColorStop(1, '#ffd54f');
        ctx.fillStyle = joyGrad;
        ctx.fillRect(meterX, meterY + 6, meterW * (this.joy / 100), meterH);

        // Name
        ctx.font = '10px Outfit, sans-serif';
        ctx.fillStyle = 'rgba(200,230,255,0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, meterY - 3);

        // "CLICK ME!" when ready
        if (this.joy >= 100 && !this.flyFishMode) {
            ctx.font = 'bold 11px Fredoka One, cursive';
            ctx.fillStyle = `rgba(255, 215, 0, ${0.6 + Math.sin(this.glowPhase * 2) * 0.4})`;
            ctx.fillText('🚀 FLY!', this.x, meterY - 14);
        }
    }

    isClickedInWater(mx, my) {
        if (this.flyFishMode) return false;
        return Math.abs(mx - this.x) < this.width / 2 + 10 &&
            Math.abs(my - this.y) < this.height / 2 + 10;
    }

    isClickedInAir(mx, my) {
        if (!this.flyFishMode) return false;
        return Math.abs(mx - this.flyX) < this.width / 2 + 15 &&
            Math.abs(my - this.flyY) < this.height / 2 + 15;
    }
}

// ---- FLYING BUG ----
class FlyingBug {
    constructor(canvasW, waterSurfaceY) {
        this.x = Math.random() * canvasW;
        this.y = 40 + Math.random() * (waterSurfaceY - 80);
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.alive = true;
        this.canvasW = canvasW;
        this.waterSurfaceY = waterSurfaceY;
        this.wingPhase = Math.random() * Math.PI * 2;
        this.size = 5 + Math.random() * 4;
    }

    update() {
        if (!this.alive) return;
        this.wingPhase += 0.3;
        this.x += this.vx;
        this.y += this.vy;

        // Random direction changes
        if (Math.random() < 0.02) {
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = (Math.random() - 0.5) * 1.5;
        }

        // Bounce
        if (this.x < 10 || this.x > this.canvasW - 10) this.vx *= -1;
        if (this.y < 20 || this.y > this.waterSurfaceY - 30) this.vy *= -1;
        this.x = Math.max(10, Math.min(this.canvasW - 10, this.x));
        this.y = Math.max(20, Math.min(this.waterSurfaceY - 30, this.y));
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.5, this.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#5d4037';
        ctx.fill();

        // Wings
        const wingAngle = Math.sin(this.wingPhase) * 0.4;
        ctx.beginPath();
        ctx.ellipse(-2, -2, this.size * 0.6, this.size * 0.25, -0.3 + wingAngle, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200,220,255,0.5)';
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(2, -2, this.size * 0.6, this.size * 0.25, 0.3 - wingAngle, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ---- DRAGON ----
class Dragon {
    constructor(canvasW, canvasH) {
        this.canvasW = canvasW;
        this.canvasH = canvasH;
        this.x = canvasW / 2;
        this.y = 80;
        this.width = 160;
        this.height = 120;
        this.alive = true;
        this.hp = 100;
        this.maxHp = 100;
        this.phase = 'entering'; // entering, idle, attacking, frozen, defeated
        this.enterTimer = 0;
        this.attackTimer = 0;
        this.attackCooldown = 180;
        this.attackDuration = 60;
        this.iceLevel = 0;  // 0-100, visual ice buildup
        this.wobble = 0;
        this.breathX = 0;
        this.breathY = 0;
        this.breathing = false;
        this.frozenTimer = 0;
        this.moveDir = 1;
        this.moveSpeed = 1;
    }

    hit(damage) {
        if (this.phase === 'frozen' || this.phase === 'defeated') return;
        this.hp -= damage;
        this.iceLevel = Math.min(100, this.iceLevel + damage * 1.5);
        this.wobble = 10;

        if (this.hp <= 0) {
            this.phase = 'defeated';
            this.frozenTimer = 180;
        }
    }

    update(waterSystem) {
        this.wobble *= 0.9;

        switch (this.phase) {
            case 'entering':
                this.enterTimer++;
                this.y = -150 + this.enterTimer * 1.5;
                if (this.y >= 80) {
                    this.y = 80;
                    this.phase = 'idle';
                }
                break;

            case 'idle':
                // Move left/right
                this.x += this.moveDir * this.moveSpeed;
                if (this.x < 150 || this.x > this.canvasW - 150) {
                    this.moveDir *= -1;
                }
                this.attackTimer++;
                if (this.attackTimer >= this.attackCooldown) {
                    this.phase = 'attacking';
                    this.attackTimer = 0;
                    this.breathX = this.x;
                    this.breathY = this.y + this.height / 2;
                    this.breathing = true;
                }
                // Slight ice melt over time
                this.iceLevel = Math.max(0, this.iceLevel - 0.05);
                break;

            case 'attacking':
                this.x += this.moveDir * this.moveSpeed * 0.3;
                this.attackTimer++;
                this.breathX = this.x;
                this.breathY = this.y + this.height;

                if (this.attackTimer >= this.attackDuration) {
                    this.phase = 'idle';
                    this.attackTimer = 0;
                    this.breathing = false;
                }
                break;

            case 'defeated':
                this.frozenTimer--;
                this.y += 3; // Fall
                if (this.y > waterSystem.START_Y) {
                    waterSystem.splashAtX(this.x, 200);
                    waterSystem.splashAtX(this.x - 40, 150);
                    waterSystem.splashAtX(this.x + 40, 150);
                    this.alive = false;
                }
                break;
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x + Math.sin(this.wobble) * this.wobble, this.y);

        // Wings
        const wingFlap = Math.sin(Date.now() * 0.005) * 10;
        ctx.beginPath();
        ctx.moveTo(-30, -10);
        ctx.quadraticCurveTo(-this.width * 0.6, -60 - wingFlap, -this.width * 0.8, 10);
        ctx.lineTo(-30, 10);
        ctx.closePath();
        ctx.fillStyle = '#b71c1c';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(30, -10);
        ctx.quadraticCurveTo(this.width * 0.6, -60 - wingFlap, this.width * 0.8, 10);
        ctx.lineTo(30, 10);
        ctx.closePath();
        ctx.fill();

        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width * 0.3, this.height * 0.35, 0, 0, Math.PI * 2);
        const bodyGrad = ctx.createRadialGradient(-10, -10, 5, 0, 0, this.width * 0.3);
        bodyGrad.addColorStop(0, '#ef5350');
        bodyGrad.addColorStop(1, '#b71c1c');
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // Belly
        ctx.beginPath();
        ctx.ellipse(0, 10, this.width * 0.2, this.height * 0.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ff8a65';
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.ellipse(0, -this.height * 0.3, 22, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#e53935';
        ctx.fill();

        // Horns
        ctx.beginPath();
        ctx.moveTo(-12, -this.height * 0.3 - 14);
        ctx.lineTo(-18, -this.height * 0.3 - 30);
        ctx.lineTo(-6, -this.height * 0.3 - 16);
        ctx.fillStyle = '#8d6e63';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(12, -this.height * 0.3 - 14);
        ctx.lineTo(18, -this.height * 0.3 - 30);
        ctx.lineTo(6, -this.height * 0.3 - 16);
        ctx.fill();

        // Eyes
        ctx.beginPath();
        ctx.arc(-8, -this.height * 0.32, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff9c4';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-8, -this.height * 0.32, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#311b92';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(8, -this.height * 0.32, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff9c4';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8, -this.height * 0.32, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#311b92';
        ctx.fill();

        // Snout
        ctx.beginPath();
        ctx.ellipse(0, -this.height * 0.22, 8, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ef5350';
        ctx.fill();
        // Nostrils
        ctx.beginPath();
        ctx.arc(-3, -this.height * 0.22, 1.5, 0, Math.PI * 2);
        ctx.arc(3, -this.height * 0.22, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#4a0000';
        ctx.fill();

        // Fire breath
        if (this.breathing) {
            const fireLength = 80 + Math.sin(Date.now() * 0.02) * 20;
            const grad = ctx.createLinearGradient(0, this.height * 0.2, 0, this.height * 0.2 + fireLength);
            grad.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
            grad.addColorStop(0.3, 'rgba(255, 100, 20, 0.7)');
            grad.addColorStop(0.7, 'rgba(255, 50, 0, 0.4)');
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');

            for (let i = 0; i < 5; i++) {
                const fx = (Math.random() - 0.5) * 30;
                ctx.beginPath();
                ctx.moveTo(fx - 8, this.height * 0.2);
                ctx.lineTo(fx + (Math.random() - 0.5) * 40, this.height * 0.2 + fireLength);
                ctx.lineTo(fx + 8, this.height * 0.2);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.fill();
            }
        }

        // Ice buildup overlay
        if (this.iceLevel > 0) {
            ctx.globalAlpha = this.iceLevel / 100 * 0.6;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width * 0.35, this.height * 0.4, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(130, 210, 255, 0.5)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(200, 240, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Ice crystal formations
            for (let i = 0; i < Math.floor(this.iceLevel / 20); i++) {
                const ix = (Math.random() - 0.5) * this.width * 0.5;
                const iy = (Math.random() - 0.5) * this.height * 0.6;
                ctx.beginPath();
                ctx.moveTo(ix, iy - 8);
                ctx.lineTo(ix + 4, iy);
                ctx.lineTo(ix, iy + 8);
                ctx.lineTo(ix - 4, iy);
                ctx.closePath();
                ctx.fillStyle = 'rgba(180, 230, 255, 0.8)';
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // HP bar
        const hpBarW = 80;
        const hpBarH = 6;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-hpBarW / 2, -this.height * 0.5, hpBarW, hpBarH);
        const hpFrac = this.hp / this.maxHp;
        ctx.fillStyle = hpFrac > 0.5 ? '#f44336' : hpFrac > 0.25 ? '#ff9800' : '#4fc3f7';
        ctx.fillRect(-hpBarW / 2, -this.height * 0.5, hpBarW * hpFrac, hpBarH);

        ctx.restore();
    }

    getFireZone() {
        if (!this.breathing) return null;
        return {
            x: this.x - 40,
            y: this.y + this.height * 0.2,
            width: 80,
            height: 100
        };
    }
}

// ---- SUBMARINE (Brine-O-Boat) ----
class Submarine {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 30;
        this.speed = 3;
        this.crystals = 0;
        this.alive = true;
        this.propPhase = 0;
    }

    update(keys, waterSystem) {
        this.propPhase += 0.15;
        const minY = waterSystem.START_Y + 15;
        const maxY = waterSystem.END_Y - 15;

        if (keys.left) this.x -= this.speed;
        if (keys.right) this.x += this.speed;
        if (keys.up) this.y -= this.speed;
        if (keys.down) this.y += this.speed;

        this.x = Math.max(30, Math.min(waterSystem.canvas.width - 30, this.x));
        this.y = Math.max(minY, Math.min(maxY, this.y));
    }

    collectCrystal() {
        this.crystals++;
    }

    shootCrystal() {
        if (this.crystals <= 0) return null;
        this.crystals--;
        return {
            x: this.x,
            y: this.y - 10,
            vx: 0,
            vy: -8,
            radius: 6,
            alive: true
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Hull
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        const hullGrad = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
        hullGrad.addColorStop(0, '#78909c');
        hullGrad.addColorStop(0.5, '#546e7a');
        hullGrad.addColorStop(1, '#37474f');
        ctx.fillStyle = hullGrad;
        ctx.fill();
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Porthole
        ctx.beginPath();
        ctx.arc(8, -2, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#b3e5fc';
        ctx.fill();
        ctx.strokeStyle = '#607d8b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Periscope
        ctx.beginPath();
        ctx.moveTo(-5, -this.height / 2);
        ctx.lineTo(-5, -this.height / 2 - 12);
        ctx.lineTo(3, -this.height / 2 - 12);
        ctx.lineTo(3, -this.height / 2 - 8);
        ctx.strokeStyle = '#607d8b';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Propeller
        const propAngle = this.propPhase;
        ctx.save();
        ctx.translate(-this.width / 2 - 5, 0);
        for (let i = 0; i < 3; i++) {
            const a = propAngle + (i * Math.PI * 2 / 3);
            ctx.beginPath();
            ctx.ellipse(Math.cos(a) * 6, Math.sin(a) * 6, 5, 2, a, 0, Math.PI * 2);
            ctx.fillStyle = '#90a4ae';
            ctx.fill();
        }
        ctx.restore();

        // Crystal count
        if (this.crystals > 0) {
            ctx.font = 'bold 11px Outfit, sans-serif';
            ctx.fillStyle = '#4fc3f7';
            ctx.textAlign = 'center';
            ctx.fillText(`💎 ${this.crystals}`, 0, this.height / 2 + 14);
        }

        ctx.restore();
    }
}

// ---- CRYSTAL PROJECTILE ----
class CrystalProjectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 6;
        this.alive = true;
        this.trail = [];
    }

    update() {
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > 8) this.trail.shift();
        for (const t of this.trail) t.alpha -= 0.12;

        this.x += this.vx;
        this.y += this.vy;

        if (this.y < -50) this.alive = false;
    }

    draw(ctx) {
        // Trail
        for (const t of this.trail) {
            if (t.alpha > 0) {
                ctx.save();
                ctx.globalAlpha = t.alpha * 0.5;
                ctx.beginPath();
                ctx.arc(t.x, t.y, this.radius * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = '#4fc3f7';
                ctx.fill();
                ctx.restore();
            }
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.6, 0);
        ctx.lineTo(0, this.radius);
        ctx.lineTo(-this.radius * 0.6, 0);
        ctx.closePath();
        ctx.fillStyle = '#4fc3f7';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}

// ---- SPARKLE PEARL (reward particle) ----
class SparklePearl {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = -(2 + Math.random() * 5);
        this.gravity = 0.1;
        this.alpha = 1;
        this.radius = 3 + Math.random() * 4;
        this.alive = true;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.99;
        this.alpha -= 0.005;
        this.rotation += this.rotSpeed;
        if (this.alpha <= 0) this.alive = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        const pGrad = ctx.createRadialGradient(-1, -1, 1, 0, 0, this.radius);
        pGrad.addColorStop(0, '#fff9c4');
        pGrad.addColorStop(0.5, '#ffd54f');
        pGrad.addColorStop(1, '#ff8f00');
        ctx.fillStyle = pGrad;
        ctx.fill();

        ctx.restore();
    }
}
