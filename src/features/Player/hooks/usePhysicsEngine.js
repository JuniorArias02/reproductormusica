/**
 * Motor de Físicas de Resorte (Spring Physics)
 * 
 * En lugar de cambiar valores de golpe (ej. radio = 200), aplicamos una "fuerza"
 * hacia un objetivo. La masa, tensión y fricción hacen que el valor llegue
 * rebotando de forma orgánica y fluida, independiente de los bajones de FPS.
 */

export function createSpring(initialValue = 0, tension = 0.1, friction = 0.8) {
  return {
    val: initialValue,
    target: initialValue,
    vel: 0,
    tension,
    friction,
    
    // Función para actualizar en cada frame (dt = delta time)
    update(dt) {
      // Normalizamos dt a 60fps (aprox 16.66ms por frame) para que la física sea consistente
      const timeScale = dt / 16.666; 
      
      const force = (this.target - this.val) * this.tension;
      this.vel += force;
      this.vel *= Math.pow(this.friction, timeScale); // Fricción dependiente del tiempo
      
      this.val += this.vel * timeScale;
      
      // Evitar micro-vibraciones infinitas cuando casi llega al objetivo
      if (Math.abs(this.vel) < 0.001 && Math.abs(this.target - this.val) < 0.001) {
        this.val = this.target;
        this.vel = 0;
      }
      
      return this.val;
    },

    // Dar un "golpe" inmediato de velocidad (útil para explosiones/beats)
    impulse(force) {
      this.vel += force;
    },

    // Cambiar el objetivo al que el resorte intentará llegar
    setTarget(newTarget) {
      this.target = newTarget;
    }
  };
}
