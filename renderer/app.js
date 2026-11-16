// Main Renderer Application Loop

(async function () {
  console.log('[Renderer] Starting Desktop Cat Renderer App...');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const debugOverlay = document.getElementById('debug-overlay');

  // Load Initial Config & Screen Info
  let config = await window.catAPI.getConfig();
  let screenInfo = await window.catAPI.getScreenInfo();
  let appState = await window.catAPI.getState();
  console.log('[Renderer] Config & ScreenInfo loaded:', screenInfo);

  let isPaused = appState?.isPaused || false;
  let oiiaEnabled = appState?.oiiaEnabled !== undefined ? appState.oiiaEnabled : true;
  let isMouseOverCat = false;

  // Setup Canvas Dimensions
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', () => {
    resizeCanvas();
    if (cat) cat.updateFloor();
  });
  resizeCanvas();

  // Instantiate Core Components
  const spriteGen = new SpriteGenerator(config?.sprites?.pixelSize || 32);

  let cat = null;
  const stateMachine = new CatStateMachine(config, (newState, prevState) => {
    if (cat) cat.setState(newState);
    if (config?.display?.debug) {
      console.log(`Cat state transition: ${prevState} -> ${newState}`);
    }
  });

  cat = new Cat(config, spriteGen, screenInfo);
  console.log(`[Renderer] Cat ready at (${Math.round(cat.x)}, ${Math.round(cat.y)}), Floor Y: ${Math.round(cat.floorY)}`);

  // Floating Heart Particle System for Petting
  const heartParticles = new HeartParticleSystem();
  let purrSpawnTimer = 0;

  // Setup Desktop Audio Loopback Analyzer for Music Reaction
  const audioDetector = new AudioReactiveDetector(
    () => {
      // Music Started
      console.log('[Audio] Music detected! Triggering OIIA dance...');
      stateMachine.onDance();
    },
    (volume, bass) => {
      // Music Beat
      if (cat) cat.setMusicEnergy(volume, bass);
    },
    () => {
      // Music Stopped
      console.log('[Audio] Music stopped! Cat getting dizzy...');
      stateMachine.onStopDance();
    }
  );

  // Start audio listening
  audioDetector.start().catch(err => {
    console.warn('[Audio] Could not auto-start audio detector:', err);
  });

  // Test OIIA Spin Handler
  window.catAPI.onTestOiia(() => {
    console.log('[Renderer] Test OIIA spin triggered!');
    stateMachine.onDance();
    if (cat) cat.oiiaSpinSpeed = 3.5;
    setTimeout(() => {
      stateMachine.onStopDance();
    }, 5000);
  });

  // Click & Drag Separation
  let mouseDownPos = null;
  let isDraggingCat = false;
  const clickTimestamps = [];

  function recordInteraction() {
    const now = Date.now();
    window.catAPI.saveState({ lastInteractionTime: now });
  }

  // Mouse Move
  window.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    if (mouseDownPos) {
      const dist = Math.hypot(mouseX - mouseDownPos.x, mouseY - mouseDownPos.y);
      if (!isDraggingCat && dist >= 6) {
        // Drag threshold reached: commence dragging
        isDraggingCat = true;
        cat.startDrag(mouseDownPos.x, mouseDownPos.y);
        stateMachine.onStartDrag();
      }

      if (isDraggingCat) {
        cat.updateDrag(mouseX, mouseY);
        return;
      }
    }

    // Hover hit testing for transparent click-through
    const over = cat.containsPoint(mouseX, mouseY);
    if (over !== isMouseOverCat) {
      isMouseOverCat = over;
      if (isMouseOverCat) {
        window.catAPI.setIgnoreMouseEvents(false);
      } else if (!mouseDownPos) {
        window.catAPI.setIgnoreMouseEvents(true, { forward: true });
      }
    }
  });

  // Mouse Down
  window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only left click

    if (cat.containsPoint(e.clientX, e.clientY)) {
      mouseDownPos = { x: e.clientX, y: e.clientY, time: Date.now() };
      isDraggingCat = false;
      window.catAPI.setIgnoreMouseEvents(false);
    }
  });

  // Mouse Up
  window.addEventListener('mouseup', (e) => {
    if (e.button !== 0 || !mouseDownPos) return;

    if (isDraggingCat) {
      // Finished dragging
      cat.endDrag();
      stateMachine.onEndDrag(cat.isGrounded);
    } else {
      // Pure click / petting interaction!
      handleClickInteraction(e.clientX, e.clientY);
    }

    mouseDownPos = null;
    isDraggingCat = false;

    // Re-check hover
    const over = cat.containsPoint(e.clientX, e.clientY);
    isMouseOverCat = over;
    if (!over) {
      window.catAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  });

  // Handle Click & Rapid Click Reaction
  function handleClickInteraction(cursorX, cursorY) {
    const now = Date.now();
    recordInteraction();

    // Turn to face cursor
    if (cursorX < cat.x + cat.width / 2) {
      cat.facing = -1;
    } else {
      cat.facing = 1;
    }

    const clickCfg = config?.behaviors?.click || {
      rapidClickThreshold: 5,
      rapidClickWindowMs: 2000
    };

    const windowStart = now - (clickCfg.rapidClickWindowMs || 2000);
    clickTimestamps.push(now);
    while (clickTimestamps.length > 0 && clickTimestamps[0] < windowStart) {
      clickTimestamps.shift();
    }

    if (clickTimestamps.length >= (clickCfg.rapidClickThreshold || 5)) {
      console.log('[Cat] Rapid clicks detected! Annoyed swatting...');
      stateMachine.onSwat();
      clickTimestamps.length = 0; // reset
    } else {
      console.log('[Cat] Petted! Purring happily with 2 hearts ♥...');
      stateMachine.onPet();
      const head = cat.getHeadPosition();
      heartParticles.spawnPair(head.x, head.y - 4); // Exactly 2 hearts per click!
    }
  }

  // Hotkey / Tray OIIA Toggle Handler
  window.catAPI.onOiiaToggled((enabled) => {
    console.log('[Renderer] OIIA toggle received:', enabled);
    oiiaEnabled = enabled;
    if (config?.behaviors?.music) {
      config.behaviors.music.oiiaEnabled = enabled;
    }
    if (!enabled && stateMachine.currentState === 'dance') {
      stateMachine.onStopDance();
    }
  });

  // Config Reload Handler (Hot-reloading)
  window.catAPI.onConfigChanged((newConfig) => {
    console.log('Applying updated config...');
    config = newConfig;
    stateMachine.updateConfig(newConfig);
    cat.updateConfig(newConfig);
  });

  // Pause / Resume Handler
  window.catAPI.onPauseToggled((paused) => {
    isPaused = paused;
    if (isPaused) {
      stateMachine.setState('sit');
    } else {
      stateMachine.setState('idle');
    }
  });

  // Main Animation Loop (60 FPS)
  let lastTime = performance.now();

  function loop(currentTime) {
    const dt = Math.min(currentTime - lastTime, 100);
    lastTime = currentTime;

    // Update audio reactive detector
    if (!isPaused) {
      audioDetector.update(dt, oiiaEnabled);
      stateMachine.update(dt, cat.isGrounded);
      cat.update(dt, stateMachine);
    }

    // Update floating heart particles
    heartParticles.update(dt);

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render Cat
    cat.render(ctx);

    // Render Floating Hearts around and above cat's head
    heartParticles.render(ctx);

    // Update Debug Overlay if enabled
    if (config?.display?.debug) {
      debugOverlay.style.display = 'block';
      debugOverlay.innerHTML = `
        State: <b>${stateMachine.currentState}</b><br>
        Pos: (${Math.round(cat.x)}, ${Math.round(cat.y)})<br>
        Scale: ${cat.scale} (${cat.width}x${cat.height})<br>
        Audio Listening: ${audioDetector.isListening}<br>
        Music Playing: ${audioDetector.isPlaying} (Vol: ${audioDetector.smoothedVolume.toFixed(3)})<br>
        OIIA Enabled: ${oiiaEnabled}<br>
        Grounded: ${cat.isGrounded}<br>
        Dragging: ${cat.isDragging}
      `;
    } else {
      debugOverlay.style.display = 'none';
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
