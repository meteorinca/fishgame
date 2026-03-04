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

        // Turning animation (shows front-view PNG)
        this.turning = false;
        this.turnTimer = 0;
        this.turnDuration = 15; // frames to show front view during direction change
        this.prevFacingRight = this.facingRight;

        // Fighting state
        this.fighting = false;
        this.fightTarget = null;
        this.fightCooldown = 0;
        this.abilityActive = false;
        this.abilityTimer = 0;
        this.abilityFx = []; // visual effects from abilities

        // Shield (from Glimmer's power)
        this.shielded = false;
        this.shieldTimer = 0;
        this.zoomBiteTarget = null;
    }

    feed(amount) {
        this.hunger = Math.min(100, this.hunger + amount);
        this.joy = Math.min(100, this.joy + amount * 0.6);
    }

    // Can this fish fight? Needs at least some food in belly
    canFight() {
        return this.hunger >= 25 && this.fightCooldown <= 0 && !this.flyFishMode;
    }

    // Engage shark in combat using unique ability
    fightShark(shark, waterSystem) {
        if (!this.canFight()) return false;
        this.fighting = true;
        this.fightTarget = shark;
        this.fightCooldown = 120; // 2 seconds cooldown
        this.abilityActive = true;
        this.abilityTimer = 40;
        this.hunger = Math.max(0, this.hunger - 15); // fighting costs hunger

        let damage = 0;
        switch (this.type) {
            case 'spike':
                // Ripple shockwave — big splash that stuns sharks
                damage = 35;
                waterSystem.splashAtX(this.x, 100);
                // Create expanding ring effect
                this.abilityFx.push({ type: 'shockwave', x: this.x, y: this.y, radius: 10, maxRadius: 120, alpha: 1 });
                break;
            case 'glimmer':
                // Blinding flash — intense light burst
                damage = 25;
                this.abilityFx.push({ type: 'flash', x: this.x, y: this.y, radius: 30, maxRadius: 150, alpha: 1 });
                break;
            case 'zoom':
                // Speed ram — dash into the shark
                damage = 45;
                const dx = shark.x - this.x;
                const dy = shark.y - this.y;
                const angle = Math.atan2(dy, dx);
                this.vx = Math.cos(angle) * 12;
                this.vy = Math.sin(angle) * 12;
                this.abilityFx.push({ type: 'speedlines', x: this.x, y: this.y, angle: angle, alpha: 1 });
                break;
        }
        shark.takeDamage(damage);
        return true;
    }

    update(waterSystem, foodPellets, bugs) {
        if (this.flyFishMode) {
            this._updateFlyFish(waterSystem, bugs);
            return;
        }

        // Update fight cooldown
        if (this.fightCooldown > 0) this.fightCooldown--;
        if (this.abilityTimer > 0) {
            this.abilityTimer--;
            if (this.abilityTimer <= 0) {
                this.abilityActive = false;
                this.fighting = false;
                this.fightTarget = null;
            }
        }

        // Update ability effects
        for (let i = this.abilityFx.length - 1; i >= 0; i--) {
            const fx = this.abilityFx[i];
            fx.alpha -= 0.03;
            if (fx.type === 'shockwave' || fx.type === 'flash') {
                fx.radius += (fx.maxRadius - fx.radius) * 0.15;
            }
            if (fx.alpha <= 0) this.abilityFx.splice(i, 1);
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

        // Detect turning (direction change)
        if (this.facingRight !== this.prevFacingRight) {
            this.turning = true;
            this.turnTimer = this.turnDuration;
        }
        this.prevFacingRight = this.facingRight;
        if (this.turnTimer > 0) { this.turnTimer--; }
        else { this.turning = false; }

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

        // Try PNG sprite rendering
        const spriteKey = this.turning ? `${this.type}_front` : `${this.type}_fw`;
        const sprite = typeof AssetLoader !== 'undefined' ? AssetLoader.getImage(spriteKey) : null;
        if (sprite) {
            // Scale PNG to fish entity size, keeping aspect ratio
            const aspect = sprite.naturalWidth / sprite.naturalHeight;
            const drawH = this.height * 2.2;
            const drawW = drawH * aspect;
            if (!this.turning && !this.facingRight) ctx.scale(-1, 1);
            // Gentle bob
            const bob = Math.sin(this.swimPhase) * 2;
            // Slight tilt based on vy
            const tilt = this.turning ? 0 : Math.atan2(this.vy, Math.abs(this.vx) + 1) * 0.3;
            ctx.rotate(tilt);
            ctx.drawImage(sprite, -drawW / 2, -drawH / 2 + bob, drawW, drawH);
            // Ready glow when joy is full
            if (this.joy >= 100) {
                ctx.beginPath();
                ctx.arc(0, bob, drawW * 0.45, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 215, 0, ${0.12 + Math.sin(this.glowPhase) * 0.08})`;
                ctx.fill();
            }
            ctx.restore();
            this._drawMeters(ctx);
            this._drawAbilityFx(ctx);
            return;
        }

        // Fallback: programmatic rendering
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

        // Draw ability effects + meters
        this._drawAbilityFx(ctx);
        this._drawMeters(ctx);
    }

    _drawAbilityFx(ctx) {
        for (const fx of this.abilityFx) {
            ctx.save();
            ctx.globalAlpha = fx.alpha;
            if (fx.type === 'shockwave') {
                ctx.beginPath();
                ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2);
                ctx.strokeStyle = '#81c784';
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(fx.x, fx.y, fx.radius * 0.6, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(129, 199, 132, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (fx.type === 'flash') {
                const fGrad = ctx.createRadialGradient(fx.x, fx.y, 5, fx.x, fx.y, fx.radius);
                fGrad.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
                fGrad.addColorStop(0.5, 'rgba(255, 235, 59, 0.4)');
                fGrad.addColorStop(1, 'rgba(255, 235, 59, 0)');
                ctx.beginPath();
                ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2);
                ctx.fillStyle = fGrad;
                ctx.fill();
            } else if (fx.type === 'speedlines') {
                for (let i = 0; i < 6; i++) {
                    const offset = (Math.random() - 0.5) * 20;
                    const len = 30 + Math.random() * 40;
                    ctx.beginPath();
                    ctx.moveTo(fx.x + offset, fx.y + offset);
                    ctx.lineTo(fx.x + offset - Math.cos(fx.angle) * len, fx.y + offset - Math.sin(fx.angle) * len);
                    ctx.strokeStyle = 'rgba(233, 30, 99, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
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

// ---- DRAGON (PNG Animation System) ----
class Dragon {
    constructor(canvasW, canvasH, level) {
        this.canvasW = canvasW;
        this.canvasH = canvasH;
        this.x = canvasW / 2;
        this.y = -200;
        this.width = 200;
        this.height = 160;
        this.alive = true;

        // Level scaling
        this.level = level || 1;
        this.maxHp = 80 + level * 40;
        this.hp = this.maxHp;
        this.moveSpeed = 0.8 + level * 0.3;
        this.attackCooldown = Math.max(80, 220 - level * 25);

        this.phase = 'entering';
        this.enterTimer = 0;
        this.attackTimer = 0;
        this.wobble = 0;
        this.moveDir = 1;
        this.facingRight = true;

        // PNG Animation frames
        this.animFrame = 'bodyL'; // bodyL, L1, L2, L3, F1, F2
        this.animTimer = 0;
        this.animSequence = [];
        this.animIdx = 0;
        this.doFire = false; // whether this attack cycle actually fires

        // Fireball system
        this.fireballs = [];
        this.fireReady = false;

        // Blood drops on hit
        this.bloodDrops = [];

        // Loaded images cache
        this._imgs = {};
        this._loadFrames();
    }

    _loadFrames() {
        const frames = ['dragon_bodyL', 'dragon_bodyL1', 'dragon_bodyL2', 'dragon_bodyL3',
            'dragon_bodyF1', 'dragon_bodyF2', 'fire', 'fireforming'];
        for (const f of frames) {
            const img = new Image();
            img.src = `assets/dragon/${f}.png`;
            this._imgs[f] = img;
        }
    }

    _getImg(key) {
        const img = this._imgs[key];
        return (img && img.complete && img.naturalWidth > 0) ? img : null;
    }

    hit(damage) {
        if (this.phase === 'defeated') return;
        this.hp -= damage;
        this.wobble = 12;

        // Blood drops
        for (let i = 0; i < 8; i++) {
            this.bloodDrops.push({
                x: this.x + (Math.random() - 0.5) * 60,
                y: this.y + this.height * 0.3,
                vx: (Math.random() - 0.5) * 4,
                vy: 2 + Math.random() * 5,
                r: 2 + Math.random() * 4,
                alpha: 1
            });
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.phase = 'defeated';
        }
    }

    _startAttackSequence() {
        this.doFire = Math.random() < 0.65 + this.level * 0.05;
        if (this.doFire) {
            this.animSequence = ['bodyL', 'L1', 'L2', 'L3', 'F1', 'F2', 'F2', 'F1', 'L3', 'L2', 'L1', 'bodyL'];
        } else {
            this.animSequence = ['bodyL', 'L1', 'L2', 'L3', 'L2', 'L1', 'bodyL'];
        }
        this.animIdx = 0;
        this.animTimer = 0;
        this.fireReady = false;
        this.phase = 'animating';
    }

    update(waterSystem) {
        this.wobble *= 0.88;

        // Blood drops
        for (let i = this.bloodDrops.length - 1; i >= 0; i--) {
            const b = this.bloodDrops[i];
            b.x += b.vx; b.y += b.vy; b.vy += 0.3;
            b.alpha -= 0.01;
            if (b.y > waterSystem.END_Y || b.alpha <= 0) this.bloodDrops.splice(i, 1);
        }

        // Fireballs
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const fb = this.fireballs[i];
            fb.update(waterSystem);
            if (!fb.alive) this.fireballs.splice(i, 1);
        }

        switch (this.phase) {
            case 'entering':
                this.enterTimer++;
                this.y = -200 + this.enterTimer * 2;
                if (this.y >= 60) { this.y = 60; this.phase = 'idle'; this.animFrame = 'bodyL'; }
                break;

            case 'idle':
                this.x += this.moveDir * this.moveSpeed;
                if (this.x < 120 || this.x > this.canvasW - 120) this.moveDir *= -1;
                this.facingRight = this.moveDir > 0;
                this.attackTimer++;
                this.animFrame = 'bodyL';
                if (this.attackTimer >= this.attackCooldown) {
                    this.attackTimer = 0;
                    this._startAttackSequence();
                }
                break;

            case 'animating':
                this.x += this.moveDir * this.moveSpeed * 0.2;
                this.animTimer++;
                const frameSpeed = Math.max(6, 12 - this.level);
                if (this.animTimer >= frameSpeed) {
                    this.animTimer = 0;
                    this.animIdx++;
                    if (this.animIdx >= this.animSequence.length) {
                        this.phase = 'idle';
                        this.animFrame = 'bodyL';
                    } else {
                        const frameName = this.animSequence[this.animIdx];
                        this.animFrame = frameName;
                        if (frameName === 'F2' && this.doFire && !this.fireReady) {
                            this.fireReady = true;
                            this._spawnFireball(waterSystem);
                        }
                    }
                }
                break;

            case 'defeated':
                this.y += 4;
                if (this.y > waterSystem.START_Y - 20) {
                    waterSystem.splashAtX(this.x, 250);
                    waterSystem.splashAtX(this.x - 50, 180);
                    waterSystem.splashAtX(this.x + 50, 180);
                    this.alive = false;
                }
                break;
        }
    }

    _spawnFireball(waterSystem) {
        const count = Math.min(1 + Math.floor(this.level / 3), 3);
        for (let i = 0; i < count; i++) {
            const spread = (i - (count - 1) / 2) * 60;
            this.fireballs.push(new DragonFireball(
                this.x + spread, this.y + this.height * 0.5,
                spread * 0.02, 3 + this.level * 0.5
            ));
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        // Draw fireballs
        for (const fb of this.fireballs) fb.draw(ctx);

        // Blood drops
        for (const b of this.bloodDrops) {
            ctx.save();
            ctx.globalAlpha = b.alpha;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fillStyle = '#b71c1c';
            ctx.fill();
            ctx.restore();
        }

        ctx.save();
        const wobbleX = Math.sin(this.wobble) * this.wobble;
        ctx.translate(this.x + wobbleX, this.y);
        if (!this.facingRight) ctx.scale(-1, 1);

        // Try PNG frame
        const imgKey = 'dragon_' + this.animFrame;
        const img = this._getImg(imgKey.replace('dragon_bodyL', 'dragon_bodyL'));
        const realKey = this.animFrame === 'bodyL' ? 'dragon_bodyL' :
            this.animFrame === 'L1' ? 'dragon_bodyL1' :
                this.animFrame === 'L2' ? 'dragon_bodyL2' :
                    this.animFrame === 'L3' ? 'dragon_bodyL3' :
                        this.animFrame === 'F1' ? 'dragon_bodyF1' :
                            this.animFrame === 'F2' ? 'dragon_bodyF2' : 'dragon_bodyL';
        const realImg = this._getImg(realKey);

        if (realImg) {
            const scale = this.width / realImg.naturalWidth;
            const dw = realImg.naturalWidth * scale;
            const dh = realImg.naturalHeight * scale;
            ctx.drawImage(realImg, -dw / 2, -dh / 2, dw, dh);

            // Fire forming/fire overlay when F2
            if (this.animFrame === 'F2' || this.animFrame === 'F1') {
                const fireKey = this.animFrame === 'F1' ? 'fireforming' : 'fire';
                const fireImg = this._getImg(fireKey);
                if (fireImg) {
                    const fw = fireImg.naturalWidth * scale * 0.8;
                    const fh = fireImg.naturalHeight * scale * 0.8;
                    ctx.drawImage(fireImg, -fw / 2, dh * 0.3, fw, fh);
                }
            }
        } else {
            // Programmatic fallback
            this._drawFallback(ctx);
        }

        // Wobble flash when hit
        if (this.wobble > 2) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#fff';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    _drawFallback(ctx) {
        const wingFlap = Math.sin(Date.now() * 0.005) * 10;
        ctx.beginPath();
        ctx.moveTo(-30, -10);
        ctx.quadraticCurveTo(-this.width * 0.5, -50 - wingFlap, -this.width * 0.6, 10);
        ctx.lineTo(-30, 10); ctx.closePath();
        ctx.fillStyle = '#b71c1c'; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(30, -10);
        ctx.quadraticCurveTo(this.width * 0.5, -50 - wingFlap, this.width * 0.6, 10);
        ctx.lineTo(30, 10); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width * 0.25, this.height * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ef5350'; ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, -this.height * 0.25, 18, 14, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#e53935'; ctx.fill();
        ctx.beginPath();
        ctx.arc(-6, -this.height * 0.27, 3, 0, Math.PI * 2);
        ctx.arc(6, -this.height * 0.27, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff9c4'; ctx.fill();
    }
}

// ---- DRAGON FIREBALL ----
class DragonFireball {
    constructor(x, y, vx, vy) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.radius = 18;
        this.alive = true;
        this.trail = [];
        this.splashed = false;
        this.phase = 0;
    }

    update(waterSystem) {
        if (!this.alive) return;
        this.vy += 0.15;
        this.x += this.vx;
        this.y += this.vy;
        this.phase += 0.1;
        this.trail.push({ x: this.x, y: this.y, r: this.radius, alpha: 1 });
        if (this.trail.length > 15) this.trail.shift();
        for (const t of this.trail) t.alpha -= 0.06;

        if (this.y >= waterSystem.START_Y && !this.splashed) {
            this.splashed = true;
            waterSystem.splashAtX(this.x, 180);
            waterSystem.splashAtX(this.x - 20, 120);
            waterSystem.splashAtX(this.x + 20, 120);
            // Trigger screen shake via flag
            this.hitWater = true;
        }
        if (this.y > waterSystem.END_Y + 50) this.alive = false;
    }

    draw(ctx) {
        for (const t of this.trail) {
            if (t.alpha > 0) {
                ctx.save(); ctx.globalAlpha = t.alpha * 0.4;
                ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,100,20,0.6)'; ctx.fill();
                ctx.restore();
            }
        }
        ctx.save();
        ctx.translate(this.x, this.y);
        const grd = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius);
        grd.addColorStop(0, 'rgba(255,255,200,0.95)');
        grd.addColorStop(0.3, 'rgba(255,180,50,0.85)');
        grd.addColorStop(0.7, 'rgba(255,80,0,0.6)');
        grd.addColorStop(1, 'rgba(200,0,0,0)');
        ctx.beginPath(); ctx.arc(0, 0, this.radius + Math.sin(this.phase) * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
        ctx.restore();
    }
}

// ---- ICE DART (thrown by controlled fish) ----
class IceDart {
    constructor(x, y, vx, vy) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.radius = 7;
        this.alive = true;
        this.trail = [];
    }

    update() {
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > 10) this.trail.shift();
        for (const t of this.trail) t.alpha -= 0.1;
        this.x += this.vx; this.y += this.vy;
        if (this.y < -50 || this.x < -50 || this.x > 3000) this.alive = false;
    }

    draw(ctx) {
        for (const t of this.trail) {
            if (t.alpha > 0) {
                ctx.save(); ctx.globalAlpha = t.alpha * 0.4;
                ctx.beginPath(); ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#4fc3f7'; ctx.fill(); ctx.restore();
            }
        }
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius * 0.5, -this.radius * 0.5);
        ctx.lineTo(-this.radius * 0.3, 0);
        ctx.lineTo(-this.radius * 0.5, this.radius * 0.5);
        ctx.closePath();
        ctx.fillStyle = '#4fc3f7'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.stroke();
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

// ---- SHARK ----
class Shark {
    constructor(canvasW, waterStartY, waterEndY) {
        this.canvasW = canvasW;
        this.waterStartY = waterStartY;
        this.waterEndY = waterEndY;

        // Spawn from far below
        this.x = 80 + Math.random() * (canvasW - 160);
        this.y = waterEndY + 50 + Math.random() * 100;
        this.width = 90 + Math.random() * 40;
        this.height = 35 + Math.random() * 15;

        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = -(1 + Math.random() * 1.5); // Rising from depths
        this.baseSpeed = 1.5;
        this.facingRight = this.vx >= 0;

        this.alive = true;
        this.hp = 100;
        this.maxHp = 100;
        this.phase = 'rising'; // rising, hunting, fleeing, dying

        this.jawOpen = 0; // 0-1 jaw animation
        this.jawDir = 1;
        this.swimPhase = Math.random() * Math.PI * 2;
        this.wobble = 0;
        this.eyeGlow = 0;

        // Target fish
        this.targetFish = null;
        this.huntTimer = 0;
        this.maxHuntTime = 600; // 10 seconds max before leaving

        // Scar marks (procedural character)
        this.scars = [];
        const scarCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < scarCount; i++) {
            this.scars.push({
                x: (Math.random() - 0.5) * this.width * 0.6,
                y: (Math.random() - 0.5) * this.height * 0.4,
                len: 5 + Math.random() * 15,
                angle: (Math.random() - 0.5) * 0.8
            });
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.wobble = 8;
        if (this.hp <= 0) {
            this.phase = 'dying';
            this.vy = 2; // Sink
        } else if (this.hp < 40) {
            this.phase = 'fleeing';
        }
    }

    update(fishes, waterSystem) {
        this.swimPhase += 0.06;
        this.wobble *= 0.9;
        this.eyeGlow = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
        this.huntTimer++;

        // Jaw animation
        this.jawOpen += this.jawDir * 0.03;
        if (this.jawOpen > 0.6) this.jawDir = -1;
        if (this.jawOpen < 0) this.jawDir = 1;

        switch (this.phase) {
            case 'rising':
                this.vy += 0.01; // Slow deceleration
                this.x += this.vx;
                this.y += this.vy;

                // Once in hunting zone, switch to hunting
                if (this.y <= this.waterStartY + (this.waterEndY - this.waterStartY) * 0.5) {
                    this.phase = 'hunting';
                }
                break;

            case 'hunting':
                // Find nearest fish to hunt
                let nearest = null;
                let nearestDist = Infinity;
                for (const fish of fishes) {
                    if (fish.flyFishMode) continue;
                    const dist = Math.hypot(fish.x - this.x, fish.y - this.y);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearest = fish;
                    }
                }
                this.targetFish = nearest;

                if (nearest) {
                    const dx = nearest.x - this.x;
                    const dy = nearest.y - this.y;
                    const angle = Math.atan2(dy, dx);
                    this.vx += Math.cos(angle) * 0.08;
                    this.vy += Math.sin(angle) * 0.04;
                    this.facingRight = dx > 0;
                }

                // Damping
                this.vx *= 0.97;
                this.vy *= 0.97;

                const spd = Math.hypot(this.vx, this.vy);
                if (spd > this.baseSpeed) {
                    this.vx = (this.vx / spd) * this.baseSpeed;
                    this.vy = (this.vy / spd) * this.baseSpeed;
                }

                this.x += this.vx;
                this.y += this.vy;

                // Create menacing water disturbance
                if (Math.random() < 0.05) {
                    waterSystem.splashAtX(this.x, 20);
                }

                // Stay in water
                const minY = this.waterStartY + 30;
                const maxY = this.waterEndY - 20;
                if (this.y < minY) { this.y = minY; this.vy = Math.abs(this.vy); }
                if (this.y > maxY) { this.y = maxY; this.vy = -Math.abs(this.vy); }
                if (this.x < 20) { this.x = 20; this.vx = Math.abs(this.vx); }
                if (this.x > this.canvasW - 20) { this.x = this.canvasW - 20; this.vx = -Math.abs(this.vx); }

                // Timeout — leave after max hunt time
                if (this.huntTimer > this.maxHuntTime) {
                    this.phase = 'fleeing';
                }
                break;

            case 'fleeing':
                this.vy += 0.05; // Sink away
                this.vx *= 0.98;
                this.x += this.vx;
                this.y += this.vy;
                if (this.y > this.waterEndY + 100) {
                    this.alive = false;
                }
                break;

            case 'dying':
                this.vy += 0.03;
                this.x += this.vx * 0.5;
                this.y += this.vy;
                this.wobble = Math.sin(this.swimPhase * 3) * 5;
                if (this.y > this.waterEndY + 100) {
                    this.alive = false;
                }
                break;
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x + Math.sin(this.wobble) * this.wobble, this.y);
        if (!this.facingRight) ctx.scale(-1, 1);

        const bodyWobble = Math.sin(this.swimPhase) * 2;

        // Shadow / menace aura
        if (this.phase === 'hunting') {
            ctx.beginPath();
            ctx.arc(0, bodyWobble, this.width * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 0, 0, ${0.06 + Math.sin(this.swimPhase) * 0.03})`;
            ctx.fill();
        }

        // Tail
        const tailWag = Math.sin(this.swimPhase * 1.5) * 12;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, bodyWobble);
        ctx.lineTo(-this.width / 2 - 25, bodyWobble - 22 + tailWag);
        ctx.lineTo(-this.width / 2 - 8, bodyWobble + tailWag * 0.3);
        ctx.lineTo(-this.width / 2 - 25, bodyWobble + 22 + tailWag);
        ctx.closePath();
        ctx.fillStyle = '#455a64';
        ctx.fill();

        // Body — sleek and menacing
        ctx.beginPath();
        ctx.ellipse(0, bodyWobble, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        const bodyGrad = ctx.createLinearGradient(0, bodyWobble - this.height / 2, 0, bodyWobble + this.height / 2);
        bodyGrad.addColorStop(0, '#546e7a');
        bodyGrad.addColorStop(0.4, '#37474f');
        bodyGrad.addColorStop(0.6, '#455a64');
        bodyGrad.addColorStop(1, '#78909c');
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // Belly (lighter)
        ctx.beginPath();
        ctx.ellipse(0, bodyWobble + this.height * 0.15, this.width * 0.4, this.height * 0.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(176, 190, 197, 0.6)';
        ctx.fill();

        // Dorsal fin — tall and menacing
        ctx.beginPath();
        ctx.moveTo(-8, bodyWobble - this.height / 2);
        ctx.lineTo(0, bodyWobble - this.height / 2 - 18);
        ctx.lineTo(12, bodyWobble - this.height / 2);
        ctx.closePath();
        ctx.fillStyle = '#37474f';
        ctx.fill();

        // Pectoral fins
        ctx.beginPath();
        ctx.moveTo(5, bodyWobble + this.height * 0.2);
        ctx.lineTo(18, bodyWobble + this.height * 0.5 + 8);
        ctx.lineTo(-5, bodyWobble + this.height * 0.3);
        ctx.closePath();
        ctx.fillStyle = '#455a64';
        ctx.fill();

        // Scars
        for (const scar of this.scars) {
            ctx.save();
            ctx.translate(scar.x, bodyWobble + scar.y);
            ctx.rotate(scar.angle);
            ctx.beginPath();
            ctx.moveTo(-scar.len / 2, 0);
            ctx.lineTo(scar.len / 2, 0);
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        // Head / snout
        ctx.beginPath();
        ctx.ellipse(this.width * 0.35, bodyWobble, this.width * 0.2, this.height * 0.35, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#455a64';
        ctx.fill();

        // JAW — opens and closes menacingly
        const jawAngle = this.jawOpen * 0.4;
        // Upper jaw
        ctx.beginPath();
        ctx.moveTo(this.width * 0.3, bodyWobble - 3);
        ctx.lineTo(this.width * 0.55, bodyWobble - 5 - jawAngle * 8);
        ctx.lineTo(this.width * 0.45, bodyWobble - 1);
        ctx.closePath();
        ctx.fillStyle = '#37474f';
        ctx.fill();
        // Lower jaw
        ctx.beginPath();
        ctx.moveTo(this.width * 0.3, bodyWobble + 3);
        ctx.lineTo(this.width * 0.55, bodyWobble + 5 + jawAngle * 10);
        ctx.lineTo(this.width * 0.45, bodyWobble + 1);
        ctx.closePath();
        ctx.fillStyle = '#37474f';
        ctx.fill();

        // TEETH — rows of sharp triangles
        const teethCount = 7;
        for (let i = 0; i < teethCount; i++) {
            const t = i / teethCount;
            const tx = this.width * 0.3 + t * this.width * 0.22;
            const toothSize = 3 + (1 - t) * 3;
            // Upper teeth
            ctx.beginPath();
            ctx.moveTo(tx - 1.5, bodyWobble - 2 - jawAngle * 4);
            ctx.lineTo(tx, bodyWobble + toothSize - jawAngle * 2);
            ctx.lineTo(tx + 1.5, bodyWobble - 2 - jawAngle * 4);
            ctx.closePath();
            ctx.fillStyle = '#eceff1';
            ctx.fill();
            // Lower teeth
            ctx.beginPath();
            ctx.moveTo(tx - 1.5, bodyWobble + 2 + jawAngle * 4);
            ctx.lineTo(tx, bodyWobble - toothSize + jawAngle * 2);
            ctx.lineTo(tx + 1.5, bodyWobble + 2 + jawAngle * 4);
            ctx.closePath();
            ctx.fill();
        }

        // MOUTH interior (dark)
        if (this.jawOpen > 0.15) {
            ctx.beginPath();
            ctx.ellipse(this.width * 0.42, bodyWobble, this.width * 0.08, this.jawOpen * 12, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(30, 0, 0, 0.8)';
            ctx.fill();
        }

        // Eye — glowing red
        ctx.beginPath();
        ctx.arc(this.width * 0.25, bodyWobble - 6, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        // Red iris
        ctx.beginPath();
        ctx.arc(this.width * 0.25 + 1.5, bodyWobble - 6, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244, 67, 54, ${0.7 + this.eyeGlow * 0.3})`;
        ctx.fill();
        // Slit pupil
        ctx.beginPath();
        ctx.moveTo(this.width * 0.25 + 1.5, bodyWobble - 9);
        ctx.lineTo(this.width * 0.25 + 2, bodyWobble - 6);
        ctx.lineTo(this.width * 0.25 + 1.5, bodyWobble - 3);
        ctx.lineTo(this.width * 0.25 + 1, bodyWobble - 6);
        ctx.closePath();
        ctx.fillStyle = '#1a0000';
        ctx.fill();

        // Eye glow effect
        ctx.beginPath();
        ctx.arc(this.width * 0.25, bodyWobble - 6, 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244, 67, 54, ${this.eyeGlow * 0.15})`;
        ctx.fill();

        // Dying effect — X eyes
        if (this.phase === 'dying') {
            ctx.strokeStyle = '#f44336';
            ctx.lineWidth = 2;
            const ex = this.width * 0.25;
            const ey = bodyWobble - 6;
            ctx.beginPath();
            ctx.moveTo(ex - 4, ey - 4); ctx.lineTo(ex + 4, ey + 4);
            ctx.moveTo(ex + 4, ey - 4); ctx.lineTo(ex - 4, ey + 4);
            ctx.stroke();
        }

        ctx.restore();

        // HP bar when damaged
        if (this.hp < this.maxHp && this.phase !== 'dying') {
            const hpBarW = 50;
            const hpBarH = 4;
            const hpX = this.x - hpBarW / 2;
            const hpY = this.y - this.height / 2 - 12;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(hpX, hpY, hpBarW, hpBarH);
            ctx.fillStyle = '#f44336';
            ctx.fillRect(hpX, hpY, hpBarW * (this.hp / this.maxHp), hpBarH);
        }

        // Warning label
        if (this.phase === 'hunting') {
            ctx.save();
            ctx.font = 'bold 10px Fredoka One, cursive';
            ctx.fillStyle = `rgba(244, 67, 54, ${0.6 + Math.sin(Date.now() * 0.008) * 0.3})`;
            ctx.textAlign = 'center';
            ctx.fillText('\ud83e\udd88 SHARK!', this.x, this.y - this.height / 2 - 18);
            ctx.restore();
        }
    }

    // Check if near a fish (for auto-fight triggering)
    isNearFish(fish) {
        if (fish.flyFishMode) return false;
        return Math.hypot(fish.x - this.x, fish.y - this.y) < 80;
    }
}
