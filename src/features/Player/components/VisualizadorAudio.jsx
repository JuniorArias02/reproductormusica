/**
 * Visualizador de audio animado con barras CSS que bailan al ritmo.
 * Soporta color dinámico extraído de la canción activa.
 */
export function VisualizadorAudio({ estaReproduciendo, colorPrimario = '#FF4A1C' }) {
  const BARRAS = [
    { anim: 'visualBar1', duracion: '0.7s',  delay: '0s'    },
    { anim: 'visualBar2', duracion: '0.5s',  delay: '0.1s'  },
    { anim: 'visualBar3', duracion: '0.9s',  delay: '0.05s' },
    { anim: 'visualBar4', duracion: '0.6s',  delay: '0.2s'  },
    { anim: 'visualBar5', duracion: '0.8s',  delay: '0.15s' },
    { anim: 'visualBar6', duracion: '0.65s', delay: '0.25s' },
    { anim: 'visualBar7', duracion: '0.75s', delay: '0s'    },
    { anim: 'visualBar1', duracion: '0.55s', delay: '0.1s'  },
    { anim: 'visualBar3', duracion: '0.85s', delay: '0.3s'  },
    { anim: 'visualBar2', duracion: '0.7s',  delay: '0.05s' },
    { anim: 'visualBar5', duracion: '0.6s',  delay: '0.2s'  },
    { anim: 'visualBar4', duracion: '0.9s',  delay: '0.15s' },
    { anim: 'visualBar7', duracion: '0.5s',  delay: '0.25s' },
    { anim: 'visualBar6', duracion: '0.75s', delay: '0s'    },
    { anim: 'visualBar1', duracion: '0.65s', delay: '0.1s'  },
    { anim: 'visualBar3', duracion: '0.8s',  delay: '0.2s'  },
    { anim: 'visualBar2', duracion: '0.55s', delay: '0.05s' },
    { anim: 'visualBar5', duracion: '0.7s',  delay: '0.3s'  },
    { anim: 'visualBar4', duracion: '0.6s',  delay: '0.15s' },
    { anim: 'visualBar7', duracion: '0.85s', delay: '0.1s'  },
    { anim: 'visualBar6', duracion: '0.9s',  delay: '0.25s' },
    { anim: 'visualBar1', duracion: '0.65s', delay: '0.35s' },
    { anim: 'visualBar3', duracion: '0.7s',  delay: '0s'    },
    { anim: 'visualBar2', duracion: '0.8s',  delay: '0.1s'  },
  ];

  const obtenerGradiente = (i) => {
    if (i % 3 === 0) return `linear-gradient(to top, ${colorPrimario}, ${colorPrimario}AA)`;
    if (i % 3 === 1) return 'linear-gradient(to top, #00F0FF, #7BF9FF)';
    return `linear-gradient(to top, ${colorPrimario}44, ${colorPrimario}88)`;
  };

  return (
    <div className="flex items-end justify-center gap-[3px] h-16 w-full px-4">
      {BARRAS.map((barra, i) => (
        <div
          key={i}
          className="flex-1 rounded-full"
          style={{
            background: obtenerGradiente(i),
            animationName: estaReproduciendo ? barra.anim : 'none',
            animationDuration: barra.duracion,
            animationDelay: barra.delay,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
            height: estaReproduciendo ? undefined : '15%',
            minHeight: '4px',
            transition: 'height 0.3s ease, background 0.8s ease',
          }}
        />
      ))}
    </div>
  );
}
