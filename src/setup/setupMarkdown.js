/* eslint-disable import/newline-after-import */
const base64 = require('base-64');
const utf8 = require('utf8');
const mila = require('markdown-it-link-attributes');
const anchor = require('markdown-it-anchor');
const blockEmbedPlugin = require('markdown-it-block-embed');

// Markdown faili lugemiseks ja dekodeerimiseks
const MarkdownIt = require('markdown-it')({
  html: true, // Enable HTML tags in source
  xhtmlOut: true, // Use '/' to close single tags (<br />).
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable some language-neutral replacement + quotes beautification.e https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js
}).enable('image');

// lisa määratud elementidele "markdown" class
const markdownItClass = require('@toycode/markdown-it-class');
const mapContent = {
  ol: 'markdown',
  ul: 'markdown',
  a: 'markdown',
};
MarkdownIt.use(markdownItClass, mapContent);

MarkdownIt.use(mila, {
  attrs: {
    target: '_blank',
    rel: 'noopener',
  },
});

// Add anchor links to markdown headings
// https://github.com/valeriangalliat/markdown-it-anchor#link-after-header
MarkdownIt.use(anchor, {
  permalink: anchor.permalink.linkAfterHeader({
    style: 'aria-describedby',
    wrapper: ['<div class="markdown-wrapper">', '</div>'],
    symbol: '<span class="material-symbols-outlined">link</span>',
  }),
});

// Add embed video support
// https://github.com/rotorz/markdown-it-block-embed
MarkdownIt.use(blockEmbedPlugin, {
  containerClassName: 'video-embed',
});

module.exports = {
  base64,
  utf8,
  MarkdownIt,
};
