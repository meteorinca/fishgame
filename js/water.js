/* ============================================
   WATER PHYSICS ENGINE (Gloop System)
   Based on the 2D-Water-Javascript-Demo spring model
   ============================================ */

class WaterSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Spring physics parameters
        this.WAVE_FREQ = 5;
        this.WAV_PASS = 8; // Increased for more fluid spread
        this.K = 0.05;
        this.SPREAD = 0.25; // Increased to spread turbulence
        this.DAMP = 0.003; // Decreased dampening so waves last longer
        this.TENSION = 0.015; // Increased tension for snappier waves
        this.SPEED = 0;

        // Water surface position (fraction of canvas height)
        this.surfaceFraction = 0.58;
        this.START_Y = 0;
        this.END_Y = 0;
        this.HEIGHT = 0;

        this.springs = [];
        this.particles = []; // Splash droplets

        // Color palette
        this.normalColors = {
            col1: 'rgba(28,107,160,.75)',
            col2: 'rgba(20,80,120,.80)',
            col3: 'rgba(15,60,90,.85)',
            col4: 'rgba(6, 23, 37, .98)'
        };
        this.dragonColors = {
            col1: 'rgba(60,30,80,.75)',
            col2: 'rgba(45,20,60,.80)',
            col3: 'rgba(30,15,45,.85)',
            col4: 'rgba(15, 8, 25, .98)'
        };
        this.colors = this.normalColors;
    }

    init() {
        this.START_Y = this.canvas.height * this.surfaceFraction;
        this.END_Y = this.canvas.height;
        this.HEIGHT = this.END_Y - this.START_Y;
        const WAVE_COUNT = Math.floor(this.canvas.width / this.WAVE_FREQ) + 1;

        this.springs = [];
        for (let i = 0; i < WAVE_COUNT; i++) {
            this.springs.push({
                x: i * this.WAVE_FREQ,
                speed: this.SPEED,
                height: this.HEIGHT
            });
        }
    }

    resize() {
        this.init();
    }

    setDragonMode(on) {
        this.colors = on ? this.dragonColors : this.normalColors;
    }

    getSurfaceY(worldX) {
        const idx = Math.round(worldX / this.WAVE_FREQ);
        if (idx >= 0 && idx < this.springs.length) {
            return this.START_Y + (this.springs[idx].height - this.HEIGHT);
        }
        return this.START_Y;
    }

    splash(index, speed) {
        if (index >= 0 && index < this.springs.length) {
            this.springs[index].speed = speed;
            this._createSplashParticles(index, speed);
        }
    }

    splashAtX(worldX, speed) {
        const idx = this._getRealX(worldX);
        this.splash(idx, speed);
    }

    _getRealX(x) {
        if (x > 0) return Math.ceil(x / this.WAVE_FREQ);
        if (x < 0) return Math.floor(x / this.WAVE_FREQ);
        return 0;
    }

    _createSplashParticles(springIdx, speed) {
        const y = this.START_Y + (this.springs[springIdx].height - this.HEIGHT);
        const x = springIdx * this.WAVE_FREQ;
        const count = Math.min(Math.floor(Math.abs(speed) / 3), 40); // Generate way more particles faster
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 8;
            const vy = -Math.random() * Math.sqrt(Math.abs(speed)) * 2.5;
            const r = 2 + Math.random() * 6;
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                vx: vx,
                vy: vy,
                gy: 0.35,
                r: r,
                alpha: 1
            });
        }
    }

    update() {
        // Add random ambient choppiness occasionally
        if (Math.random() < 0.08) {
            const randomIdx = Math.floor(Math.random() * this.springs.length);
            this.springs[randomIdx].speed += (Math.random() - 0.5) * 15;
        }

        // Update springs
        for (let i = 0; i < this.springs.length; i++) {
            const s = this.springs[i];
            const x = this.HEIGHT - s.height;
            s.speed += this.TENSION * x - s.speed * this.DAMP;
            s.height += s.speed;
        }

        const leftDeltas = new Array(this.springs.length).fill(0);
        const rightDeltas = new Array(this.springs.length).fill(0);

        for (let j = 0; j < this.WAV_PASS; j++) {
            for (let i = 0; i < this.springs.length; i++) {
                if (i > 0) {
                    leftDeltas[i] = this.SPREAD * (this.springs[i].height - this.springs[i - 1].height);
                    this.springs[i - 1].speed += leftDeltas[i];
                }
                if (i < this.springs.length - 1) {
                    rightDeltas[i] = this.SPREAD * (this.springs[i].height - this.springs[i + 1].height);
                    this.springs[i + 1].speed += rightDeltas[i];
                }
            }
            for (let i = 0; i < this.springs.length; i++) {
                if (i > 0) this.springs[i - 1].height += leftDeltas[i];
                if (i < this.springs.length - 1) this.springs[i + 1].height += rightDeltas[i];
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gy;
            p.alpha -= 0.008;
            if (p.y > this.canvas.height + 50 || p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        const c = this.colors;

        // Draw water body
        for (let i = 0; i < this.springs.length - 1; i++) {
            const s1 = this.springs[i];
            const s2 = this.springs[i + 1];
            const h1 = this.START_Y + (s1.height - this.HEIGHT);
            const h2 = this.START_Y + (s2.height - this.HEIGHT);

            const grd = ctx.createLinearGradient(0, Math.min(h1, h2), 0, this.END_Y);
            grd.addColorStop(0, c.col1);
            grd.addColorStop(0.30, c.col2);
            grd.addColorStop(0.5, c.col3);
            grd.addColorStop(0.96, c.col4);

            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.moveTo(s1.x, h1);
            ctx.lineTo(s2.x, h2);
            ctx.lineTo(s2.x, this.END_Y);
            ctx.lineTo(s1.x, this.END_Y);
            ctx.closePath();
            ctx.fill();
        }

        // Draw surface highlight
        ctx.beginPath();
        ctx.moveTo(0, this.START_Y);
        for (let i = 0; i < this.springs.length; i++) {
            const s = this.springs[i];
            const h = this.START_Y + (s.height - this.HEIGHT);
            ctx.lineTo(s.x, h);
        }
        ctx.strokeStyle = 'rgba(140, 220, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw splash particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
            ctx.fill();
            ctx.restore();
        }
    }
}
