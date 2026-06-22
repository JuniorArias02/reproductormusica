/**
 * Infraestructura: Servicio encargado de la reproducción nativa de medios y Web Audio API.
 * Sigue el patrón Clean Architecture: no conoce React ni la UI.
 */
class AudioService {
  constructor() {
    this.mediaElement = document.createElement('video');
    this.mediaElement.crossOrigin = 'anonymous';
    this.mediaElement.playsInline = true;
    this.mediaElement.style.display = 'none';

    // Web Audio API
    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;
    this.audioIniciado = false;

    // Callbacks para Zustand
    this.onTimeUpdateCallback = null;
    this.onDurationChangeCallback = null;
    this.onEndedCallback = null;

    // Listeners nativos
    this.mediaElement.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback) this.onTimeUpdateCallback(this.mediaElement.currentTime);
    });

    this.mediaElement.addEventListener('loadedmetadata', () => {
      if (this.onDurationChangeCallback) this.onDurationChangeCallback(this.mediaElement.duration);
    });

    this.mediaElement.addEventListener('ended', () => {
      if (this.onEndedCallback) this.onEndedCallback();
    });

    // Iniciar Web Audio en el primer play
    this.mediaElement.addEventListener('play', () => this.initWebAudio(), { once: true });
  }

  initWebAudio() {
    if (this.audioIniciado) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      const source = this.audioCtx.createMediaElementSource(this.mediaElement);
      this.analyser = this.audioCtx.createAnalyser();      // fftSize 2048 = 1024 bins. Cada bin ≈ 21.5Hz (sampleRate 44100 / 2048)
      // Esto da resolución real para separar sub-bass de kick de lowMids.
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.75;
      source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount); // 1024 bins
      this.audioIniciado = true;
    } catch (e) {
      console.warn('No se pudo iniciar Web Audio API:', e);
    }
  }

  async play(url = null) {
    if (url) {
      this.mediaElement.src = url;
      this.mediaElement.load();
    }
    
    try {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      await this.mediaElement.play();
    } catch (e) {
      console.error('Error al reproducir:', e);
    }
  }

  pause() {
    this.mediaElement.pause();
  }

  setVolume(vol) {
    this.mediaElement.volume = vol;
  }

  seek(time) {
    this.mediaElement.currentTime = time;
  }

  setLoop(loop) {
    this.mediaElement.loop = loop;
  }

  getMediaElement() {
    return this.mediaElement;
  }

  getFrequencies() {
    if (this.audioIniciado && this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      return this.dataArray;
    }
    return null;
  }

  /**
   * 6-Band Analysis — fftSize 2048, ~21.5Hz/bin
   *   subBass:  bins  1-3   → 21-64Hz   (sub-graves, bombo profundo)
   *   kickBass: bins  3-7   → 64-150Hz  (bombo/kick, contrabajo)
   *   lowMids:  bins  7-23  → 150-494Hz (guitarras bajas, piano bajo, voz grave)
   *   mids:     bins 23-93  → 494-2kHz  (voz principal, guitarra rítmica)
   *   presence: bins 93-279 → 2k-6kHz   (ataque de guitarra, sibilancia vocal)
   *   air:      bins 279-512→ 6k-11kHz  (hi-hats, platillos, brillo)
   */
  getBands6() {
    if (!this.audioIniciado || !this.analyser || !this.dataArray) {
      return { subBass: 0, kickBass: 0, lowMids: 0, mids: 0, presence: 0, air: 0 };
    }
    this.analyser.getByteFrequencyData(this.dataArray);
    const f = this.dataArray;

    const peak = (lo, hi) => {
      let m = 0;
      for (let i = lo; i < hi; i++) if (f[i] > m) m = f[i];
      return m / 255;
    };
    const rms = (lo, hi) => {
      let s = 0, n = hi - lo;
      for (let i = lo; i < hi; i++) s += f[i];
      return (s / n) / 255;
    };

    // Peak para bandas percusivas (reacciona al impacto exacto)
    // RMS para bandas melódicas (energía sostenida)
    const subBass  = Math.pow(Math.max(0, peak(1,  3)  - 0.15) / 0.85, 2.0);
    const kickBass = Math.pow(Math.max(0, peak(3,  7)  - 0.20) / 0.80, 2.5);
    const lowMids  = Math.pow(Math.max(0, rms(7,  23)  - 0.10) / 0.90, 1.5);
    const mids     = Math.pow(Math.max(0, rms(23, 93)  - 0.08) / 0.92, 1.3);
    const presence = Math.pow(Math.max(0, rms(93, 279) - 0.06) / 0.94, 1.2);
    const air      = Math.pow(Math.max(0, rms(279,512) - 0.04) / 0.96, 1.1);

    return {
      subBass:  Math.min(subBass,  1),
      kickBass: Math.min(kickBass, 1),
      lowMids:  Math.min(lowMids,  1),
      mids:     Math.min(mids,     1),
      presence: Math.min(presence, 1),
      air:      Math.min(air,      1),
    };
  }

  getBands() { return this.getBands6(); } // Alias retrocompatible

  // Suscriptores
  onTimeUpdate(cb) { this.onTimeUpdateCallback = cb; }
  onDurationChange(cb) { this.onDurationChangeCallback = cb; }
  onEnded(cb) { this.onEndedCallback = cb; }
}

export const audioService = new AudioService();
