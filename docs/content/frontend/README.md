# Siia tekib Front-endi sisu

[<Tagasi](../../README.md)  
HTML on üles ehitatud lähtuvalt semantilise HTML põhimõtetest ja kõigile ligipääsetavuse huvidest.

Esialgse HTML-i skeem:

![Veebilehe skelett](images/html.jpg)

Stiilimiseks on kasutusel Tailwind CSS-raamistik. Kaalumisel olid ka Windi CSS, UnoCSS ja Spectra, kuid nende puudulikum kui Tailwindil, mistap sai nendest loobutud. Samuti oli kaalumisel üldse raamistikust loobumine ja selle asemel puhta CSS-i ja CSS-grid'i kasutamine, kuid tagasisidest selgus, et backendi arendajatele, kes peavad vahest samuti frontendi osas käe külge panema, on raamistiku kasutamine lihtsam.

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
