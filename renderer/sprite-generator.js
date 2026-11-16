// Procedural 32x32 Pixel Art Orange Tabby Cat Sprite Generator
// Generates crisp retro sprite sheets in code, with full palette and frame sets

const PALETTE = {
  furBase: '#E87A24',       // Classic ginger orange
  furLight: '#FF9E4A',      // Highlight / upper fur
  furShadow: '#B3530E',     // Shadow / underfur
  furDark: '#853205',       // Tabby stripes
  white: '#FFF4EA',         // White muzzle, chest, belly, socks
  whiteShadow: '#D8C6B6',   // Shadow for white fur
  earInner: '#FFAFA8',      // Pink inside ears
  nose: '#FF7B7B',          // Pink button nose
  eyeGreen: '#32A852',      // Emerald cat eyes
  eyePupil: '#151515',      // Slit pupil
  eyeGlint: '#FFFFFF',      // White highlight in eye
  eyeClosed: '#5E2805',     // Sleeping/closed eye line
  mouth: '#732C03',         // Muzzle line
  whisker: '#FFEADB',       // Pale whiskers
  outline: '#4A1D03',       // Dark outline
  heartRed: '#FF3366',      // Heart for purr
  heartPink: '#FFAAC0',
  tearBlue: '#5AC8FA',      // Sulk mark
  swatClaw: '#FFFFFF',      // Claw swipe streak
  dizzyStar: '#FFD700',     // Gold dizzy stars
  zzz: '#88B0EB'            // Sleep Zzz
};

class SpriteGenerator {
  constructor(pixelSize = 32) {
    this.width = pixelSize;
    this.height = pixelSize;
    this.cache = {};
  }

  createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  // Draw 1 pixel
  p(ctx, x, y, color) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }

  // Draw rectangle of pixels
  r(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  // Generate all animation sprite frames
  generateAll() {
    const sprites = {
      idle: this.generateIdle(),
      walk: this.generateWalk(),
      sit: this.generateSit(),
      sleep: this.generateSleep(),
      purr: this.generatePurr(),
      smack: this.generateSmack(),
      dance: this.generateDance(),
      sulk: this.generateSulk(),
      zoomies: this.generateZoomies(),
      dragged: this.generateDragged(),
      falling: this.generateFalling(),
      dizzy: this.generateDizzy()
    };
    return sprites;
  }

  // -------------------------------------------------------------
  // 1. IDLE (4 frames)
  // Gentle breathing, blinking, soft tail flick
  // -------------------------------------------------------------
  generateIdle() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const { canvas, ctx } = this.createCanvas();
      const breath = f === 1 ? -1 : 0;
      const blink = f === 2;
      const tailWag = f === 3 ? 1 : 0;

      // Tail
      this.drawTail(ctx, 6 + tailWag, 20 + breath, 'up-curve');

      // Hind leg / body base
      this.r(ctx, 8, 20 + breath, 15, 6, PALETTE.furBase);
      this.r(ctx, 9, 26, 4, 3, PALETTE.furShadow); // back legs
      this.r(ctx, 9, 28, 4, 2, PALETTE.white);     // back white socks
      this.r(ctx, 19, 26, 4, 3, PALETTE.furBase);  // front legs
      this.r(ctx, 19, 28, 4, 2, PALETTE.white);    // front white paws

      // Body highlights & tabby stripes
      this.r(ctx, 10, 20 + breath, 12, 2, PALETTE.furLight);
      this.r(ctx, 11, 21 + breath, 2, 4, PALETTE.furDark);
      this.r(ctx, 15, 21 + breath, 2, 4, PALETTE.furDark);
      this.r(ctx, 19, 22 + breath, 2, 3, PALETTE.furDark);

      // Chest & Belly white patch
      this.r(ctx, 13, 23 + breath, 7, 3, PALETTE.white);

      // Head
      const hx = 18;
      const hy = 13 + breath;
      this.drawHead(ctx, hx, hy, { blink, direction: 'right' });

      frames.push(canvas);
    }
    return frames;
  }

  // -------------------------------------------------------------
  // 2. WALK (6 frames)
  // Natural 4-legged quadruped trot cycle
  // -------------------------------------------------------------
  generateWalk() {
    const frames = [];
    const legOffsets = [
      { fl: 0, fr: -2, bl: -2, br: 1, bob: 0, tail: 0 },
      { fl: 1, fr: -1, bl: -1, br: 2, bob: -1, tail: -1 },
      { fl: 2, fr: 0, bl: 0, br: -1, bob: 0, tail: -1 },
      { fl: 0, fr: 2, bl: 2, br: -2, bob: 0, tail: 0 },
      { fl: -1, fr: 1, bl: 1, br: -1, bob: -1, tail: 1 },
      { fl: -2, fr: 0, bl: 0, br: 1, bob: 0, tail: 1 }
    ];

    for (let f = 0; f < 6; f++) {
      const { canvas, ctx } = this.createCanvas();
      const o = legOffsets[f];

      // Tail bobbing
      this.drawTail(ctx, 6, 19 + o.bob, 'trot', o.tail);

      // Body
      this.r(ctx, 8, 19 + o.bob, 15, 6, PALETTE.furBase);
      this.r(ctx, 10, 19 + o.bob, 12, 2, PALETTE.furLight);
      // Stripes
      this.r(ctx, 11, 20 + o.bob, 2, 4, PALETTE.furDark);
      this.r(ctx, 15, 20 + o.bob, 2, 4, PALETTE.furDark);
      // White belly
      this.r(ctx, 13, 22 + o.bob, 6, 3, PALETTE.white);

      // Back legs (behind body)
      this.r(ctx, 8 + o.bl, 25, 3, 3, PALETTE.furShadow);
      this.r(ctx, 8 + o.bl, 28, 3, 2, PALETTE.whiteShadow);
      this.r(ctx, 18 + o.fl, 25, 3, 3, PALETTE.furShadow);
      this.r(ctx, 18 + o.fl, 28, 3, 2, PALETTE.whiteShadow);

      // Front-most legs
      this.r(ctx, 11 + o.br, 25, 3, 3, PALETTE.furBase);
      this.r(ctx, 11 + o.br, 28, 3, 2, PALETTE.white);
      this.r(ctx, 20 + o.fr, 25, 3, 3, PALETTE.furBase);
      this.r(ctx, 20 + o.fr, 28, 3, 2, PALETTE.white);

      // Head
      this.drawHead(ctx, 18, 13 + o.bob, { blink: false, direction: 'right' });

      frames.push(canvas);
    }
    return frames;
  }

  // -------------------------------------------------------------
  // 3. SIT (4 frames)
  // Upright resting loaf posture
  // -------------------------------------------------------------
  generateSit() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const { canvas, ctx } = this.createCanvas();
      const earTwitch = f === 3;
      const slowBlink = f === 2;
      const tailTip = f === 1 ? -1 : 0;

      // Tail curled around front paws
      this.r(ctx, 7, 27, 16, 2, PALETTE.furDark);
      this.p(ctx, 23 + tailTip, 26, PALETTE.furBase);
      this.p(ctx, 23 + tailTip, 25, PALETTE.furLight);

      // Lower body / haunches
      this.r(ctx, 8, 22, 13, 6, PALETTE.furBase);
      this.r(ctx, 7, 24, 4, 4, PALETTE.furShadow); // rear haunch curve
      this.r(ctx, 14, 24, 7, 5, PALETTE.furBase);  // upright chest
      this.r(ctx, 15, 24, 5, 5, PALETTE.white);    // white chest & bib

      // Tabby side stripes
      this.r(ctx, 10, 22, 2, 4, PALETTE.furDark);
      this.r(ctx, 12, 23, 2, 3, PALETTE.furDark);

      // Front paws neatly parked
      this.r(ctx, 17, 27, 4, 3, PALETTE.white);

      // Head upright
      this.drawHead(ctx, 14, 11, { blink: slowBlink, earTwitch, direction: 'right' });

      frames.push(canvas);
    }
    return frames;
  }

  // -------------------------------------------------------------
  // 4. SLEEP (4 frames)
  // Curled loaf, rhythmic breathing, cute Zzz bubbles
  // -------------------------------------------------------------
  generateSleep() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const { canvas, ctx } = this.createCanvas();
      const expand = f === 1 || f === 2 ? 1 : 0;

      // Curled round body
      this.r(ctx, 7, 22 - expand, 18, 8 + expand, PALETTE.furBase);
      this.r(ctx, 9, 21 - expand, 14, 2, PALETTE.furLight);
      // Tabby stripes arching over curled back
      this.r(ctx, 11, 21 - expand, 2, 6, PALETTE.furDark);
      this.r(ctx, 15, 21 - expand, 2, 7, PALETTE.furDark);
      this.r(ctx, 19, 22 - expand, 2, 6, PALETTE.furDark);

      // Tail tucked in wrap
      this.r(ctx, 5, 25, 3, 4, PALETTE.furBase);
      this.r(ctx, 6, 27, 5, 2, PALETTE.furDark);

      // Nose tucked in paw
      this.r(ctx, 21, 23, 4, 4, PALETTE.white);
      this.p(ctx, 23, 24, PALETTE.nose);

      // Sleeping curved eye ^
      this.p(ctx, 19, 22, PALETTE.eyeClosed);
      this.p(ctx, 20, 21, PALETTE.eyeClosed);
      this.p(ctx, 21, 22, PALETTE.eyeClosed);

      // Ear curled back
      this.r(ctx, 16, 19 - expand, 3, 3, PALETTE.furBase);
      this.p(ctx, 17, 20 - expand, PALETTE.earInner);

      // Zzz floating
      const zY = 16 - f * 3;
      const zX = 22 + (f % 2 === 0 ? 1 : -1);
      if (f > 0) {
        this.drawZ(ctx, zX, zY, f === 3 ? 5 : 4, PALETTE.zzz);
      }

      frames.push(canvas);
    }
    return frames;
  }

  // -------------------------------------------------------------
  // 5. PURR (4 frames)
  // Blissful petting reaction, hearts, vibration
  // -------------------------------------------------------------
  generatePurr() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const { canvas, ctx } = this.createCanvas();
      const shiver = f % 2 === 1 ? 1 : 0; // Happy shiver

      // Body vibrating with pleasure
      this.r(ctx, 8 + shiver, 20, 15, 7, PALETTE.furBase);
      this.r(ctx, 10 + shiver, 20, 12, 2, PALETTE.furLight);
      this.r(ctx, 11 + shiver, 21, 2, 4, PALETTE.furDark);
      this.r(ctx, 15 + shiver, 21, 2, 4, PALETTE.furDark);
      this.r(ctx, 13 + shiver, 23, 7, 4, PALETTE.white); // white bib
      this.r(ctx, 9 + shiver, 27, 4, 3, PALETTE.white);
      this.r(ctx, 18 + shiver, 27, 4, 3, PALETTE.white);

      // Tail swaying happily upright
      this.drawTail(ctx, 6 + shiver, 19, 'happy-curve', f);

      // Head tilted blissfully upward
      const hx = 18 + shiver;
      const hy = 12;
      this.drawHead(ctx, hx, hy, { happySquint: true, blush: true, direction: 'right' });

      // Floating Pink Heart (♥)
      const heartY = 8 - f * 2;
      const heartX = 23 + (f % 2 === 0 ? 0 : 2);
      this.drawHeart(ctx, heartX, heartY, f < 3 ? PALETTE.heartRed : PALETTE.heartPink);

      frames.push(canvas);
    }
    return frames;
  }

  // -------------------------------------------------------------
  // 6. SMACK (4 frames)
  // Rears up, swats paw forward with claw swipe streak
  // -------------------------------------------------------------
  generateSmack() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const { canvas, ctx } = this.createCanvas();

      if (f === 0) {
        // Crouch prepare
        this.r(ctx, 6, 22, 16, 6, PALETTE.furBase);
        this.r(ctx, 8, 28, 4, 2, PALETTE.white);
        this.r(ctx, 16, 28, 4, 2, PALETTE.white);
        this.drawTail(ctx, 4, 23, 'low');
        this.drawHead(ctx, 17, 16, { wideEyes: true, direction: 'right' });
      } else if (f === 1) {
        // Rear up, paw raised high!
        this.r(ctx, 8, 18, 12, 10, PALETTE.furBase);
        this.r(ctx, 8, 27, 5, 3, PALETTE.white); // standing on hind legs
        this.r(ctx, 10, 20, 8, 5, PALETTE.white); // white belly visible
        this.drawTail(ctx, 5, 22, 'excited');
        this.drawHead(ctx, 16, 9, { wideEyes: true, direction: 'right' });
        // Paw pulled back
        this.r(ctx, 20, 10, 4, 4, PALETTE.furBase);
        this.r(ctx, 22, 9, 3, 3, PALETTE.white);
      } else if (f === 2) {
        // SWIPE FORWARD! Impact!
        this.r(ctx, 8, 19, 13, 9, PALETTE.furBase);
        this.r(ctx, 8, 27, 5, 3, PALETTE.white);
        this.drawTail(ctx, 5, 23, 'excited');
        this.drawHead(ctx, 16, 11, { angryEyes: true, direction: 'right' });

        // Paw stretched all the way out
        this.r(ctx, 22, 14, 7, 3, PALETTE.furBase);
        this.r(ctx, 27, 13, 4, 4, PALETTE.white);

        // Claw slash arcs (///)
        ctx.strokeStyle = PALETTE.swatClaw;
        ctx.lineWidth = 1.5;
        this.p(ctx, 29, 10, PALETTE.swatClaw);
        this.p(ctx, 30, 12, PALETTE.swatClaw);
        this.p(ctx, 30, 15, PALETTE.swatClaw);
        this.p(ctx, 31, 11, PALETTE.swatClaw);
        this.p(ctx, 31, 14, PALETTE.swatClaw);
        this.p(ctx, 28, 9, PALETTE.furLight);
      } else {
        // Recovery
        this.r(ctx, 8, 20, 14, 7, PALETTE.furBase);
        this.r(ctx, 8, 27, 4, 3, PALETTE.white);
        this.r(ctx, 18, 27, 4, 3, PALETTE.white);
        this.drawTail(ctx, 6, 20, 'up-curve');
        this.drawHead(ctx, 17, 13, { direction: 'right' });
      }

      frames.push(canvas);
    }
    return frames;
  }

  // -------------------------------------------------------------
  // 7. DANCE (6 frames)
  // Upright swaying, paws alternate, musical fun
  // -------------------------------------------------------------
  generateDance() {
    const frames = [];
    for (let f = 0; f < 6; f++) {
      const { canvas, ctx } = this.createCanvas();
      const tilt = f % 2 === 0 ? -1 : 1;
      const hop = (f === 1 || f === 4) ? -2 : 0;

      // Upright body
      this.r(ctx, 10 + tilt, 16 + hop, 11, 10, PALETTE.furBase);
      this.r(ctx, 12 + tilt, 17 + hop, 7, 7, PALETTE.white); // belly
      this.r(ctx, 11 + tilt, 18 + hop, 2, 4, PALETTE.furDark);
      this.r(ctx, 18 + tilt, 18 + hop, 2, 4, PALETTE.furDark);

      // Little paws raised up
      if (f % 2 === 0) {
        this.r(ctx, 7 + tilt, 14 + hop, 3, 4, PALETTE.white);
        this.r(ctx, 21 + tilt, 18 + hop, 3, 4, PALETTE.white);
      } else {
        this.r(ctx, 7 + tilt, 18 + hop, 3, 4, PALETTE.white);
        this.r(ctx, 21 + tilt, 14 + hop, 3, 4, PALETTE.white);
      }

      // Feet on floor
      this.r(ctx, 10, 27 + hop, 4, 3, PALETTE.white);
      this.r(ctx, 17, 27 + hop, 4, 3, PALETTE.white);

      // Tail swaying
      this.drawTail(ctx, 8 + tilt, 22 + hop, 'dance', f);

      // Head
      this.drawHead(ctx, 12 + tilt, 8 + hop, { happySquint: true, direction: 'front' });

      // Musical note floating
      if (f === 2 || f === 5) {
        this.drawMusicNote(ctx, 23, 7 + hop, PALETTE.earInner);
      }

      frames.push(canvas);
    }
    return frames;
  }

  // -------------------------------------------------------------
  // 8. SULK (4 frames)
  // Back turned, ears drooped flat, gloomy mood
  // -------------------------------------------------------------
  generateSulk() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const { canvas, ctx } = this.createCanvas();
      const slump = f === 1 ? 1 : 0;

      // Cat back body (viewed from rear)
      this.r(ctx, 9, 18 + slump, 14, 10, PALETTE.furBase);
      this.r(ctx, 11, 19 + slump, 10, 2, PALETTE.furLight);

      // Back tabby dorsal stripe spine pattern
      this.r(ctx, 15, 18 + slump, 2, 8, PALETTE.furDark);
      this.r(ctx, 11, 21 + slump, 3, 2, PALETTE.furDark);
      this.r(ctx, 18, 21 + slump, 3, 2, PALETTE.furDark);
      this.r(ctx, 11, 25 + slump, 3, 2, PALETTE.furDark);
      this.r(ctx, 18, 25 + slump, 3, 2, PALETTE.furDark);

      // Paws sitting on ground
      this.r(ctx, 8, 27, 4, 3, PALETTE.furShadow);
      this.r(ctx, 19, 27, 4, 3, PALETTE.furShadow);

      // Drooping tail flat on floor, twitching slightly
      const tailTwitch = f === 2 ? 1 : 0;
      this.r(ctx, 6, 27 + tailTwitch, 8, 2, PALETTE.furDark);
      this.p(ctx, 5, 28 + tailTwitch, PALETTE.furBase);

      // Back of head (no eyes visible, ears flattened out!)
      this.r(ctx, 11, 11 + slump, 10, 8, PALETTE.furBase);
      this.r(ctx, 13, 11 + slump, 6, 2, PALETTE.furLight);
      this.r(ctx, 15, 11 + slump, 2, 4, PALETTE.furDark); // stripes on back of head
      // Drooped ears (airplane/flattened ears)
      this.r(ctx, 8, 13 + slump, 3, 2, PALETTE.furBase);
      this.r(ctx, 21, 13 + slump, 3, 2, PALETTE.furBase);

      // Gloomy scribble or drop
      if (f % 2 === 0) {
        this.p(ctx, 22, 6, PALETTE.tearBlue);
        this.p(ctx, 23, 7, PALETTE.tearBlue);
        this.p(ctx, 24, 7, PALETTE.tearBlue);
      }

      frames.push(canvas);
    }
    return frames;
  }

  // -------------------------------------------------------------
  // 9. ZOOMIES (4 frames)
  // Low-flying rocket sprint, airplane ears, dust puff trails
  // -------------------------------------------------------------
  generateZoomies() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const { canvas, ctx } = this.createCanvas();

      // Ultra-low stretched body
      this.r(ctx, 7, 21, 18, 5, PALETTE.furBase);
      this.r(ctx, 8, 21, 16, 2, PALETTE.furLight);
      this.r(ctx, 10, 22, 2, 4, PALETTE.furDark);
      this.r(ctx, 14, 22, 2, 4, PALETTE.furDark);
      this.r(ctx, 18, 22, 2, 4, PALETTE.furDark);

      // Sprinting legs stretched front and back
      if (f % 2 === 0) {
        // Legs stretched far apart
        this.r(ctx, 3, 23, 5, 3, PALETTE.white);
        this.r(ctx, 24, 23, 5, 3, PALETTE.white);
      } else {
        // Legs gathered under belly
        this.r(ctx, 10, 24, 4, 3, PALETTE.white);
        this.r(ctx, 16, 24, 4, 3, PALETTE.white);
      }

      // Straight tail streaming behind
      this.r(ctx, 1, 20, 7, 2, PALETTE.furDark);

      // Head low, airplane ears
      this.r(ctx, 21, 17, 8, 7, PALETTE.furBase);
      this.r(ctx, 24, 20, 5, 3, PALETTE.white); // muzzle
      this.p(ctx, 28, 20, PALETTE.nose);
      this.r(ctx, 24, 18, 3, 2, PALETTE.eyeGreen);
      this.p(ctx, 25, 18, PALETTE.eyePupil);
      // Pinned ears
      this.r(ctx, 18, 17, 4, 2, PALETTE.furBase);

      // Dust puff particles kicked up behind
      this.p(ctx, 1, 26, PALETTE.whiteShadow);
      this.p(ctx, 2, 25, PALETTE.white);
      this.p(ctx, 0, 27, PALETTE.furLight);

      frames.push(canvas);
    }
    return frames;
  }

  // -------------------------------------------------------------
  // 10. DRAGGED (2 frames)
  // Scruff held / hanging paws, comical wide eyes
  // -------------------------------------------------------------
  generateDragged() {
    const frames = [];
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createCanvas();
      const legWiggle = f === 1 ? 1 : 0;

      // Cat hanging vertically
      this.r(ctx, 11, 11, 10, 13, PALETTE.furBase);
      this.r(ctx, 13, 13, 6, 9, PALETTE.white); // belly exposed
      this.r(ctx, 12, 14, 2, 5, PALETTE.furDark);
      this.r(ctx, 18, 14, 2, 5, PALETTE.furDark);

      // Hanging front paws
      this.r(ctx, 9, 14, 3, 5, PALETTE.white);
      this.r(ctx, 20, 14, 3, 5, PALETTE.white);

      // Hanging back legs
      this.r(ctx, 10 + legWiggle, 23, 3, 6, PALETTE.white);
      this.r(ctx, 18 - legWiggle, 23, 3, 6, PALETTE.white);

      // Tail hanging straight down
      this.r(ctx, 15, 23, 2, 7, PALETTE.furDark);

      // Surprised head
      this.drawHead(ctx, 11, 4, { wideEyes: true, direction: 'front' });

      frames.push(canvas);
    }
    return frames;
  }

  // -------------------------------------------------------------
  // 11. FALLING (2 frames)
  // Parachute paws spread out, falling with gravity
  // -------------------------------------------------------------
  generateFalling() {
    const frames = [];
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createCanvas();
      const flail = f === 1 ? -1 : 1;

      // Body spread out
      this.r(ctx, 10, 14, 12, 9, PALETTE.furBase);
      this.r(ctx, 12, 15, 8, 7, PALETTE.white);

      // Spread limbs (flying squirrel cat!)
      this.r(ctx, 6, 12 + flail, 5, 4, PALETTE.white);
      this.r(ctx, 21, 12 - flail, 5, 4, PALETTE.white);
      this.r(ctx, 7, 21 - flail, 5, 4, PALETTE.white);
      this.r(ctx, 20, 21 + flail, 5, 4, PALETTE.white);

      // Flapping tail
      this.r(ctx, 15, 7, 2, 7, PALETTE.furDark);

      // Head looking down anxiously
      this.drawHead(ctx, 11, 15, { wideEyes: true, direction: 'front' });

      frames.push(canvas);
    }
    return frames;
  }

  // -------------------------------------------------------------
  // 12. DIZZY (4 frames)
  // Spiral eyes, wobbly posture, spinning recovery
  // -------------------------------------------------------------
  generateDizzy() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const { canvas, ctx } = this.createCanvas();
      const tilt = f % 2 === 0 ? -1 : 1;

      // Wobbly body
      this.r(ctx, 9 + tilt, 21, 14, 6, PALETTE.furBase);
      this.r(ctx, 10 + tilt, 26, 4, 3, PALETTE.white);
      this.r(ctx, 18 + tilt, 26, 4, 3, PALETTE.white);

      // Limp tail
      this.r(ctx, 6 + tilt, 23, 4, 3, PALETTE.furDark);

      // Head tilted with swirl eyes
      const hx = 13 + tilt * 2;
      const hy = 13;
      this.r(ctx, hx, hy, 10, 8, PALETTE.furBase);
      this.r(ctx, hx + 2, hy + 4, 6, 3, PALETTE.white); // muzzle
      this.p(ctx, hx + 4, hy + 5, PALETTE.nose);

      // Swirly eyes (@ @)
      this.p(ctx, hx + 1, hy + 2, PALETTE.eyePupil);
      this.p(ctx, hx + 2, hy + 1, PALETTE.eyePupil);
      this.p(ctx, hx + 3, hy + 2, PALETTE.eyePupil);
      this.p(ctx, hx + 2, hy + 3, PALETTE.eyePupil);

      this.p(ctx, hx + 6, hy + 2, PALETTE.eyePupil);
      this.p(ctx, hx + 7, hy + 1, PALETTE.eyePupil);
      this.p(ctx, hx + 8, hy + 2, PALETTE.eyePupil);
      this.p(ctx, hx + 7, hy + 3, PALETTE.eyePupil);

      // Ears
      this.r(ctx, hx, hy - 3, 3, 3, PALETTE.furBase);
      this.r(ctx, hx + 7, hy - 3, 3, 3, PALETTE.furBase);

      // Orbiting dizzy star
      const starAngle = (f / 4) * Math.PI * 2;
      const starX = hx + 5 + Math.cos(starAngle) * 7;
      const starY = hy - 4 + Math.sin(starAngle) * 3;
      this.drawStar(ctx, starX, starY, PALETTE.dizzyStar);

      frames.push(canvas);
    }
    return frames;
  }

  // -------------------------------------------------------------
  // HELPER DRAWING METHODS
  // -------------------------------------------------------------
  drawHead(ctx, x, y, opts = {}) {
    const {
      blink = false,
      happySquint = false,
      wideEyes = false,
      angryEyes = false,
      earTwitch = false,
      blush = false,
      direction = 'right'
    } = opts;

    if (direction === 'front') {
      // Front-facing head
      this.r(ctx, x, y, 12, 9, PALETTE.furBase);
      this.r(ctx, x + 2, y, 8, 2, PALETTE.furLight);

      // Tabby forehead stripes
      this.r(ctx, x + 5, y + 1, 2, 3, PALETTE.furDark);
      this.r(ctx, x + 2, y + 2, 2, 2, PALETTE.furDark);
      this.r(ctx, x + 8, y + 2, 2, 2, PALETTE.furDark);

      // Ears
      this.r(ctx, x, y - 4, 3, 4, PALETTE.furBase);
      this.r(ctx, x + 9, y - 4, 3, 4, PALETTE.furBase);
      this.p(ctx, x + 1, y - 2, PALETTE.earInner);
      this.p(ctx, x + 10, y - 2, PALETTE.earInner);

      // Muzzle & nose
      this.r(ctx, x + 3, y + 5, 6, 3, PALETTE.white);
      this.p(ctx, x + 5, y + 5, PALETTE.nose);
      this.p(ctx, x + 6, y + 5, PALETTE.nose);

      // Eyes
      if (happySquint) {
        this.p(ctx, x + 2, y + 3, PALETTE.eyeClosed);
        this.p(ctx, x + 3, y + 2, PALETTE.eyeClosed);
        this.p(ctx, x + 4, y + 3, PALETTE.eyeClosed);
        this.p(ctx, x + 7, y + 3, PALETTE.eyeClosed);
        this.p(ctx, x + 8, y + 2, PALETTE.eyeClosed);
        this.p(ctx, x + 9, y + 3, PALETTE.eyeClosed);
      } else if (wideEyes) {
        this.r(ctx, x + 2, y + 2, 3, 3, PALETTE.eyeGreen);
        this.r(ctx, x + 7, y + 2, 3, 3, PALETTE.eyeGreen);
        this.p(ctx, x + 3, y + 3, PALETTE.eyePupil);
        this.p(ctx, x + 8, y + 3, PALETTE.eyePupil);
      }
      return;
    }

    // Side/Profile Facing Head (facing right)
    this.r(ctx, x, y, 10, 8, PALETTE.furBase);
    this.r(ctx, x + 1, y, 7, 2, PALETTE.furLight);

    // Tabby M stripes on forehead
    this.r(ctx, x + 2, y + 1, 2, 3, PALETTE.furDark);
    this.r(ctx, x + 5, y + 1, 2, 3, PALETTE.furDark);

    // Ears
    const twitchOffset = earTwitch ? -1 : 0;
    this.r(ctx, x + 1, y - 4 + twitchOffset, 3, 4, PALETTE.furBase);
    this.r(ctx, x + 6, y - 4, 3, 4, PALETTE.furBase);
    this.p(ctx, x + 2, y - 2 + twitchOffset, PALETTE.earInner);
    this.p(ctx, x + 7, y - 2, PALETTE.earInner);

    // White muzzle & chin
    this.r(ctx, x + 5, y + 4, 6, 4, PALETTE.white);
    this.p(ctx, x + 9, y + 4, PALETTE.nose); // cute pink nose at snout tip
    this.p(ctx, x + 8, y + 6, PALETTE.mouth);

    // Whiskers (light delicate lines)
    this.p(ctx, x + 10, y + 5, PALETTE.whisker);
    this.p(ctx, x + 11, y + 4, PALETTE.whisker);
    this.p(ctx, x + 10, y + 7, PALETTE.whisker);
    this.p(ctx, x + 11, y + 7, PALETTE.whisker);

    // Eyes
    if (happySquint) {
      this.p(ctx, x + 4, y + 3, PALETTE.eyeClosed);
      this.p(ctx, x + 5, y + 2, PALETTE.eyeClosed);
      this.p(ctx, x + 6, y + 3, PALETTE.eyeClosed);
      if (blush) {
        this.r(ctx, x + 3, y + 5, 2, 1, PALETTE.heartPink);
      }
    } else if (blink) {
      this.r(ctx, x + 4, y + 3, 3, 1, PALETTE.eyeClosed);
    } else if (wideEyes) {
      this.r(ctx, x + 4, y + 1, 3, 4, PALETTE.eyeGreen);
      this.r(ctx, x + 5, y + 2, 2, 2, PALETTE.eyePupil);
      this.p(ctx, x + 4, y + 2, PALETTE.eyeGlint);
    } else if (angryEyes) {
      this.r(ctx, x + 4, y + 2, 3, 2, PALETTE.eyeGreen);
      this.p(ctx, x + 5, y + 2, PALETTE.eyePupil);
      this.p(ctx, x + 3, y + 1, PALETTE.furDark); // slanted eyebrow
      this.p(ctx, x + 4, y + 2, PALETTE.furDark);
    } else {
      // Normal cat eye
      this.r(ctx, x + 4, y + 2, 3, 3, PALETTE.eyeGreen);
      this.r(ctx, x + 5, y + 2, 1, 3, PALETTE.eyePupil); // vertical slit
      this.p(ctx, x + 4, y + 2, PALETTE.eyeGlint);
    }
  }

  drawTail(ctx, x, y, style = 'up-curve', param = 0) {
    if (style === 'up-curve') {
      this.r(ctx, x - 2, y - 1, 3, 2, PALETTE.furBase);
      this.r(ctx, x - 4, y - 4, 3, 4, PALETTE.furBase);
      this.r(ctx, x - 3, y - 7, 3, 4, PALETTE.furLight);
      this.p(ctx, x - 2, y - 8, PALETTE.furDark); // tail tip
      this.p(ctx, x - 3, y - 5, PALETTE.furDark); // tail ring stripe
    } else if (style === 'happy-curve') {
      const wiggle = param % 2 === 0 ? 0 : 1;
      this.r(ctx, x - 2, y, 3, 2, PALETTE.furBase);
      this.r(ctx, x - 4 + wiggle, y - 4, 3, 5, PALETTE.furBase);
      this.r(ctx, x - 2 + wiggle, y - 7, 3, 4, PALETTE.furLight);
      this.p(ctx, x - 1 + wiggle, y - 8, PALETTE.furDark);
    } else if (style === 'trot') {
      const sway = param || 0;
      this.r(ctx, x - 2, y + 1, 3, 2, PALETTE.furBase);
      this.r(ctx, x - 3 + sway, y - 2, 3, 4, PALETTE.furBase);
      this.r(ctx, x - 2 + sway, y - 5, 2, 4, PALETTE.furLight);
      this.p(ctx, x - 1 + sway, y - 6, PALETTE.furDark);
    } else if (style === 'dance') {
      const sway = Math.sin(param) * 2;
      this.r(ctx, x - 2, y, 3, 3, PALETTE.furBase);
      this.r(ctx, x - 4 + sway, y - 3, 3, 4, PALETTE.furBase);
      this.r(ctx, x - 3 + sway, y - 6, 3, 4, PALETTE.furLight);
    } else if (style === 'excited') {
      this.r(ctx, x - 2, y, 3, 2, PALETTE.furBase);
      this.r(ctx, x - 4, y - 3, 3, 4, PALETTE.furBase);
      this.r(ctx, x - 5, y - 7, 3, 5, PALETTE.furDark);
    } else if (style === 'low') {
      this.r(ctx, x - 3, y + 1, 5, 2, PALETTE.furDark);
      this.p(ctx, x - 4, y + 2, PALETTE.furBase);
    }
  }

  drawHeart(ctx, x, y, color) {
    this.r(ctx, x + 1, y, 2, 1, color);
    this.r(ctx, x + 4, y, 2, 1, color);
    this.r(ctx, x, y + 1, 7, 2, color);
    this.r(ctx, x + 1, y + 3, 5, 1, color);
    this.r(ctx, x + 2, y + 4, 3, 1, color);
    this.p(ctx, x + 3, y + 5, color);
  }

  drawZ(ctx, x, y, size = 4, color = PALETTE.zzz) {
    this.r(ctx, x, y, size, 1, color);
    for (let i = 0; i < size; i++) {
      this.p(ctx, x + (size - 1 - i), y + i, color);
    }
    this.r(ctx, x, y + size - 1, size, 1, color);
  }

  drawStar(ctx, x, y, color) {
    this.p(ctx, x, y - 1, color);
    this.p(ctx, x - 1, y, color);
    this.p(ctx, x, y, color);
    this.p(ctx, x + 1, y, color);
    this.p(ctx, x, y + 1, color);
  }

  drawMusicNote(ctx, x, y, color) {
    this.p(ctx, x, y + 3, color);
    this.p(ctx, x + 1, y + 3, color);
    this.p(ctx, x + 1, y + 2, color);
    this.p(ctx, x + 1, y + 1, color);
    this.p(ctx, x + 1, y, color);
    this.p(ctx, x + 2, y, color);
    this.p(ctx, x + 3, y + 1, color);
  }
}

// Export for renderer usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpriteGenerator, PALETTE };
}
