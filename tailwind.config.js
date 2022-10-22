const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./views/**/*.{handlebars,html,js}', './views/home.handlebars'],
  theme: {
    colors: {
      brand_red: '#b71234',
      brand_black: '#282627',
      brand_grey: '545153',
      on_brand: '#fff',
    },
    extend: {},
  },
  plugins: [
    plugin(({ addBase, theme }) => {
      addBase({
        html: { fontSize: '18px' },
        h1: {
          fontSize: theme('fontSize.5xl'),
          fontWeight: '500',
          fontStyle: 'italic',
          fontFamily: 'serif',
          lineHeight: '3rem',
        },
        h2: {
          fontSize: theme('fontSize.4xl'),
          fontWeight: '500',
          fontStyle: 'italic',
          fontFamily: 'serif',
          lineHeight: '2.25rem',
          marginBottom: '1.25rem',
          marginTop: '1.25rem',
        },
        h3: {
          fontSize: theme('fontSize.3xl'),
          fontWeight: '500',
          fontStyle: 'italic',
          fontFamily: 'serif',
          marginBottom: '1.25rem',
          marginTop: '1.25rem',
        },
        p: {
          marginBottom: '1.25rem',
          marginTop: '1.25rem',
        },
      });
    }),
  ],
};
