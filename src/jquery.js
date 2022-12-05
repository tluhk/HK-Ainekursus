/* eslint-disable import/newline-after-import */
// Set up JQuery
// https://stackoverflow.com/questions/1801160/can-i-use-jquery-with-node-js
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
// global.document = document;
const $ = require('jquery')(window);
// const jQuery = require('jquery')(window);

const iFrameResize = require('iframe-resizer');

// https://stackoverflow.com/a/52894409

// https://www.npmjs.com/package/wl-iframe-resizer?activeTab=readme
$('.markdown-iframe').load(function () {
  $(this).contents().find('body').append('<script type="text/javascript" src="https://raw.githubusercontent.com/davidjbradshaw/iframe-resizer/master/js/iframeResizer.contentWindow.min.js"></script>');
});

/*
// https://www.npmjs.com/package/wl-iframe-resizer?activeTab=readme
$('.markdown-iframe').iFrameResize({ log: true });
*/
