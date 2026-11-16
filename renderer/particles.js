// Heart Particle System for Petting & Purring

class HeartParticle {
  constructor(x, y, options = {}) {
    // Spawn right around head with slight horizontal spread
    const sideOffset = options.sideOffset !== undefined ? options.sideOffset : (Math.random() - 0.5) * 14;
    this.baseX = x + sideOffset;
    this.x = this.baseX;
    this.y = y - 4 + (Math.random() - 0.5) * 6;
    
    // Gentle short float (~25-35px total height, doesn't float far across screen)
    this.vy = -(0.55 + Math.random() * 0.25);
    this.swaySpeed = 2.5 + Math.random() * 1.5;
    this.swayAmp = 3 + Math.random() * 3; // Tight, gentle sway
    this.phase = Math.random() * Math.PI * 2;

    this.size = options.size || (18 + Math.floor(Math.random() * 5)); // 18px to 22px
    this.maxLife = 900 + Math.random() * 300; // ~0.9s to 1.2s duration
    this.life = 0;
    this.rotation = (Math.random() - 0.5) * 0.25; // Gentle tilt
  }

  update(dt) {
    this.life += dt;
    const progress = this.life / this.maxLife;

    // Upward float
    this.y += this.vy * (dt / 16.6);

    // Sinusoidal horizontal sway
    const timeSec = this.life / 1000;
    this.x = this.baseX + Math.sin(timeSec * this.swaySpeed + this.phase) * this.swayAmp;

    return progress < 1.0;
  }

  render(ctx, heartCanvases) {
    const progress = this.life / this.maxLife;

    // Fade in quickly, stay solid, fade out softly before floating too far
    let alpha = 1.0;
    if (progress < 0.15) {
      alpha = progress / 0.15;
    } else if (progress > 0.6) {
      alpha = 1.0 - (progress - 0.6) / 0.4;
    }

    // Scale pop-in
    let scale = 1.0;
    if (progress < 0.2) {
      scale = 0.6 + (progress / 0.2) * 0.5; // 0.6 -> 1.1
    } else if (progress < 0.35) {
      scale = 1.1 - ((progress - 0.2) / 0.15) * 0.1; // 1.1 -> 1.0
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(scale, scale);

    // Pick closest cached pixel heart canvas
    const key = Math.min(26, Math.max(18, Math.round(this.size)));
    const canvas = heartCanvases[key] || heartCanvases[20];

    if (canvas) {
      ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    }

    ctx.restore();
  }
}

class HeartParticleSystem {
  constructor() {
    this.particles = [];
    this.heartCanvases = {};
    this.initHeartCanvases();
  }

  // Pre-render pixel art hearts at various sizes for maximum sharpness & 60fps performance
  initHeartCanvases() {
    // 8x7 pixel art heart matrix
    const grid = [
      [0, 1, 1, 0, 0, 1, 1, 0],
      [1, 2, 2, 1, 1, 3, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [0, 1, 2, 2, 2, 2, 1, 0],
      [0, 0, 1, 2, 2, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0]
    ];

    const colors = {
      1: '#3D0216', // Dark ruby outline for contrast on any background
      2: '#FF1E56', // Vibrant bright neon ruby-pink fill
      3: '#FFFFFF'  // White highlight gleam
    };

    for (let targetSize = 16; targetSize <= 28; targetSize += 2) {
      const pixelSize = Math.max(2, Math.round(targetSize / 8));
      const w = 8 * pixelSize;
      const h = 7 * pixelSize;

      const c = document.createElement('canvas');
      c.width = w + 4;
      c.height = h + 4;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      for (let r = 0; r < 7; r++) {
        for (let col = 0; col < 8; col++) {
          const val = grid[r][col];
          if (val && colors[val]) {
            ctx.fillStyle = colors[val];
            ctx.fillRect(2 + col * pixelSize, 2 + r * pixelSize, pixelSize, pixelSize);
          }
        }
      }
      this.heartCanvases[targetSize] = c;
    }
  }

  // Generate exactly 2 hearts per click, paired nicely around the head
  spawnPair(x, y) {
    // Heart 1: slightly to the left
    this.particles.push(new HeartParticle(x, y, {
      sideOffset: -8 - Math.random() * 4,
      size: 19 + Math.floor(Math.random() * 4)
    }));
    // Heart 2: slightly to the right
    this.particles.push(new HeartParticle(x, y, {
      sideOffset: 8 + Math.random() * 4,
      size: 19 + Math.floor(Math.random() * 4)
    }));
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const alive = this.particles[i].update(dt);
      if (!alive) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      p.render(ctx, this.heartCanvases);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HeartParticleSystem };
}
