require('dotenv').config();

const path = require('path');

const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const compression = require('compression');
const helmet = require('helmet');
const port = process.env.PORT || 3000;

// add handlebars helpers: https://stackoverflow.com/a/32707476
const handlebars = require('./src/helpers/handlebars')(exphbs);

app.use(compression());

app.use(helmet());
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '/views'));

// define application static folder:
app.use(express.static(path.join(__dirname, '/public')));
app.use(
  '/images',
  express.static(
    'https://api.github.com/tluhk/HK_Riistvara-alused/contents/concepts/arvuti/images'
  )
);

const { engine } = require('./engine');

engine(app);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

/* const start = (portProp) => {
  try {
    app.listen(portProp);
    console.log(`Listening on port ${portProp}`);
  } catch (err) {
    console.error(err);
    process.exit();
  }
};

start(port); */
