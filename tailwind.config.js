const plugin = require('tailwindcss/plugin');
const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./views/**/*.{handlebars,html,js}', './views/home.handlebars'],
  theme: {
    colors: {
      brand_red: '#b71234',
      brand_black: '#282627',
      brand_grey: '545153',
      primary: colors.red,
      secondary: colors.stone,
      white: colors.white,
    },
    extend: {
      fontFamily: {
        sans: ['Montserrat', ...defaultTheme.fontFamily.sans],
        serif: ['Zilla Slab', ...defaultTheme.fontFamily.serif],
      },
    },
  },
  plugins: [
    plugin(({ addBase, theme }) => {
      addBase({
        html: { fontSize: '18px' },
        h1: {
          fontFamily: 'Zilla Slab',
          fontSize: theme('fontSize.5xl'),
          lineHeight: '3rem',
          marginTop: '1.25rem',
          marginBottom: '1.25rem',
        },
        h2: {
          fontFamily: 'Zilla Slab',
          fontSize: theme('fontSize.4xl'),
          lineHeight: '2rem',
          marginTop: '1.25rem',
          marginBottom: '1.25rem',
        },
        h3: {
          fontFamily: 'Zilla Slab',
          fontSize: theme('fontSize.2xl'),
          lineHeight: '1.5rem',
          marginTop: '1.25rem',
          marginBottom: '1.25rem',
        },
        h4: {
          fontSize: theme('fontSize.xl'),
          fontWeight: '600',
          lineHeight: '1.5rem',
          marginTop: '1.25rem',
          marginBottom: '1.25rem',
        },
        h5: {
          fontSize: theme('fontSize.lg'),
          fontWeight: '600',
          lineHeight: '1.5rem',
          marginTop: '1.25rem',
          marginBottom: '1.25rem',
        },
        h6: {
          fontWeight: '600',
          marginTop: '1.25rem',
          marginBottom: '1.25rem',
        },
        p: {
          marginBottom: '1.25rem',
          marginTop: '1.25rem',
        },
      });
    }),
  ],
};
