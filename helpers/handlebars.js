// https://stackoverflow.com/a/40956931
// CommonJS export Alternative:

module.exports = function hbsHelpers(hbs) {
  return hbs.create({
    helpers: { // This was missing
      if_equal: (a, b, opts) => {
        if (a === b) {
          return opts.fn(this);
        } return opts.inverse(this);
      },

      // More helpers...
    },
  });
};
