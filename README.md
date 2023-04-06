# Ainekursuste rakendus

TLU HK RIF20 Valikpraktika raames loodud rakendus ainekursuste haldamiseks läbi giti ja kuvamiseks eesrakenduses.

## <a href="https://rif.up.railway.app" target="_blank">Rakenduse demoversioon "lives"</a>


## Rakenduse käivitamine

Rakendus eeldab NODE olemasolu arendusmasinas: [Node paigaldamisjuhised](https://nodejs.org/en/download/)

Nimekirja rakenduses kasutatud tehnoloogiatest leiad [Back-Endi](docs/content/backend/) ja [Front-Endi](docs/content/frontend/) kirjelduste alt [docs](docs) kaustast.

Disaini põhimõtted ja valikuteed leiad [UX](docs/content/ux/) kaustast.

### Installeerimine

Kopeeri projekt oma masinasse ning installeeri vajalikud seosed:

```bash
git clone https://github.com/tluhk/rif20-valikpraktika-1
cd rif20-valikpraktika-1
npm install
```

### .env faili struktuur ja terminid

Struktuur:

```
AUTH=''

GITHUB_CLIENT_ID=''
GITHUB_CLIENT_SECRET=''
GITHUB_CALLBACK_URL=''

MYSQL_ROOT_PASSWORD=''

DB_HOST=''
DB_USER=''
DB_PASSWORD=''
```

Terminid:

Esimene muutuja on sinu Githubi token, [juhend](https://github.com/tluhk/rif20-valikpraktika-1/#github-tokeni-lisamine-rakendusse).
```
AUTH=''
```

Järgnevad 3 muutujat leiad tluhk organisatsiooni Githubi kontolt: Settings -> Developer settings -> OAuth Apps -> Haapsalu kolledži e-õppe keskkond. [Otselink](https://github.com/organizations/tluhk/settings/applications/2100214).
```
GITHUB_CLIENT_ID=''
GITHUB_CLIENT_SECRET=''
GITHUB_CALLBACK_URL=''
```

Järnevale muutujale viitab setup-docker.sh fail Dockeri pilte ja konteinereid luues.
```
MYSQL_ROOT_PASSWORD=''
```

Järgnevale 3 muutujale viitavad rakenduses funktsioonid, mis loovad ühenduse, loevad ja uuendavad andmeid MariaDB andmebaasiga.
```
DB_HOST=''
DB_USER=''
DB_PASSWORD=''
```

### Dockeri ülesseadmine

Lae alla [Dockeri desktop rakendus](https://www.docker.com/products/docker-desktop/).

Andmebaas ja rakendus jooksevad Dockeri konteinerites nimedega haapsalu-mariadb ja haapsalu-app.
Andmebaasi konteiner haapsalu-mariadb luuakse [MariaDB Dockeri pildi](https://hub.docker.com/_/mariadb) põhjal. 
Rakenduse konteiner haapsalu-app luuakse haapsalu-nimelise pildi põhjal, mis luuakse rakenduse käivitamiskäsuga. Selleni jõuame järgmises punktis.

Esmalt installi endale MariaDB Dockeri pilt:
```
docker pull mariadb:latest
```

Seejärel lisa .env faili vajalikud muutujat (vaata .env faili juhendit).

#### Muud Dockeri käsud:

Ainult andmebaasi ligipääsemiseks võid käivitada haapsalu-mariadb konteineri ja sellesse siseneda:
```
docker compose up haapsalu-mariadb -d
docker exec -it haapsalu-mariadb bash
```
Sisene andmebaasi:
```
mysql -u root -p
```

Vajadusel saad kontrollida Dockeri poolt kasutusel olevat mälumahtu:
```
docker system df
```

Kui rakenduse käivitamisel tuleb teade, et Dockeris pole piisavalt mälumahtu, või kui haapsalu-mariadb konteinerit ei õnnestu käivitada, siis puhasta Dockeri vahemälu ja kasutuseta komponendid järgmiste käskudega:
```
docker builder prune
docker container prune
docker image prune
docker volume prune
docker network prune
```

Või kasuta üldist käsku:
```
docker system prune
```

Kui tahad Dockeri konteinereid kustutada, siis kasuta käsku:
```
docker rm haapsalu-mariadb haapsalu-app
```

Lisainfo dockeri kasutamise kohta: [https://mariadb.com/kb/en/installing-and-using-mariadb-via-docker/](https://mariadb.com/kb/en/installing-and-using-mariadb-via-docker/).

### Github tokeni lisamine rakendusse

Githubiga ühenduse loomiseks on vajalik Githubi tokeni loomine ja selle lisamine juurkataloogi .env faili.
1. Loo juurkataloogi `.env` fail
2. Loo Githubis token: [juhend](https://docs.github.com/en/enterprise-server@3.4/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
3. Token loomisel määra **Expiration**: "No expiration" ning **Select scopes** alt lisa linnuke tervele "repo" sektsioonile: <img width="600" alt="Screenshot 2023-01-07 at 09 15 18" src="https://user-images.githubusercontent.com/62253084/211138976-dde411be-4d47-4676-a6a8-8d24ce396e25.png">
4. `.env` faili sisuks määra:
   ```
   AUTH = 'Bearer ghp_SINUGITHUBITOKEN'
   ```

### Rakenduse käivitamine

Rakenduse käivitamiseks läbi Dockeri (koos andmebaasiga) kasuta käsku:

```
npm start
```

Rakenduse käivitamiseks ilma Dockerit kasutamata (ilma andmebaasita) kasuta käsku:

```
npm run start-app
```

Rakendus hakkab tööle lokaalses serveris: [localhost:3000](http://localhost:3000).


## Ainekursuste lisamine rakendusse

Uute ainekursuste lisamiseks järgi juhendeid sellest repositooriumist: https://github.com/tluhk/HK_Ainekursuse_mall

Ainekursuste materjalid asuvad Githubis tluhk organisatsiooni repositooriumites. Rakendus loeb Githubist ainult õppeaineid, mille repositooriumide nimed algavad eesliidesega `HK_` ja mille `config.json` failis on `active: true` .

## Valikpraktika I grupp

Tiina, Kristi, Krister, Juho, Kalev

Valikpraktika aine üldine repo: https://github.com/tluhk/rif20-valikpraktika

## Projekti sisust

**Töö sisuks on luua rakendus, mille kaudu saavad õppejõud ainekursuseid hallata ning õpilased ainekursuste materjale läbida.
Olemasolevate e-kursuste (nt Moodle) probleem on jäikus ja keerulisus (kõigile kõike), kuid samas kontrolli ja API puudus.**

### Rakenduse versioon 1 arendus koosneb järgmistest alamülesannetest:

- Eeltööga selgitada välja kursuse haldajate ning lõppkasutajate vajadused.
- Kaardistada kasutajateekonnad.
- Luua prototüüp.
- Luua esialgne rakendus.

Rakendus on täielikult haldajate kontrolli all, selle sisu on võimalik ristkasutada ning kasutajasõbralikul moel kätte saada, kuvada ja töödelda. Need on olnud seniste lahenduste nõrkused.

Õppematerjalide baasmaterjal asub Githubis tluhk organisatsiooni repositooriumites. Rakendus loeb Githubist ainult õppeaineid, mille repositooriumite nimed algavad eesliidesega `HK_` ja mille `config.json` failis on `active: true` .

Õppematerjali erinevate kursuste sisu on kättesaadav kolmel viisil: 1) jagades Githubis baasmaterjali veebiaadressi, 2) pärides baasmaterjali infot Github API kaudu, 3) eesrakenduses on igal leheküljel unikaalne aadress ja igal pealkirjal unikaalne ankur-aadress, mida saab kopeerida ning jagada lõppkasutajatele.

Rakenduse esimeses versioonis hallatakse õppematerjalide sisu läbi git-i,  eraldi kasutajaliidest sisu haldamiseks pole.

Lõppkasutajale on loodud kaasaegne kasutajaliides, mis on kasutatav nii mobiilis kui desktopis.  
Kasutatud on Handlebars tepmliitimiskeelt ning Tailwind CSS-raamistikku.
Sisumootoriks on Node + Express.js.
