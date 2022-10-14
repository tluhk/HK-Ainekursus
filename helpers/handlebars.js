// https://stackoverflow.com/a/40956931
// CommonJS export Alternative:

const path = require('path');

// handlebar options: https://stackoverflow.com/a/40898191
module.exports = function hbsHelpers(hbs) {
  return hbs.create({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, '..', '/views/layouts'),
    partialsDir: path.join(__dirname, '..', '/views/partials'),
    helpers: {
      if_equal: (a, b, opts) => {
        if (a === b) {
          return opts.fn(this);
        } return opts.inverse(this);
      },
      block: (options) => options.fn(this),
      // More helpers...
    },
  });
};
