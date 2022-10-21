const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./views/**/*.{handlebars,html,js}', './views/home.handlebars'],
  theme: {
    colors: {
      brand_red: '#b71234',
      on_red: '#fff',
    },
    extend: {},
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        html: { fontSize: '18px' },
      });
    }),
  ],
};
