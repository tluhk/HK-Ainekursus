/**
 * Define cache verification logic
 */
const { cache } = require('../../setup/setupCache');

const verifyCache = (req, res, next) => {
  try {
    const routePath = `${req.url}+config` || `${req.url}+components`;
    // console.log('cache.has(routePath):', cache.has(routePath));
    if (cache.has(routePath) && cache.get(routePath) !== undefined) {
      console.log(`content loaded with CACHE: ${routePath}`);
      // console.log('cache.get(routePath)', cache.get(routePath));
      res.locals.cache = cache.get(routePath);

      return next();
      // return res.status(200).json(cache.get(routePath));
    }
    console.log(`content loaded with API: ${routePath}`);
    return next();
  } catch (err) {
    console.log('err');
    throw new Error(err);
  }
};

module.exports = { verifyCache };
