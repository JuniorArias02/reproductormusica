import { renderOrbeLayer } from './OrbeLayer';
import { renderBlobsWarmLayer } from './BlobsWarmLayer';
import { renderBlobsCoolLayer } from './BlobsCoolLayer';
import { renderBlobsInstrLayer } from './BlobsInstrLayer';
import { renderBlobRingsLayer } from './BlobRingsLayer';
import { renderStarsLayer } from './StarsLayer';
import { renderSparksLayer } from './SparksLayer';
import { renderShockwavesLayer } from './ShockwavesLayer';
import { renderScreenEdgeLayer } from './ScreenEdgeLayer';
import { renderMouseLayer } from './MouseLayer';

export const activeLayers = [
  renderScreenEdgeLayer,  // halo de borde
  renderOrbeLayer,        // núcleo central (bajo/beat)
  renderBlobsWarmLayer,   // blobs cálidos → bajo y batería
  renderBlobsCoolLayer,   // blobs fríos   → voz y melodía
  renderBlobsInstrLayer,  // blobs de instrumentos → onsets de guitarras/sintes
  renderBlobRingsLayer,   // anillos de energía encima de todos los blobs
  renderStarsLayer,
  renderSparksLayer,
  renderShockwavesLayer,
  renderMouseLayer,
];
