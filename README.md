# RIF20 Valikpraktika-1 – Online kursuse rakendus

TLU HK RIF20 Valikpraktika raames koostatud rakendus

![Kursuse rakendus](thumb-2.jpg)

## Töö sisu

Tegemist on online kursuse rakenduse I faasiga.  
Ülesanne koosnes järgmistest etappides:

- Eeltööga selgitada välja kursuse haldajate ning lõppkasutajate vajadused.
- Kaardistada kasutajateekonnad.
- Luua prototüüp
- Luua esialgne rakendus.

Rakendus on täielikult haldajate kontrolli all, tema sisu on võimalik ristkasutada ning kasutajasõbralikul moel kätte saada, kuvada ja töödelda. Need on olnud seniste lhenduste nõrkused.  
Rakenduse sisu asub Githubis. Githubi api kaudu saab sisu jagada ja kuvada.  
Esimeses faasis luuakse sisu git'i käskluste baasil. Eraldi kasutajaliidest pole.

Lõppkasutajale on loodud kaasaegne kasutajaliides, mis on kasutatav nii mobiilis kui desktopis.  
Kasutatud on Handlebar tepmliitimiskeelt ning Tailwind CSS-raamistikku.
Sisumootoriks on Node + Express.js

## Rakenduse kasutamine ja käivitamine

### Installeerimine

Kopeeri projekt oma masinasse ning installeeri vajalikud seosed:

```bash
git clone https://github.com/tluhk/rif20-valikpraktika-1
cd rif20-valikpraktika-1
npm install
```

### Käivitamine

Githubiga ühenduse loomiseks on tarviline Githubi tokeni loomine ja selle lisamine juurkataloogi .env faili.
faili sisuks `AUTH = 'Bearer ghp_SINUGITHUBITOKEN'`

Seejärel võib rakenduse käivitada:

```bash
npm start
```

Rakendusele ligipääseuks kirjuta brauseri aadressiribale `localhost:3000` ning võid kursusega pihta hakata.

## Valikpraktika I grupp

Tiina, Kristi, Krister, Juho, Kalev

Valikpraktika repo: https://github.com/tluhk/rif20-valikpraktika
