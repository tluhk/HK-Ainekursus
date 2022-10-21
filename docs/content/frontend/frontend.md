# Siia tekib Front-endi sisu

[<Tagasi](../../README.md)  
Tailwindi install  
Tailwind kontrollib allikafailidest, milliseid klasse kasutatakse ning kopeeribe need siis lõppfolderisse.  
Baasfondi suurendamine käib läbi plugina:

```javascript
const plugin = require('tailwindcss/plugin');

module.exports = {
  // other settings
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        html: { fontSize: '10px' },
      });
    }),
  ],
};
```

[<Tagasi](../../README.md)
