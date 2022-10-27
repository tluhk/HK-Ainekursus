# Siia tekib Front-endi sisu

[<Tagasi](../../README.md)  
HTML on üles ehitatud lähtuvalt semantilise HTML põhimõtetest ja kõigile ligipääsetavuse huvidest.

Esialgse HTML-i skeem:

![Veebilehe skelett](images/html.jpg)

Stiilimiseks on kasutusel Tailwind CSS-raamistik. Kaalumisel olid ka Windi CSS, UnoCSS ja Spectra, kuid nende puudulikum kui Tailwindil, mistap sai nendest loobutud. Samuti oli kaalumisel üldse raamistikust loobumine ja selle asemel puhta CSS-i ja CSS-grid'i kasutamine, kuid tagasisidest selgus, et backendi arendajatele, kes peavad vahest samuti frontendi osas käe külge panema, on raamistiku kasutamine lihtsam.

Tailwind kontrollib allikafailidest, milliseid klasse kasutatakse ning kopeerib need siis lõppfolderisse.

## Tailwindi kasutus

Tailwind tuleb kasutamiseks installeerida. Testida saab aga ka kasutades Tailwindi CDN-i repositooriumeid.  
Siinses rakenduses on kasutatud Tailwindi koos PostCSS pistikprogramm. PostCSS võimaldab kasutada lisasid nagu koodi miniseerimine, tootjate eesliidete lisamine, koodi kontrollimine(linting).

Installeerimise juhendid leiab (siit:)[https://tailwindcss.com/docs/installation/using-postcss].
Installeerimise järel tekivad juurkataloogi samad failid, mis eelneval lingil oleval lehel ning puuduvad tuleb lisada nii nagu näidatud.

Peamised seadistused tehakse `tailwind.js`-is.
Tailwindi `Contendi`real tuleb ära näidata, millistes failides ja folderites asub stiilitav kood.  
Siinse näite puhul: `content: ['./views/**/*.{handlebars,html,js}', './views/home.handlebars'],`
Kui muuta midagi nendes failides ja seejärel käivitada Tailwindi kokkukirjutamiskäsklus, lisatakse sobiv osa css koodi stiilifaili.
Kompileerimiskäsklus ja sihtpunktid on mõitlik lisada `package.json` faili: `"build-css": "tailwindcss -i ./src/main.css -o ./public/css/main.css"`

Vaikimisi on Tailwind nagu 0-stiil, tema eripäraks ongi see, et sa ehitad üles oma kujunduse, nö sisustades ära Tailwindi poolt antud raamid.

### Isikupärastamine

Omalooming hakkab juurkataloogis asuvast `tailwind.config.js`

## Siin rakenduses ettevõetud asjad.

- Tüpograafia
  lisatud on oma kirjatüüp ja hierarhia.
- Värvilahendus

Baasfondi suurendamine käib läbi plugina:

```javascript
const plugin = require("tailwindcss/plugin");

module.exports = {
  // other settings
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        html: { fontSize: "10px" },
      });
    }),
  ],
};
```

## Siinse lehe spetsiifika, komponendid ja kujundusosade loomine.

### Sticky sidebar

Külgriba jääb lihtsama navigatsiooni huvides kui veebilehte ekraani ülaserva kerid, ülaserva pidama. Nn "sticky position".  
Selleks tuleb kasutada CSS omadust – sticky. Et see toimiks, on vaja määrata selle külgriba kõrgus ning CSS omadusele top, anda väärtus 0 (sel juhul kinnitub ta 0-i jõudes).

[<Tagasi](../../README.md)
