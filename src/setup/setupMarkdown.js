/* eslint-disable max-len */
/* eslint-disable no-empty */
/* eslint-disable import/newline-after-import */
const base64 = require('base-64');
const utf8 = require('utf8');
const mila = require('markdown-it-link-attributes');
const blockEmbedPlugin = require('markdown-it-block-embed');
const playgroundPlugin = require('markdown-it-playground');
const hljs = require('highlight.js');
const iframe = require('markdown-it-iframe');
const mdImagination = require('markdown-it-imagination');

// Enable markdown file parser
// https://github.com/markdown-it/markdown-it
const MarkdownIt = require('markdown-it')({
  html: true, // Enable HTML tags in source
  xhtmlOut: true, // Use '/' to close single tags (<br />).
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable some language-neutral replacement + quotes beautification.e https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js

  // Enable syntax hightlighting: https://github.com/markdown-it/markdown-it#syntax-highlighting
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="markdown-pre"><code>${
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
        }</code></pre>`;
      } catch (__) {}
    }

    return `<pre class="markdown-pre"><code>${MarkdownIt.utils.escapeHtml(str)}</code></pre>`;
  },
}).enable('image');

// Add anchors to markdown headings
// https://github.com/valeriangalliat/markdown-it-anchor
const anchor = require('markdown-it-anchor');

//  Add certain classes to selected elements in markdown files, needed for CSS
// https://github.com/HiroshiOkada/markdown-it-class
const markdownItClass = require('@toycode/markdown-it-class');
const mapContent = {
  ol: 'markdown',
  ul: 'markdown',
  a: 'markdown',
  h1: 'markdown-wrapper',
  h2: 'markdown-wrapper',
  h3: 'markdown-wrapper',
  h4: 'markdown-wrapper',
  iframe: 'markdown-iframe',
  img: 'markdown-iframe',
};
MarkdownIt.use(markdownItClass, mapContent);

// Add attributes to href links in markdown file
// https://www.npmjs.com/package/markdown-it-link-attributes
MarkdownIt.use(mila, {
  // Don't add attributes to links that start with '#', e.g. anchor links: https://www.npmjs.com/package/markdown-it-link-attributes
  matcher(href) {
    return !href.startsWith('#');
  },
  attrs: {
    target: '_blank',
    rel: 'noopener',
  },
});

// Add anchor links to headings in markdown file
// https://github.com/valeriangalliat/markdown-it-anchor
MarkdownIt.use(anchor, {
  permalink: true,
  permalinkSymbol: '<span class="material-symbols-outlined">link</span>',
});

// Add embed video support
// https://github.com/rotorz/markdown-it-block-embed
MarkdownIt.use(blockEmbedPlugin, {
  containerClassName: 'video-embed',
  /* services: {
    sisuloome: {
      width: 600,
      height: 600,
    },
  }, */
});

// Enable embedded code demo environments like JSFiddle and CodePen
// https://www.npmjs.com/package/markdown-it-playground
MarkdownIt.use(playgroundPlugin, {
  allowFullScreen: true,
});

// Enable embedded iframes
// https://github.com/rjriel/markdown-it-iframe
MarkdownIt.use(iframe, {
  allowfullscreen: false,
  frameborder: 0, // default: 0
  renderIframe: true, // default: true
  width: '100%',
  height: '500px',
});

// Specify image rendering
// https://www.npmjs.com/package/markdown-it-imagination
MarkdownIt.use(mdImagination, {
  lazy: true,
});

module.exports = {
  base64,
  utf8,
  MarkdownIt,
};
