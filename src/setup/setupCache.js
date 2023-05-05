// Add in-memory cache
// https://dev.to/franciscomendes10866/simple-in-memory-cache-in-node-js-gl4
import NodeCache from 'node-cache';

// useClones is set to false to avoid this error: https://github.com/node-cache/node-cache/issues/231

const cache = new NodeCache({ stdTTL: 300, useClones: false }); // for general Cache requests, set cache for 5min. Do not use anywhere by default, create specific Caches for services.

const cacheTeamUsers = new NodeCache({ stdTTL: 1800, useClones: false }); // for Team Users, set cache for 30min
const cacheTeamCourses = new NodeCache({ stdTTL: 1800, useClones: false }); // for Team Courses, set cache for 30min
const cacheCommits = new NodeCache({ stdTTL: 1800, useClones: false }); // for Commits, set cache for 30min
const cacheCommitComments = new NodeCache({ stdTTL: 1800, useClones: false }); // for Commit Comments, set cache for 30min
const cacheOisContent = new NodeCache({ stdTTL: 86400, useClones: false }); // for ÕIS Content, set cache for 24 hours
const cacheConfig = new NodeCache({ stdTTL: 300, useClones: false }); // for Config files, set cache for 5 minutes
const cacheBranches = new NodeCache({ stdTTL: 300, useClones: false }); // for Branches, set cache for 5 minutes
const cachePageContent = new NodeCache({ stdTTL: 1800, useClones: false }); // for Course Page Contents, set cache for 30 minutes
const cacheFiles = new NodeCache({ stdTTL: 1800, useClones: false }); // for Course Files, set cache for 30 minutes
const cacheImages = new NodeCache({ stdTTL: 86400, useClones: false }); // for Course Images, set cache for 30 minutes
const cacheTeamAssignments = new NodeCache({ stdTTL: 1800, useClones: false }); // for Team Assignments, set cache for 30 minutes
const cacheMarkedAsDoneComponents = new NodeCache({ stdTTL: 86400, useClones: false }); // for Marked Aa Done Components, set cache for 1 day. This is flushed every time user marks a new components as done or removes it for specific course.


/** Reusable function to check if Cache exists. If yes, then results are saved to res.locals.  */
const cacheService = (async (req, res) => {
  let cacheName;
  // console.log('cacheName1:', cacheName);
  try {
    if (cache.has(cacheName) && cache.get(cacheName) !== undefined) {
      console.log(`${cacheName} loaded with CACHE`);
      res.locals[cacheName] = await cache.get(cacheName);
      delete res.locals.cacheName;
      // console.log('res.locals2:', res.locals);
    }
    return console.log(`${cacheName} loaded with API`);
  } catch (err) {
    console.log('Error with cacheService:');
    return console.error(err);
    // throw new Error(err);
  }
});

export { cacheService, cache, cacheTeamUsers, cacheTeamCourses, cacheCommits, cacheCommitComments, cacheOisContent, cacheConfig, cacheBranches, cachePageContent, cacheFiles, cacheImages, cacheTeamAssignments, cacheMarkedAsDoneComponents };
