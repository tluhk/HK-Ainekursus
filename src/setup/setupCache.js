// Add in-memory cache
// https://dev.to/franciscomendes10866/simple-in-memory-cache-in-node-js-gl4
const NodeCache = require('node-cache');

// useClones is set to false to avoid this error: https://github.com/node-cache/node-cache/issues/231
const cache = new NodeCache({ stdTTL: 30, useClones: false });

module.exports = {
  cache,
};
