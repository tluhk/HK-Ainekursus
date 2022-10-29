/* eslint-disable max-len */
/* eslint-disable import/newline-after-import */

const { getConfig } = require('./getConfig');
const { setRoutes } = require('./setRoutes');

const engine = async (app) => {
  const config = await getConfig;
  // console.log('config from engine.js:', config);
  setRoutes(app, config);
};

// Get repository content: https://docs.github.com/en/rest/repos/contents#get-repository-content
// Get a latest release: https://docs.github.com/en/rest/releases/releases#get-the-latest-release

module.exports = { engine };
