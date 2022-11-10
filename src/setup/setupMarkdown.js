const base64 = require('base-64');
const utf8 = require('utf8');
const mila = require('markdown-it-link-attributes');

// Markdown faili lugemiseks ja dekodeerimiseks
const MarkdownIt = require('markdown-it')({
  html: true, // Enable HTML tags in source
  xhtmlOut: true, // Use '/' to close single tags (<br />).
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable some language-neutral replacement + quotes beautification.e https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js
}).enable('image');

MarkdownIt.use(mila, {
  attrs: {
    target: '_blank',
    rel: 'noopener',
  },
});

module.exports = {
  base64,
  utf8,
  MarkdownIt,
};
