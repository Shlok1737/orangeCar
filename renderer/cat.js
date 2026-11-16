// Cat Entity with Physics, Drag & Drop, Sprite Animation, and Rendering

class Cat {
  constructor(config, spriteGenerator, screenInfo) {
    this.config = config;
    this.spriteGen = spriteGenerator;
    this.screenInfo = screenInfo || {
      bounds: { width: window.innerWidth, height: window.innerHeight },
      workArea: { height: window.innerHeight - 40 }
    };

    // Load sprites: prefer the user reference sprite set if available
    if (typeof REF_CAT_SPRITES !== 'undefined' && REF_CAT_SPRITES) {
      this.sprites = {};
      for (const [state, urlList] of Object.entries(REF_CAT_SPRITES)) {
        this.sprites[state] = urlList.map(url => {
          const img = new Image();
          img.src = url;
          return img;
        });
      }
    } else {
      this.sprites = this.spriteGen.generateAll();
    }
    this.customSprites = null;

    // Dimensions (41x33 native grid matching the reference pixel art)
    this.baseWidth = 41;
    this.baseHeight = 33;
    this.scale = this.config?.display?.scale || 1.5;
    this.width = Math.round(this.baseWidth * this.scale);
    this.height = Math.round(this.baseHeight * this.scale);

    // Calculate ground floor (just above taskbar)
    this.updateFloor();

    // Position & Physics
    this.x = (this.screenInfo.bounds.width - this.width) / 2;
    this.y = this.floorY;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1; // 1 = right, -1 = left
    this.isGrounded = true;

    // Dragging
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.lastDragMouseX = 0;
    this.lastDragMouseY = 0;
    this.dragVelocityX = 0;
    this.dragVelocityY = 0;

    // Animation
    this.currentState = 'idle';
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.fps = this.config?.sprites?.frameRate || 8;

    // OIIA 3D Spin Simulation Variables
    this.oiiaSpinAngle = 0;
    this.oiiaSpinSpeed = 1.2;
  }

  setMusicEnergy(volume, bass) {
    const musicCfg = this.config?.behaviors?.music || {};
    const baseSpeed = musicCfg.baseSpinSpeed || 1.2;
    const maxSpeed = musicCfg.maxSpinSpeed || 5.0;
    const beatSens = musicCfg.beatSensitivity || 1.5;

    const targetSpeed = baseSpeed + (maxSpeed - baseSpeed) * Math.min(1.0, (volume * 0.5 + bass * 0.5) * beatSens);
    this.oiiaSpinSpeed += (targetSpeed - this.oiiaSpinSpeed) * 0.25;
  }

  getHeadPosition() {
    const isFacingRight = this.facing === 1;
    const headX = isFacingRight
      ? this.x + this.width * 0.72
      : this.x + this.width * 0.28;
    const headY = this.y + this.height * 0.25;
    return { x: headX, y: headY };
  }

  updateFloor() {
    const floorOffset = this.config?.display?.floorOffset ?? 4;
    // workArea.height gives height excluding taskbar
    const workHeight = this.screenInfo?.workArea?.height || window.innerHeight - 40;
    this.floorY = workHeight - this.height + floorOffset;
  }

  updateConfig(newConfig) {
    this.config = newConfig;
    this.scale = this.config?.display?.scale || 3;
    this.width = (this.baseWidth || 41) * this.scale;
    this.height = (this.baseHeight || 33) * this.scale;
    this.fps = this.config?.sprites?.frameRate || 8;
    this.updateFloor();
  }

  updateScreenInfo(screenInfo) {
    this.screenInfo = screenInfo;
    this.updateFloor();
    // Keep cat inside bounds if display resized
    this.x = Math.max(0, Math.min(this.screenInfo.bounds.width - this.width, this.x));
    if (this.y > this.floorY) {
      this.y = this.floorY;
      this.vy = 0;
      this.isGrounded = true;
    }
  }

  setState(state) {
    if (this.currentState !== state) {
      this.currentState = state;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }
  }

  startDrag(mouseX, mouseY) {
    this.isDragging = true;
    this.dragOffsetX = mouseX - this.x;
    this.dragOffsetY = mouseY - this.y;
    this.lastDragMouseX = mouseX;
    this.lastDragMouseY = mouseY;
    this.dragVelocityX = 0;
    this.dragVelocityY = 0;
    this.isGrounded = false;
    this.vx = 0;
    this.vy = 0;
  }

  updateDrag(mouseX, mouseY) {
    if (!this.isDragging) return;

    this.dragVelocityX = (mouseX - this.lastDragMouseX) * 0.5;
    this.dragVelocityY = (mouseY - this.lastDragMouseY) * 0.5;
    this.lastDragMouseX = mouseX;
    this.lastDragMouseY = mouseY;

    this.x = mouseX - this.dragOffsetX;
    this.y = mouseY - this.dragOffsetY;

    // Keep horizontally on screen
    const maxW = this.screenInfo.bounds.width - this.width;
    this.x = Math.max(0, Math.min(maxW, this.x));
  }

  endDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;
    // Impart mouse release velocity (throwing cat gently)
    this.vx = Math.max(-10, Math.min(10, this.dragVelocityX));
    this.vy = Math.max(-10, Math.min(10, this.dragVelocityY));
  }

  containsPoint(px, py) {
    const pad = 6; // forgiving click padding
    return (
      px >= this.x - pad &&
      px <= this.x + this.width + pad &&
      py >= this.y - pad &&
      py <= this.y + this.height + pad
    );
  }

  update(dt, stateMachine) {
    const physics = this.config?.physics || { gravity: 0.65, terminalVelocity: 18, bounce: 0.15, friction: 0.88 };
    const movement = this.config?.movement || { walkSpeed: 1.4, zoomiesSpeed: 5.2, directionChangeChance: 0.02 };

    const screenWidth = this.screenInfo.bounds.width;

    if (this.isDragging) {
      // While dragging, state is dragged
      return;
    }

    // 1. Vertical Physics (Gravity & Floor)
    if (!this.isGrounded) {
      this.vy += physics.gravity;
      if (this.vy > physics.terminalVelocity) {
        this.vy = physics.terminalVelocity;
      }
      this.y += this.vy;

      // Air resistance
      this.vx *= 0.98;
      this.x += this.vx;

      // Floor collision check
      if (this.y >= this.floorY) {
        this.y = this.floorY;
        if (Math.abs(this.vy) > 3) {
          // Bounce
          this.vy = -this.vy * physics.bounce;
        } else {
          this.vy = 0;
          this.isGrounded = true;
        }
      }
    } else {
      // Cat is on the floor
      this.y = this.floorY;
      this.vy = 0;

      // State-specific horizontal movement
      if (this.currentState === 'walk') {
        const speed = movement.walkSpeed || 1.4;
        this.x += this.facing * speed;

        // Occasional random direction change
        if (Math.random() < (movement.directionChangeChance || 0.02)) {
          this.facing *= -1;
        }
      } else if (this.currentState === 'zoomies') {
        const speed = movement.zoomiesSpeed || 5.2;
        this.x += this.facing * speed;
      } else if (this.currentState === 'dance') {
        // Spin angle advance during OIIA dance
        this.oiiaSpinAngle += (this.oiiaSpinSpeed || 1.2) * (dt / 1000) * Math.PI * 2;
        this.vx *= 0.8;
        this.x += this.vx;
      } else {
        // Friction when stopping
        this.vx *= physics.friction;
        this.x += this.vx;
      }
    }

    // Screen Boundary Bounce / Flip
    const maxX = screenWidth - this.width;
    if (this.x <= 0) {
      this.x = 0;
      this.facing = 1;
      this.vx = Math.abs(this.vx) * 0.5;
    } else if (this.x >= maxX) {
      this.x = maxX;
      this.facing = -1;
      this.vx = -Math.abs(this.vx) * 0.5;
    }

    // 2. Animation Frame Update
    this.frameTimer += dt;
    const frameInterval = 1000 / this.fps;

    if (this.frameTimer >= frameInterval) {
      this.frameTimer = 0;
      const animFrames = this.getCurrentFrames();
      if (animFrames && animFrames.length > 0) {
        this.frameIndex = (this.frameIndex + 1) % animFrames.length;
      }
    }
  }

  getCurrentFrames() {
    return this.sprites[this.currentState] || this.sprites.idle;
  }

  render(ctx) {
    const frames = this.getCurrentFrames();
    if (!frames || frames.length === 0) return;

    const frame = frames[this.frameIndex % frames.length];
    if (!frame) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Handle OIIA spinning cat special rendering mode
    if (this.currentState === 'dance' && this.config?.behaviors?.music?.mode === 'oiia') {
      this.renderOiiaSpin(ctx, frame);
      ctx.restore();
      return;
    }

    // Normal rendering
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.translate(centerX, centerY);

    // Flip horizontally when facing left
    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    // Draw frame centered
    ctx.drawImage(
      frame,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    ctx.restore();
  }

  renderOiiaSpin(ctx, frame) {
    // 3D spinning simulation using horizontal scale oscillator + vertical hop/squash
    const scaleX = Math.cos(this.oiiaSpinAngle);
    const hop = Math.abs(Math.sin(this.oiiaSpinAngle)) * 8; // rhythmic hop
    const squash = 1 + (1 - Math.abs(scaleX)) * 0.18; // squash effect as it spins

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2 - hop;

    // Use back frame from sulk when facing away (< 0)
    let drawFrame = frame;
    if (scaleX < 0 && this.sprites.sulk && this.sprites.sulk.length > 0) {
      drawFrame = this.sprites.sulk[0];
    }

    ctx.translate(centerX, centerY);
    const renderScaleX = Math.abs(scaleX) < 0.04 ? (scaleX < 0 ? -0.04 : 0.04) : scaleX;
    ctx.scale(renderScaleX, squash);

    ctx.drawImage(
      drawFrame,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Cat };
}
