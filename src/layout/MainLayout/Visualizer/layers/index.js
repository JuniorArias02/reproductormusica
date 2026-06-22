import { renderOrbeLayer } from './OrbeLayer';
import { renderBlobsWarmLayer } from './BlobsWarmLayer';
import { renderBlobsCoolLayer } from './BlobsCoolLayer';
import { renderStarsLayer } from './StarsLayer';
import { renderSparksLayer } from './SparksLayer';
import { renderShockwavesLayer } from './ShockwavesLayer';

export const activeLayers = [
  renderOrbeLayer,
  renderBlobsWarmLayer,
  renderBlobsCoolLayer,
  renderStarsLayer,
  renderSparksLayer,
  renderShockwavesLayer
];
