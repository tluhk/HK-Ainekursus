/* eslint-disable max-len */
/* eslint-disable no-script-url */
// https://stackoverflow.com/a/40956931
// CommonJS export Alternative:

const path = require('path');

// Siin saab defineerida handlebarsiga seotud detaile.
// Helpers objekti alla saab lisada funktsioone, mida kasutada lisaks built-in helpersitele

// handlebar options: https://stackoverflow.com/a/40898191
module.exports = function hbsHelpers(hbs) {
  return hbs.create({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, '../..', '/views/layouts'),
    partialsDir: path.join(__dirname, '../..', '/views/partials'),
    helpers: {
      if_equal: (a, b, opts) => {
        if (a === b) {
          return opts.fn(this);
        } return opts.inverse(this);
      },
      if_not_equal: (a, b, opts) => {
        if (a !== b) {
          return opts.fn(this);
        } return opts.inverse(this);
      },
      SafeStringFiles: (param) => (`javascript:fileFunc(${param});`),
      last: (array) => array[array.length - 1].path,
      concatActivePath: (arg1, arg2) => `${arg1}/${arg2}`,
      ifNotIn: (elem, list, options) => {
        console.log('list', list);
        if (list.indexOf(elem) <= -1) {
          return options.fn(this);
        }
        return options.inverse(this);
      },
      /* ifIn: (elem, objects) => {
        console.log('objects', objects);
        const index = objects.findIndex((object) => object.path === elem);
        if (index > -1) {
          return true;
        }
        return false;
      }, */
      /*
      link: (filename, desc) => {
        // handlebars faili:
        {{{ link this.filename this.description }}}

        const html = `<a href="#${filename}" onclick="javascript:fileFunc(${filename}">${desc}</a>`;
        return html;
      }, */
      // More helpers...
    },
  });
};
