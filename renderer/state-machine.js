// State Machine for Desktop Cat
// Manages behavior transitions, timers, and probabilities configurable via config.json

class CatStateMachine {
  constructor(config, onStateChange) {
    this.config = config;
    this.onStateChange = onStateChange;

    this.currentState = 'idle';
    this.previousState = 'idle';
    this.stateTimer = 0;
    this.stateDuration = this.getRandomDuration('idle');

    this.locked = false; // When in non-interruptible animation (like swatting)
  }

  updateConfig(newConfig) {
    this.config = newConfig;
  }

  getRandomDuration(state) {
    const statesCfg = this.config.states || {};
    const cfg = statesCfg[state];
    if (cfg && cfg.minDurationMs && cfg.maxDurationMs) {
      const min = cfg.minDurationMs;
      const max = cfg.maxDurationMs;
      return min + Math.random() * (max - min);
    }
    return 4000;
  }

  // Pick next random ambient state based on weights in config
  pickNextAmbientState() {
    const weights = this.config?.states?.transitionWeights || {
      idle: 35,
      walk: 35,
      sit: 20,
      zoomies: 10
    };

    // Filter out current state to ensure variety (unless only 1 weight)
    const candidates = Object.entries(weights);
    const totalWeight = candidates.reduce((sum, [, w]) => sum + w, 0);
    let rand = Math.random() * totalWeight;

    for (const [state, weight] of candidates) {
      rand -= weight;
      if (rand <= 0) {
        return state;
      }
    }
    return 'idle';
  }

  setState(newState, forceDuration = null, lock = false) {
    if (this.currentState === newState && !lock) return;

    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateTimer = 0;
    this.locked = lock;

    if (forceDuration !== null) {
      this.stateDuration = forceDuration;
    } else {
      this.stateDuration = this.getRandomDuration(newState);
    }

    if (typeof this.onStateChange === 'function') {
      this.onStateChange(this.currentState, this.previousState);
    }
  }

  // Called every frame with deltaTime (ms)
  update(dt, isGrounded) {
    // If airborne and not being dragged, force falling state
    if (!isGrounded && this.currentState !== 'dragged' && this.currentState !== 'falling') {
      this.setState('falling');
      return;
    }

    // If falling and hit ground, land!
    if (this.currentState === 'falling' && isGrounded) {
      this.setState('idle', 1000);
      return;
    }

    // While dragged, stay in dragged
    if (this.currentState === 'dragged') {
      return;
    }

    this.stateTimer += dt;

    // Check if current timed state has completed
    if (this.stateTimer >= this.stateDuration) {
      if (this.locked) {
        this.locked = false;
      }

      // If finished purr, swat, or dizzy, transition back to idle
      if (['purr', 'smack', 'dizzy'].includes(this.currentState)) {
        this.setState('idle');
        return;
      }

      // If in sulk, sleep, or dance, these are controlled by external behavior checks
      if (['sulk', 'sleep', 'dance'].includes(this.currentState)) {
        return;
      }

      // Standard ambient transition
      const nextState = this.pickNextAmbientState();
      this.setState(nextState);
    }
  }

  // Interaction triggers
  onStartDrag() {
    this.locked = false;
    this.setState('dragged');
  }

  onEndDrag(isGrounded) {
    if (!isGrounded) {
      this.setState('falling');
    } else {
      this.setState('idle', 1200);
    }
  }

  onPet() {
    if (this.currentState === 'dragged') return;
    const dur = this.config?.behaviors?.click?.purrDurationMs || 2500;
    this.setState('purr', dur, true);
  }

  onSwat() {
    if (this.currentState === 'dragged') return;
    const dur = this.config?.behaviors?.click?.swatDurationMs || 1200;
    this.setState('smack', dur, true); // Lock for swat animation
  }

  onSleep() {
    if (this.currentState === 'dragged' || this.currentState === 'falling') return;
    this.setState('sleep', 99999999);
  }

  onWake() {
    if (this.currentState === 'sleep') {
      this.setState('idle', 1500);
    }
  }

  onSulk() {
    if (this.currentState === 'dragged' || this.currentState === 'falling') return;
    this.setState('sulk', 99999999);
  }

  onDance() {
    if (this.currentState === 'dragged' || this.currentState === 'falling') return;
    this.setState('dance', 99999999);
  }

  onStopDance() {
    if (this.currentState === 'dance') {
      this.onDizzy();
    }
  }

  onDizzy() {
    const dur = this.config?.behaviors?.music?.dizzyDurationMs || 3000;
    this.setState('dizzy', dur, true);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CatStateMachine };
}
