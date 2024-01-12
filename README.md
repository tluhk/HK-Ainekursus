# Ainekursuste rakendus

TLU HK RIF21 Valikpraktika aine raames jätkatakse Ainekursuse rakenduse arendust.

### Meeskonnaliikmete rollid:
Kaius Karon - tagarakenduse arendaja, eesrakenduse arendaja, testija

Siiri Inno - projektijuht, disainer, eesrakenduse arendaja, testija

### **Projekti kirjeldus, eesmärk ja umbkaudne tegevusplaan**

**Projekti kirjeldus**

Valikpraktika õppeaine ülesanne on edasi arendada ainekursuse
haldamise veebirakendust. Varasemalt on valikpraktika aine raames
tehtud ainekursuse sisu kuvamine eraldi veebirakenduses ja
diplomitöö raames kasutajakeskne haldus, kus kasutajad näevad
personaliseeritud vaateid ja teekondi.

**Projekti eesmärk**

Eesrakenduse kaudu andmete sisestamine ja muutmine. Kodutööde
kirjeldamine õpetaja poolt ja nende standardiseeritud esitamine
õpilaste poolt.  Lisada rakendusele sisestusliidesed:
- õpetajatele
  liides, millega saab eesrakenduses luua uut kursust või muuta
  olemasolevat. See ühendub vastava kursusega GitHubis: kas loob
  GitHubis uue repositooriumi või uuendab olemasolevat repositooriumit,
  mille kaudu uueneb info eesrakenduses. Seniks tuleb kursuse sisu
  uuendada läbi git-i;
-  õpilastele liides, millega saab eesrakenduses
   kodutöid esitada.

Lisada testid. Lisada GitHub’i CI/CD pipeline

**Projekti umbkaudne tegevuskava**

- 22.09.2023

  Projektiga tutvumine, repositooriumi ja README.md loomine, rollide
  jaotus, riskianalüüsi, eesmärkide ja tegevusplaani koostamine.
- 06.10.2023

  Intervjuu tellijaga, esialgne disain, koodi restruktueerimine
- 20.10.2023

  Disaini edasiarendus, koodi prototüübi loomine, testide kirjutamine
- 04.11.2023

  Disaini edasiarendus, koodi prototüübi loomine, testide kirjutamine
- 16.11.2023

  Kliendiga koos testimine
- 01.12.2023

  Paranduste tegemine
- 15.12.2023

  Projekti kaitsmine


### **Projekti riskianalüüs**


| **Tõenäosus/mõju**                   | **Tagarakendus**                                                                                                                                                                                                                                                                                                                                                        | **Disain**                           | **Eesrakendus**                                                                                                                                                                                                                                                                                                                                                                                                                           | **Testide tegemine**                                                                                                                                                                                                                                             |
|--------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Tõenäosus, et risk realiseerub       | 2                                                                                                                                                                                                                                                                                                                                                                                                                     | 2                                    | 2                                                                                                                                                                                                                                                                                                                                                                                                                                         | 4                                                                                                                                                                                                                                                                |
| Kahju suurus, kui risk realiseerub 	 | Rakendus ei saa valmis, sest arenduste maht on oodatust suurem | Disain ei vasta ootustele            | Rakendus ei tööta, nagu vaja                                                                                                                                                                                                                                                                                                                                                                                                              | Automaattestid ei kata tervet koodi                                                                                                                                                                                                                                                                                                                                                                                              	 |
| Riski maandamise meetmed   	         | Võtta esialgu väiksem tükk ette | Konsulteerimine kliendiga, testimine | Testimine, konsulteerimine kliendiga jooksvalt | Aja planeerimine                                                                                                                                                                                                                                                                                                                                                                                         	 |


