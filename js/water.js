/* ============================================
   WATER PHYSICS ENGINE (Gloop System)
   Based on the 2D-Water-Javascript-Demo spring model
   Enhanced with ambient turbulence, swell, and rolling waves
   ============================================ */

class WaterSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Spring physics parameters
        this.WAVE_FREQ = 5;
        this.WAV_PASS = 8;
        this.K = 0.05;
        this.SPREAD = 0.28;
        this.DAMP = 0.0025;
        this.TENSION = 0.018;
        this.SPEED = 0;

        // Water surface position (fraction of canvas height)
        this.surfaceFraction = 0.58;
        this.START_Y = 0;
        this.END_Y = 0;
        this.HEIGHT = 0;

        this.springs = [];
        this.particles = []; // Splash droplets

        // Ambient wave system — layered sine waves for constant choppiness
        this.time = 0;
        this.ambientWaves = [
            { amplitude: 3.0, frequency: 0.008, speed: 0.04, phase: 0 },
            { amplitude: 1.8, frequency: 0.015, speed: 0.06, phase: 1.2 },
            { amplitude: 1.0, frequency: 0.035, speed: 0.09, phase: 2.5 },
            { amplitude: 0.6, frequency: 0.06, speed: 0.12, phase: 0.7 },
        ];

        // Rolling swell — big slow waves that travel across the screen
        this.swells = [
            { amplitude: 5, wavelength: 400, speed: 1.2, offset: 0 },
            { amplitude: 3, wavelength: 250, speed: -0.8, offset: 100 },
        ];

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
        // Dragon mode = stormier water
        if (on) {
            this.ambientWaves[0].amplitude = 5.0;
            this.ambientWaves[1].amplitude = 3.5;
            this.swells[0].amplitude = 8;
        } else {
            this.ambientWaves[0].amplitude = 3.0;
            this.ambientWaves[1].amplitude = 1.8;
            this.swells[0].amplitude = 5;
        }
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

            // Also disturb neighboring springs for a wider splash
            const radius = Math.min(Math.floor(Math.abs(speed) / 10), 20);
            for (let i = 1; i <= radius; i++) {
                const falloff = 1 - (i / radius);
                if (index - i >= 0) {
                    this.springs[index - i].speed += speed * falloff * 0.5;
                }
                if (index + i < this.springs.length) {
                    this.springs[index + i].speed += speed * falloff * 0.5;
                }
            }

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
        const count = Math.min(Math.floor(Math.abs(speed) / 3), 40);
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 10;
            const vy = -Math.random() * Math.sqrt(Math.abs(speed)) * 3;
            const r = 2 + Math.random() * 6;
            this.particles.push({
                x: x + (Math.random() - 0.5) * 30,
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
        this.time++;

        // ---- Ambient choppiness: random pokes ----
        if (Math.random() < 0.12) {
            const randomIdx = Math.floor(Math.random() * this.springs.length);
            this.springs[randomIdx].speed += (Math.random() - 0.5) * 18;
        }

        // ---- Ambient sine waves: continuous undulation ----
        for (const wave of this.ambientWaves) {
            wave.phase += wave.speed;
            for (let i = 0; i < this.springs.length; i++) {
                const force = Math.sin(i * wave.frequency + wave.phase) * wave.amplitude * 0.02;
                this.springs[i].speed += force;
            }
        }

        // ---- Rolling swells: big slow traveling waves ----
        for (const swell of this.swells) {
            swell.offset += swell.speed;
            for (let i = 0; i < this.springs.length; i++) {
                const worldX = i * this.WAVE_FREQ;
                const force = Math.sin((worldX + swell.offset) / swell.wavelength * Math.PI * 2) * swell.amplitude * 0.008;
                this.springs[i].speed += force;
            }
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

        // Draw surface highlights — double line for foam effect
        ctx.beginPath();
        ctx.moveTo(0, this.START_Y);
        for (let i = 0; i < this.springs.length; i++) {
            const s = this.springs[i];
            const h = this.START_Y + (s.height - this.HEIGHT);
            ctx.lineTo(s.x, h);
        }
        ctx.strokeStyle = 'rgba(180, 235, 255, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Second thinner highlight line
        ctx.beginPath();
        ctx.moveTo(0, this.START_Y);
        for (let i = 0; i < this.springs.length; i++) {
            const s = this.springs[i];
            const h = this.START_Y + (s.height - this.HEIGHT) - 1;
            ctx.lineTo(s.x, h);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
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
