// Desktop Audio Loopback Analyzer for Music Reaction

class AudioReactiveDetector {
  constructor(onMusicStart, onMusicBeat, onMusicStop) {
    this.onMusicStart = onMusicStart;
    this.onMusicBeat = onMusicBeat;
    this.onMusicStop = onMusicStop;

    this.isListening = false;
    this.isPlaying = false;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;

    this.smoothedVolume = 0;
    this.smoothedBass = 0;
    this.silenceTimer = 0;
    this.silenceThresholdMs = 900;
    this.volumeThreshold = 0.025; // sensitive to music
  }

  async start() {
    if (this.isListening) return;

    try {
      console.log('[AudioReactiveDetector] Requesting desktop loopback audio...');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true
      });

      // Stop video track immediately - we only need audio!
      stream.getVideoTracks().forEach(track => track.stop());

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);
      // Do not connect to destination to avoid echoing!

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isListening = true;
      console.log('[AudioReactiveDetector] Audio capture active!');
    } catch (err) {
      console.warn('[AudioReactiveDetector] Audio capture could not start automatically:', err.message);
    }
  }

  update(dt, oiiaEnabled) {
    if (!this.isListening || !this.analyser || !oiiaEnabled) {
      if (this.isPlaying) {
        this.isPlaying = false;
        if (this.onMusicStop) this.onMusicStop();
      }
      return;
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate volume across all frequencies
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const rawVolume = (sum / this.dataArray.length) / 255.0;

    // Bass / Beat energy (bins 0 to 8)
    let bassSum = 0;
    const bassBins = Math.min(8, this.dataArray.length);
    for (let i = 0; i < bassBins; i++) {
      bassSum += this.dataArray[i];
    }
    const rawBass = (bassSum / bassBins) / 255.0;

    // Smooth volume to prevent jitter
    this.smoothedVolume += (rawVolume - this.smoothedVolume) * 0.3;
    this.smoothedBass += (rawBass - this.smoothedBass) * 0.3;

    if (this.smoothedVolume > this.volumeThreshold) {
      this.silenceTimer = 0;
      if (!this.isPlaying) {
        this.isPlaying = true;
        if (this.onMusicStart) this.onMusicStart();
      }
      if (this.onMusicBeat) {
        this.onMusicBeat(this.smoothedVolume, this.smoothedBass);
      }
    } else {
      if (this.isPlaying) {
        this.silenceTimer += dt;
        if (this.silenceTimer >= this.silenceThresholdMs) {
          this.isPlaying = false;
          if (this.onMusicStop) this.onMusicStop();
        }
      }
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioReactiveDetector };
}
