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
      this.analyser = this.audioCtx.createAnalyser();

      // fftSize 256 = 128 bins. Cada bin ≈ 344Hz (sampleRate 44100 / 256)
      // Esto nos da resolución suficiente para separar graves, medios y agudos.
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.7; // Suavizado nativo del analizador
      source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount); // 128 bins
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
   * Retorna 3 valores normalizados (0-1) para cada banda de frecuencia.
   * Con 128 bins a ~344Hz/bin:
   *   - bajos:  bins 0-4  → 0 a ~1.7kHz (kick, bombo, bajo)
   *   - medios: bins 5-20 → ~1.7kHz a ~6.9kHz (voz, guitarra, piano)
   *   - altos:  bins 21-63 → ~7kHz a ~22kHz (hi-hats, platillos, presencia vocal alta)
   */
  getBands() {
    if (!this.audioIniciado || !this.analyser || !this.dataArray) {
      return { bajos: 0, medios: 0, altos: 0 };
    }
    this.analyser.getByteFrequencyData(this.dataArray);
    const f = this.dataArray;

    // ── Bajos: pico máximo de los primeros 4 bins (kick, bombo) ─────────
    let pBajos = 0;
    for (let i = 0; i < 4; i++) pBajos = Math.max(pBajos, f[i]);
    // Noise gate: solo reaccionar a golpes reales (>160/255)
    const bajos = Math.pow(Math.max(0, pBajos - 160) / 95, 2.5);

    // ── Medios: promedio RMS de bins 5-20 (voz, instrumentos melódicos) ─
    let sumMedios = 0;
    for (let i = 5; i <= 20; i++) sumMedios += f[i];
    const avgMedios = sumMedios / 16;
    // Umbral bajo para que reaccione a voces y cuerdas suaves también
    const medios = Math.pow(Math.max(0, avgMedios - 80) / 175, 1.5);

    // ── Altos: energía RMS de bins 21-63 (hi-hats, platillos, sibilancia) ─
    let sumAltos = 0;
    for (let i = 21; i <= 63; i++) sumAltos += f[i];
    const avgAltos = sumAltos / 43;
    // Los agudos suelen ser más silenciosos, umbral muy bajo
    const altos = Math.pow(Math.max(0, avgAltos - 40) / 215, 1.2);

    return {
      bajos: Math.min(bajos, 1),
      medios: Math.min(medios, 1),
      altos: Math.min(altos, 1),
    };
  }

  // Suscriptores
  onTimeUpdate(cb) { this.onTimeUpdateCallback = cb; }
  onDurationChange(cb) { this.onDurationChangeCallback = cb; }
  onEnded(cb) { this.onEndedCallback = cb; }
}

export const audioService = new AudioService();
