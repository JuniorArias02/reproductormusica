import { renderOrbeLayer } from './OrbeLayer';
import { renderBlobsWarmLayer } from './BlobsWarmLayer';
import { renderBlobsCoolLayer } from './BlobsCoolLayer';
import { renderBlobRingsLayer } from './BlobRingsLayer';
import { renderStarsLayer } from './StarsLayer';
import { renderSparksLayer } from './SparksLayer';
import { renderShockwavesLayer } from './ShockwavesLayer';
import { renderScreenEdgeLayer } from './ScreenEdgeLayer';

export const activeLayers = [
  renderScreenEdgeLayer,  // bordes primero (por debajo de todo)
  renderOrbeLayer,
  renderBlobsWarmLayer,
  renderBlobsCoolLayer,
  renderBlobRingsLayer,   // anillos encima de los blobs
  renderStarsLayer,
  renderSparksLayer,
  renderShockwavesLayer,
];
