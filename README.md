# Ikväll

En avskalad webbapp för att hålla koll på vad du dricker under kvällen. Ämnena **staplas som lager i ett glas**: vätska, alkohol, koffein och socker. Tryck på ett lager för att läsa vad mängden gör i kroppen.

## Så funkar det

- **Lägg till** med snabbval (öl, vin, sprit, läsk, kaffe, vatten …) eller fritext, t.ex.
  `en öl, en espresso martini, en cola zero och två glas ramlösa`.
  Fritexten förstår antal (`två`, `3x`), volym (`50cl`), alkoholhalt (`4%`), `flaska vin` och ihopsatta drinkar (`vodka sprite`).
- **Lagrets höjd** = andel av en referensnivå. Den del som går över gränsen blir streckad.
- **Vätska** räknas netto: alkohol driver ut ca 1 dl vätska per 10 g alkohol, och vatten kompenserar. Vid underskott visas lagret som en kontur.
- **Imorgon**: en mening om hur kvällen troligen påverkar morgondagen.

| Ämne | Referens (= full nivå) | Lägre nivåer |
|---|---|---|
| Alkohol | 4 standardenheter (12 g) – intensivkonsumtion | < 1,5 enh låg, 1,5–4 påverkar sömnen |
| Koffein | 200 mg på kvällen | < 100 mg lagom, 100–200 kan skjuta upp sömnen. Halveringstid 5 h |
| Socker | 50 g (WHO:s dagliga riktvärde) | 25–50 g blodsockersvängning |
| Vätska | 1 liter netto | – |

Alla värden är ungefärliga och ska ge en bild av kvällen, inte medicinska råd.

## Köra

Öppna `index.html` i webbläsaren, eller kör `npm start` och gå till adressen som visas (bra för att testa i mobilen på samma nätverk). Data sparas lokalt i webbläsaren.

```
npm test
```

## Struktur

- `js/drinks.js` – dryckesdatabas (~50 drycker och drinkar) och fritexttolkning
- `js/substances.js` – gränsvärden, texter om effekter, prognos för imorgon
- `js/app.js` – gränssnittet
- `styles.css` – ljust och mörkt tema

## Idéer framåt

- Tolka okända drinkar med en språkmodell (Claude) i stället för bara aliaslistan
- Kroppsvikt och kön för bättre uppskattning av promille och nedbrytning
- Ändra tid på en dryck i efterhand, och läggdags-inställning för koffeinberäkningen
- Installera som PWA (hemskärmsikon, offline)
