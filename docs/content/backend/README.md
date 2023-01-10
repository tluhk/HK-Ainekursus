# Tagarakenduse töövahendid

[<Tagasi](../../README.md)

## Used tools for app setup:

- Node.js: https://nodejs.org/en/ – runtime environment that runs on a JavaScript Engine and executes JavaScript code outside a web browser, widely used to build scalable network applications
- nodemon: https://www.npmjs.com/package/nodemon – helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected.
- eslint: https://www.npmjs.com/package/eslint – for identifying and reporting on patterns found in ECMAScript/JavaScript code
- live reload: https://bytearcher.com/articles/refresh-changes-browser-express-livereload-nodemon/

## Used tools for rendering:

- express JS: https://expressjs.com/ – web application framework used to build a single page, multipage, and hybrid web application
- express-handlebars: https://www.npmjs.com/package/express-handlebars – pure rendering engine. Allows writing semantic templates for rendering HTML-pages, e-mails or markdown files

## Used tools for cache:
- Add in-memory cache: https://dev.to/franciscomendes10866/simple-in-memory-cache-in-node-js-gl4

## Used tools for reading and displaying content from GitHub:

- GitHub API: https://docs.github.com/en/rest – to read data from GitHub repositories
- axios: https://axios-http.com/ – Promise based HTTP client for the browser and node.js. For making requests to GitHub API.
- base64: https://www.npmjs.com/package/base-64 – for decoding encoded responses from GitHub API
- utf8: https://www.npmjs.com/package/utf8 – for making decoded GitHub API responses utf8 compatible
- markdown-it: https://github.com/markdown-it/markdown-it – for parsing Markdown files (after requesting Markdown files from Githhub and decoding with both base64 and utf8)

### Markdown-it pluginad Markdown-failide renderdamiseks
- Enable syntax hightlighting: https://github.com/markdown-it/markdown-it#syntax-highlighting
- Add anchors to markdown headings: https://github.com/valeriangalliat/markdown-it-anchor
- Add certain classes to selected elements in markdown files, needed for CSS: https://github.com/HiroshiOkada/markdown-it-class
- Add attributes to href links in markdown file: https://www.npmjs.com/package/markdown-it-link-attributes
- Add anchor links to headings in markdown file: https://github.com/valeriangalliat/markdown-it-anchor
- Add embed video support: https://github.com/rotorz/markdown-it-block-embed
- Enable embedded code demo environments like JSFiddle and CodePen: https://www.npmjs.com/package/markdown-it-playground
- Enable embedded iframes: https://github.com/rjriel/markdown-it-iframe
- Specify image rendering: https://www.npmjs.com/package/markdown-it-imagination

[<Tagasi](../../README.md)
