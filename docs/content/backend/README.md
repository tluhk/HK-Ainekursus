# Siia tekib Backendi sisu

[<Tagasi](../../README.md)

## Used tools for app setup:

- Node.js: https://nodejs.org/en/ – runtime environment that runs on a JavaScript Engine and executes JavaScript code outside a web browser, widely used to build scalable network applications
- nodemon: https://www.npmjs.com/package/nodemon – helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected.
- eslint: https://www.npmjs.com/package/eslint – for identifying and reporting on patterns found in ECMAScript/JavaScript code
- live reload: https://bytearcher.com/articles/refresh-changes-browser-express-livereload-nodemon/

## Used tools for rendering:

- express JS: https://expressjs.com/ – web application framework used to build a single page, multipage, and hybrid web application
- express-handlebars: https://www.npmjs.com/package/express-handlebars – pure rendering engine. Allows writing semantic templates for rendering HTML-pages, e-mails or markdown files

## Used tools for reading and displaying content from GitHub:

- GitHub API: https://docs.github.com/en/rest – to read data from GitHub repositories
- axios: https://axios-http.com/ – Promise based HTTP client for the browser and node.js. For making requests to GitHub API.
- base64: https://www.npmjs.com/package/base-64 – for decoding encoded responses from GitHub API
- utf8: https://www.npmjs.com/package/utf8 – for making decoded GitHub API responses utf8 compatible
- markdown-it: https://github.com/markdown-it/markdown-it – for parsing Markdown files (after requesting Markdown files from Githhub and decoding with both base64 and utf8)
- markdown-it-link-attributes: https://www.google.com/search?client=firefox-b-d&q=markdown-it-link-attributes – link attributes plugin for markdown-it markdown parser

[<Tagasi](../../README.md)
