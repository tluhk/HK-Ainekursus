# Tagarakenduse töövahendid

[<Tagasi](../../README.md)

👉 Kasutatud töövahendite versioonid on nähtavad failis [package.json](https://github.com/tluhk/rif20-valikpraktika-1/blob/main/package.json) või otse rakenduses käsuga ```npm list```.

## Esimeses versioonis kasutatud (uued) töövahendid

### Used tools for app setup:

- Node.js v20.0: https://nodejs.org/en/ – runtime environment that runs on a JavaScript Engine and executes JavaScript code outside a web browser, widely used to build scalable network applications
- nodemon: https://www.npmjs.com/package/nodemon – helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected.
- eslint: https://www.npmjs.com/package/eslint – for identifying and reporting on patterns found in ECMAScript/JavaScript code
- live reload: https://bytearcher.com/articles/refresh-changes-browser-express-livereload-nodemon/

### Used tools for rendering:

- express JS: https://expressjs.com/ – web application framework used to build a single page, multipage, and hybrid web application
- express-handlebars: https://www.npmjs.com/package/express-handlebars – pure rendering engine. Allows writing semantic templates for rendering HTML-pages, e-mails or markdown files

### Used tools for reading and displaying content from GitHub:

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

## Teise versiooni edasiarenduse (uued) tööriistad

- [Docker](https://www.docker.com/) v20.10 – to run app and database containers. [Setup for this app](https://github.com/tluhk/rif20-valikpraktika-1#dockeri-%C3%BClesseadmine).  
- https://www.npmjs.com/package/mariadb – MariaDB for relational database.
- https://www.npmjs.com/package/passport-github2 – Enable authentication and authorization using GitHub accounts.
- https://www.npmjs.com/package/node-cache –  Cache service, [guide](https://dev.to/franciscomendes10866/simple-in-memory-cache-in-node-js-gl4)
- https://www.npmjs.com/package/jsonrepair – For validating config-files: repair broken config files if it has some formatting issues (e.g. missing comma, missing quotes, remove comments)
- https://www.npmjs.com/package/perf_hooks – Checking app performance.
- https://www.npmjs.com/package/cheerio – Parse course data from ÕIS Ainekaardid. The cheerio package will enable us to manipulate the DOM by reading the elements on the provided URL page.
- https://www.npmjs.com/package/moment – Formatting and displaying date and time values.

## Skeemid

- [Kasutaja autentimine ja autoriseerimine](https://github.com/tluhk/rif20-valikpraktika-1/blob/main/docs/content/backend/authProcess.drawio.svg)
- [Andmebaasi struktuur](https://github.com/tluhk/rif20-valikpraktika-1/blob/main/docs/content/backend/database.drawio.svg)
- [Kõigi ainekursuste andmete pärimine](https://github.com/tluhk/rif20-valikpraktika-1/blob/main/docs/content/backend/getAllCoursesData.drawio.svg)
- [Kõigi ainekursuste andmete kuvamine kasutajale](https://github.com/tluhk/rif20-valikpraktika-1/blob/main/docs/content/backend/getAllCourses.drawio.svg)
- [Valitud ainekursuse aktiivsete harude pärimine](https://github.com/tluhk/rif20-valikpraktika-1/blob/main/docs/content/backend/activeBranchesService.drawio.svg)
- [Valitud ainekursuse sisu pärimine](https://github.com/tluhk/rif20-valikpraktika-1/blob/main/docs/content/backend/getSpecificCourse.drawio.svg)
- [Kõigi ainekursuste teadete pärimine](https://github.com/tluhk/rif20-valikpraktika-1/blob/main/docs/content/backend/getCoursesUpdates.drawio.svg)
- [Kasutaja suunamine ainekursuse õige versiooni materjalideni](https://github.com/tluhk/rif20-valikpraktika-1/blob/main/docs/content/backend/refBranch.drawio.svg)


[<Tagasi](../../README.md)
