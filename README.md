# Ikväll

En avskalad webbapp för att hålla koll på vad du dricker under kvällen. Ämnena **staplas som lager i ett glas**: vätska, alkohol, koffein och socker. Tryck på ett lager för att läsa vad mängden gör i kroppen.

## Så funkar det

- **Lägg till** med snabbval (med symboler: öl, vin, bubbel, sprit, alkoholfri öl, cola och läsk – med respektive utan koffein –, kaffe, vatten …) eller fritext, t.ex.
  `en öl, en espresso martini, en cola zero och två glas ramlösa`.
  Fritexten förstår antal (`två`, `3x`), volym (`50cl`), alkoholhalt (`4%`), `flaska vin` och ihopsatta drinkar (`vodka sprite`).
- **Lagrets höjd** = andel av en referensnivå. Den del som går över gränsen blir streckad.
- **Vatten – varva:** målet är ett glas vatten eller annat alkoholfritt per alkoholdryck (en flaska vin räknas som flera). Lagret fylls i takt med att du varvar och visas som kontur för det som saknas. Öl, vin och drinkar räknas inte som vätska. Vid 4 standardglas eller mer är vattnet bra, men appen säger tydligt att det inte hjälper fullt ut.
- **Alkohol** mäts i standardglas och följer Socialstyrelsens råd. Panelen visar uppskattad promille, vad mängden gör med omdöme, sömn och mående, när alkoholen är ute (vänta med bilkörning), kalorier, *Dricka smartare*-tips och en ruta *Om standardglas*.
- **Profil** (knappen till höger om plus): kön, vikt och längd ger en personlig uppskattning av promille och nedbrytningstid (Widmark med kroppsvattenandel enligt Seidl). Gränserna påverkas inte – de är samma för alla.
- **Visste du?** – en kort fakta om alkohol, som byts ut när kvällen fylls på.
- **Imorgon** – en mening om hur kvällen troligen påverkar morgondagen.

### Socialstyrelsens rekommendationer

- Ett standardglas = 12 g ren alkohol, t.ex. 33 cl starköl, 50 cl folköl, ett litet glas vin eller 4 cl sprit.
- Riskbruk: 4 standardglas eller mer vid ett tillfälle (en gång i månaden eller oftare), eller 10 eller mer per vecka. Samma för kvinnor och män.
- Undvik alkohol helt före 18 års ålder, vid graviditet och inför en operation.

Källa: [Läkartidningen om Socialstyrelsens nya alkoholråd](https://lakartidningen.se/nyheter/socialstyrelsen-skarper-alkoholrad-for-man-max-fyra-ol-pa-en-kvall/).

| Ämne | Referens (= full nivå) | Lägre nivåer |
|---|---|---|
| Alkohol | 4 standardglas (Socialstyrelsens gräns per tillfälle) | < 2 märks redan, 2–4 påverkar sömnen |
| Koffein | 200 mg på kvällen | < 100 mg lagom, 100–200 kan skjuta upp sömnen. Halveringstid 5 h |
| Socker | 50 g (WHO:s dagliga riktvärde) | 25–50 g blodsockersvängning |
| Vatten | 1 glas per alkoholdryck | – |

Tonen är saklig och utan pekpinnar, men syftet är att informera om alkoholens effekter och hjälpa till att göra mer informerade val (i linje med IQ:s uppdrag). Alla värden är ungefärliga och ska ge en bild av kvällen, inte medicinska råd.

## Köra

Öppna `index.html` i webbläsaren, eller kör `npm start` och gå till adressen som visas (bra för att testa i mobilen på samma nätverk). Data sparas lokalt i webbläsaren.

```
npm test
```

## Struktur

- `js/icons.js` – dryckessymboler (SVG)
- `js/drinks.js` – dryckesdatabas (~50 drycker och drinkar) och fritexttolkning
- `js/substances.js` – gränsvärden, texter om effekter, prognos för imorgon
- `js/app.js` – gränssnittet
- `styles.css` – ljust och mörkt tema

## Idéer framåt

- Tolka okända drinkar med en språkmodell (Claude) i stället för bara aliaslistan
- Veckovy, så att man ser kvällen mot Socialstyrelsens gräns på 10 standardglas per vecka
- Ändra tid på en dryck i efterhand, och läggdags-inställning för koffeinberäkningen
- Installera som PWA (hemskärmsikon, offline)
