/**
 * Define cache verification logic
 */
const { cache } = require('../../setup/setupCache');

const verifyCache = (req, res, next) => {
  let teamSlug;
  if (req.user.team.slug) teamSlug = req.user.team.slug;
  const selectedVersion = req.session.selectedVersion || null;

  let routePath;
  try {
    if (selectedVersion) {
      routePath = `${req.url}+config+version+${selectedVersion}`
      || `${req.url}+components+version+${selectedVersion}`;
    } else if (teamSlug) {
      routePath = `${req.url}+config+team+${teamSlug}`
      || `${req.url}+components+team+${teamSlug}`;
    } else {
      routePath = `${req.url}+config`
        || `${req.url}+components`;
    }
    console.log('cache.get(routePath)2:', cache.get(routePath));
    if (cache.has(routePath) && cache.get(routePath) !== undefined) {
      console.log(`courseContent loaded with CACHE: ${routePath}`);
      res.locals.cache = cache.get(routePath);

      return next();
    }
    console.log(`courseContent loaded with API: ${routePath}`);
    return next();
  } catch (err) {
    console.log('err');
    throw new Error(err);
  }
};

module.exports = { verifyCache };
