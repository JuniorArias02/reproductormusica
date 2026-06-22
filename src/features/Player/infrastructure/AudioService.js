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

      this.analyser.fftSize = 64; // 32 barras
      source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
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

  // Suscriptores
  onTimeUpdate(cb) { this.onTimeUpdateCallback = cb; }
  onDurationChange(cb) { this.onDurationChangeCallback = cb; }
  onEnded(cb) { this.onEndedCallback = cb; }
}

export const audioService = new AudioService();
