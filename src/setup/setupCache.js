// Add in-memory cache
// https://dev.to/franciscomendes10866/simple-in-memory-cache-in-node-js-gl4
import NodeCache from 'node-cache';

// useClones is set to false to avoid this error: https://github.com/node-cache/node-cache/issues/231
const cache = new NodeCache({ stdTTL: 300, useClones: false });

export default cache;
