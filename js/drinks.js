// Dryckesdatabas + fritexttolkning.
// Allt är ungefärliga värden – tillräckligt för att ge en bild av kvällen, inte för medicinska beslut.
// Värdena är genomgångna mot tillverkarnas och butikernas näringsdeklarationer där det finns
// (t.ex. Coca-Cola 10,6 g socker och 9,6 mg koffein/100 ml, Fanta i Sverige 4 g socker/100 ml,
// alkoholfri lager 0,5–1,3 g socker/100 ml, Nocco 55 mg och Celsius 56 mg koffein/100 ml) och mot
// vanliga recept för drinkar. Märken skiljer sig åt – "läsk", "tonic" m.fl. är typvärden.
(function (root) {
  const ETHANOL_DENSITY = 0.789; // g/ml
  const UNIT_G = 12; // en svensk standardenhet = 12 g alkohol

  const alcoholGrams = (ml, abv) => ml * (abv / 100) * ETHANOL_DENSITY;

  // ml = total volym, abv = alkoholhalt i %, alc = gram alkohol (för drinkar med flera spritsorter),
  // caf = mg koffein, sugar = g socker. quick = visas som snabbval.
  // hydrates: false = räknas inte som vatten (t.ex. kaffe – små volymer).
  const DRINKS = [
    // --- Standarddrycker (snabbval) ---
    // Vatten och alkoholfritt först – en påminnelse, och det som sällan lyfts fram.
    { id: 'vatten', name: 'Vatten', size: '25 cl', ml: 250, quick: true,
      aliases: ['vatten', 'glas vatten', 'kranvatten', 'mineralvatten', 'kolsyrat vatten', 'ramlösa', 'loka', 'bonaqua', 'imsdal', 'san pellegrino', 'pellegrino', 'evian', 'sodavatten', 'soda'] },
    { id: 'alkoholfri-ol', name: 'Alkoholfri öl', size: '33 cl · 0,5 %', ml: 330, abv: 0.5, sugar: 3, quick: true,
      aliases: ['alkoholfri öl', 'alkoholfri', 'alkoholfritt öl', 'noll procent', 'nollprocentig öl', '0,0'] },
    { id: 'ol', name: 'Flasköl', size: '33 cl · 5 %', ml: 330, abv: 5, sugar: 0, quick: true,
      aliases: ['öl', 'flasköl', 'flask öl', 'bärs', 'lager', 'pilsner', 'pils', 'ale', 'stout', 'porter', 'veteöl', 'ljus lager', 'flaska öl', 'burk öl'] },
    { id: 'stor-stark', name: 'Stor stark', size: '40 cl · 5,3 %', ml: 400, abv: 5.3, sugar: 0, quick: true,
      aliases: ['stor stark', 'storstark', 'stor öl', 'fatöl', 'stark öl'] },
    { id: 'vin', name: 'Vin', size: '15 cl · 13 %', ml: 150, abv: 13, sugar: 1, quick: true, containers: { flaska: 750 },
      aliases: ['vin', 'rött', 'rödvin', 'rött vin', 'vitt', 'vitvin', 'vitt vin', 'rosé', 'rosévin', 'glas vin'] },
    { id: 'bubbel', name: 'Bubbel', size: '12 cl · 12 %', ml: 120, abv: 12, sugar: 1, quick: true, containers: { flaska: 750 },
      aliases: ['bubbel', 'champagne', 'cava', 'prosecco', 'mousserande', 'skumpa', 'crémant'] },
    { id: 'sprit', name: 'Sprit', size: '4 cl · 40 %', ml: 40, abv: 40, sugar: 0, quick: true,
      aliases: ['sprit', 'shot', 'shots', 'snaps', 'nubbe', 'vodka', 'gin', 'rom', 'whisky', 'whiskey', 'tequila', 'konjak', 'cognac', 'brandy', 'calvados', 'akvavit', 'mezcal', 'bourbon', 'grogg'] },
    { id: 'cider', name: 'Cider', size: '33 cl · 4,5 %', ml: 330, abv: 4.5, sugar: 30, quick: true,
      aliases: ['cider', 'päroncider', 'äppelcider', 'somersby', 'briska', 'kopparberg', 'rekorderlig'] },
    { id: 'cola', name: 'Cola', size: '33 cl · koffein', ml: 330, sugar: 35, caf: 32, quick: true,
      aliases: ['cola', 'coca cola', 'coke', 'pepsi', 'dr pepper'] },
    { id: 'cola-zero', name: 'Cola zero', size: '33 cl · koffein', ml: 330, sugar: 0, caf: 32, quick: true,
      aliases: ['cola zero', 'coke zero', 'coca cola zero', 'cola light', 'coca cola light', 'diet coke', 'pepsi light'] },
    { id: 'lask', name: 'Läsk', size: '33 cl · koffeinfri', ml: 330, sugar: 20, quick: true,
      aliases: ['läsk', 'fanta', 'sprite', '7up', 'seven up', 'sockerdricka', 'zingo', 'apotekarnes', 'julmust', 'påskmust', 'must', 'loranga', 'champis'] },
    { id: 'lask-zero', name: 'Läsk zero', size: '33 cl · koffeinfri', ml: 330, sugar: 0, quick: true,
      aliases: ['läsk zero', 'sockerfri läsk', 'fanta zero', 'sprite zero', '7up free', 'zero', 'light'] },
    { id: 'kaffe', name: 'Kaffe', size: '2 dl', ml: 200, caf: 100, quick: true, hydrates: false,
      aliases: ['kaffe', 'kopp kaffe', 'bryggkaffe', 'kaffen', 'americano', 'latte', 'cappuccino', 'flat white', 'cortado'] },
    { id: 'espresso', name: 'Espresso', size: '3 cl', ml: 30, caf: 63, quick: true, hydrates: false,
      aliases: ['espresso', 'espressos', 'espresson', 'dubbel espresso'] },
    { id: 'energi', name: 'Energidryck', size: '25 cl', ml: 250, caf: 80, sugar: 27, quick: true,
      aliases: ['energidryck', 'energi dryck', 'red bull', 'redbull', 'battery'] },

    // --- Läsk & alkoholfritt ---
    { id: 'monster', name: 'Monster', size: '50 cl', ml: 500, caf: 160, sugar: 55, aliases: ['monster', 'monster energy', 'stor energidryck'] },
    { id: 'monster-ultra', name: 'Monster Ultra', size: '50 cl · sockerfri', ml: 500, caf: 150, aliases: ['monster ultra', 'monster zero', 'monster white'] },
    { id: 'nocco', name: 'Nocco', size: '33 cl · sockerfri', ml: 330, caf: 180, aliases: ['nocco', 'nocco bcaa', 'nocco focus'] },
    { id: 'celsius', name: 'Celsius', size: '35,5 cl · sockerfri', ml: 355, caf: 200, aliases: ['celsius'] },
    { id: 'pepsi-max', name: 'Pepsi Max', size: '33 cl', ml: 330, caf: 43, aliases: ['pepsi max', 'pepsimax'] },
    { id: 'tonic', name: 'Tonic', size: '20 cl', ml: 200, sugar: 12, aliases: ['tonic', 'tonic water'] },
    { id: 'ginger-beer', name: 'Ginger beer', size: '20 cl', ml: 200, sugar: 16, aliases: ['ginger beer', 'ginger ale'] },
    { id: 'juice', name: 'Juice', size: '2 dl', ml: 200, sugar: 18, aliases: ['juice', 'apelsinjuice', 'äppeljuice', 'tranbärsjuice', 'saft', 'smoothie'] },
    { id: 'energi-zero', name: 'Energidryck sockerfri', size: '25 cl', ml: 250, caf: 80, aliases: ['sockerfri energidryck', 'red bull sugarfree', 'red bull zero', 'energidryck zero'] },
    { id: 'te', name: 'Te', size: '2 dl', ml: 200, caf: 40, aliases: ['te', 'svart te', 'grönt te', 'chai', 'earl grey'] },
    { id: 'matcha', name: 'Matcha', size: '2 dl', ml: 200, caf: 70, aliases: ['matcha', 'matcha latte'] },
    { id: 'orte', name: 'Örtte', size: '2 dl', ml: 200, aliases: ['örtte', 'rooibos', 'kamomill', 'kamomillte', 'pepparmintste'] },
    { id: 'folkol', name: 'Folköl', size: '33 cl · 3,5 %', ml: 330, abv: 3.5, aliases: ['folköl', 'mellanöl'] },
    { id: 'varm-choklad', name: 'Varm choklad', size: '2 dl', ml: 200, caf: 5, sugar: 20, aliases: ['varm choklad', 'O\'boy', 'oboy', 'kakao', 'chokladdryck'] },
    { id: 'kombucha', name: 'Kombucha', size: '33 cl', ml: 330, sugar: 8, caf: 10, aliases: ['kombucha'] },

    // --- Mer öl, cider och färdigblandat ---
    { id: 'lattol', name: 'Lättöl', size: '33 cl · 2,2 %', ml: 330, abv: 2.2, sugar: 3, aliases: ['lättöl', 'lätt öl', 'klass 1'] },
    { id: 'ipa', name: 'IPA', size: '33 cl · 6,5 %', ml: 330, abv: 6.5, sugar: 1, aliases: ['ipa', 'apa', 'neipa', 'dipa', 'pale ale', 'india pale ale', 'hantverksöl', 'craft beer'] },
    { id: 'halvliter', name: 'Burköl 50 cl', size: '50 cl · 5,3 %', ml: 500, abv: 5.3, sugar: 0, aliases: ['halvliter', 'burköl', 'storburk', 'stor burk', 'halv liter öl', '50 cl öl'] },
    { id: 'hard-seltzer', name: 'Hard seltzer', size: '33 cl · 4,5 %', ml: 330, abv: 4.5, sugar: 2, aliases: ['hard seltzer', 'seltzer', 'white claw', 'spiked seltzer'] },
    { id: 'rtd', name: 'Färdigblandad drink', size: '33 cl · 5 %', ml: 330, abv: 5, sugar: 25, aliases: ['färdigblandad', 'premix', 'alkoläsk', 'cooler', 'breezer', 'smirnoff ice', 'gt burk', 'long drink burk', 'lonkero'] },
    { id: 'sake', name: 'Sake', size: '10 cl · 15 %', ml: 100, abv: 15, sugar: 4, aliases: ['sake', 'saké'] },
    { id: 'sangria', name: 'Sangria', size: '20 cl · 8 %', ml: 200, abv: 8, sugar: 20, aliases: ['sangria', 'sangría', 'bål', 'punsch'] },
    { id: 'glogg', name: 'Glögg', size: '10 cl · 10 %', ml: 100, abv: 10, sugar: 17, aliases: ['glögg', 'vinglögg', 'glühwein'] },
    { id: 'fireball', name: 'Smaksatt shot', size: '4 cl · 33 %', ml: 40, abv: 33, sugar: 9, aliases: ['fireball', 'smaksatt shot', 'fisk', 'fisherman', 'minttu', 'salmiakki', 'tequila shot', 'sourz', 'apfelkorn'] },

    // --- Fler drinkar ---
    { id: 'whisky-sour', name: 'Whisky Sour', size: '5 cl whisky, citron, socker', ml: 110, alc: alcoholGrams(50, 40), sugar: 13,
      aliases: ['whisky sour', 'whiskey sour', 'bourbon sour', 'new york sour'] },
    { id: 'amaretto-sour', name: 'Amaretto Sour', size: '5 cl amaretto, citron', ml: 110, alc: alcoholGrams(50, 28), sugar: 20, aliases: ['amaretto sour'] },
    { id: 'pisco-sour', name: 'Pisco Sour', size: '5 cl pisco, lime, socker', ml: 110, alc: alcoholGrams(50, 40), sugar: 12, aliases: ['pisco sour', 'pisco'] },
    { id: 'tom-collins', name: 'Tom Collins', size: '5 cl gin, citron, soda', ml: 220, alc: alcoholGrams(50, 40), sugar: 12, aliases: ['tom collins', 'john collins', 'gin fizz', 'collins'] },
    { id: 'french-martini', name: 'French Martini', size: 'vodka, hallonlikör, ananas', ml: 110, alc: alcoholGrams(40, 40) + alcoholGrams(15, 16), sugar: 10, aliases: ['french martini'] },
    { id: 'pornstar-martini', name: 'Pornstar Martini', size: 'vaniljvodka, passion, bubbel', ml: 150, alc: alcoholGrams(40, 37.5) + alcoholGrams(15, 20) + alcoholGrams(40, 12), sugar: 18, aliases: ['pornstar martini', 'passion fruit martini', 'passionfruit martini'] },
    { id: 'daiquiri', name: 'Daiquiri', size: '5 cl rom, lime, socker', ml: 90, alc: alcoholGrams(50, 40), sugar: 9, aliases: ['daiquiri', 'hemingway daiquiri'] },
    { id: 'frozen-daiquiri', name: 'Frozen Daiquiri', size: 'rom, jordgubb, is', ml: 250, alc: alcoholGrams(50, 40), sugar: 25, aliases: ['strawberry daiquiri', 'frozen daiquiri', 'jordgubbsdaiquiri'] },
    { id: 'caipirinha', name: 'Caipirinha', size: '5 cl cachaça, lime, socker', ml: 120, alc: alcoholGrams(50, 40), sugar: 10, aliases: ['caipirinha', 'caipiroska', 'caipi'] },
    { id: 'mai-tai', name: 'Mai Tai', size: 'två sorters rom, curaçao', ml: 140, alc: alcoholGrams(60, 40) + alcoholGrams(15, 40), sugar: 13, aliases: ['mai tai', 'zombie', 'hurricane'] },
    { id: 'gimlet', name: 'Gimlet', size: '6 cl gin, lime', ml: 85, alc: alcoholGrams(60, 40), sugar: 9, aliases: ['gimlet', 'vodka gimlet', 'gin gimlet'] },
    { id: 'paloma', name: 'Paloma', size: '5 cl tequila, grapefrukt', ml: 200, alc: alcoholGrams(50, 40), sugar: 12, aliases: ['paloma'] },
    { id: 'tequila-sunrise', name: 'Tequila Sunrise', size: 'tequila, apelsinjuice, grenadin', ml: 200, alc: alcoholGrams(45, 40), sugar: 22, aliases: ['tequila sunrise'] },
    { id: 'sex-on-the-beach', name: 'Sex on the Beach', size: 'vodka, persikolikör, juice', ml: 200, alc: alcoholGrams(40, 40) + alcoholGrams(20, 20), sugar: 18, aliases: ['sex on the beach', 'woo woo'] },
    { id: 'screwdriver', name: 'Vodka & juice', size: '4 cl vodka + apelsinjuice', ml: 190, alc: alcoholGrams(40, 40), sugar: 14, aliases: ['screwdriver', 'vodka juice', 'vodka apelsin', 'vodka och juice'] },
    { id: 'vodka-sprite', name: 'Vodka & lemonad', size: '4 cl vodka + läsk', ml: 190, alc: alcoholGrams(40, 40), sugar: 12, aliases: ['vodka sprite', 'vodka lime', 'vodka lemonad', 'vodka 7up', 'vodka fanta'] },
    { id: 'hugo', name: 'Hugo', size: 'bubbel, fläder, mynta', ml: 180, alc: alcoholGrams(100, 11), sugar: 12, aliases: ['hugo', 'hugo spritz', 'flädersprtiz', 'fläderspritz', 'limoncello spritz', 'st germain spritz'] },
    { id: 'americano', name: 'Americano (drink)', size: 'campari, vermouth, soda', ml: 150, alc: alcoholGrams(30, 25) + alcoholGrams(30, 16), sugar: 12, aliases: ['americano drink', 'campari soda', 'campari'] },
    { id: 'kir', name: 'Kir Royale', size: 'bubbel + cassis', ml: 130, alc: alcoholGrams(120, 12) + alcoholGrams(10, 16), sugar: 6, aliases: ['kir royale', 'kir', 'kir royal'] },
    { id: 'mimosa', name: 'Mimosa', size: 'bubbel + apelsinjuice', ml: 150, alc: alcoholGrams(75, 11), sugar: 8, aliases: ['mimosa', 'bellini', 'buck fizz'] },
    { id: 'espresso-tonic', name: 'Espresso tonic', size: 'espresso + tonic', ml: 180, caf: 63, sugar: 10, aliases: ['espresso tonic'] },

    // --- Alkoholfria alternativ ---
    { id: 'mocktail', name: 'Alkoholfri drink', size: 'ca 25 cl', ml: 250, sugar: 20, aliases: ['alkoholfri drink', 'mocktail', 'virgin mojito', 'nojito', 'virgin', 'alkoholfri cocktail', 'drink utan alkohol'] },
    { id: 'alkoholfritt-vin', name: 'Alkoholfritt vin', size: '15 cl · 0,5 %', ml: 150, abv: 0.3, sugar: 6, aliases: ['alkoholfritt vin', 'alkoholfritt rött', 'alkoholfritt vitt', 'alkoholfri rosé'] },
    { id: 'alkoholfritt-bubbel', name: 'Alkoholfritt bubbel', size: '12 cl', ml: 120, sugar: 7, aliases: ['alkoholfritt bubbel', 'alkoholfri cava', 'alkoholfri prosecco', 'alkoholfri champagne'] },
    { id: 'alkoholfri-cider', name: 'Alkoholfri cider', size: '33 cl', ml: 330, sugar: 30, aliases: ['alkoholfri cider', 'äppelmust'] },
    { id: 'alkoholfri-glogg', name: 'Alkoholfri glögg', size: '10 cl', ml: 100, sugar: 22, aliases: ['alkoholfri glögg', 'blossa alkoholfri'] },
    { id: 'iste', name: 'Iste', size: '33 cl', ml: 330, caf: 12, sugar: 15, aliases: ['iste', 'ice tea', 'iced tea', 'lipton'] },
    { id: 'mjolk', name: 'Mjölk', size: '2 dl', ml: 200, sugar: 10, aliases: ['mjölk', 'havremjölk', 'oatly'] },
    { id: 'sportdryck', name: 'Sportdryck', size: '50 cl', ml: 500, sugar: 25, aliases: ['sportdryck', 'powerade', 'gatorade', 'vitamin well', 'vitaminvatten'] },
    { id: 'festis', name: 'Festis', size: '20 cl', ml: 200, sugar: 19, aliases: ['festis', 'o boy', 'bravo', 'mer'] },

    // --- Likör & starkvin ---
    { id: 'likor', name: 'Likör', size: '4 cl · 20 %', ml: 40, abv: 20, sugar: 12, aliases: ['likör', 'baileys', 'kahlua', 'kahlúa', 'amaretto', 'limoncello', 'sambuca', 'cointreau', 'triple sec'] },
    { id: 'jager', name: 'Jägermeister', size: '2 cl · 35 %', ml: 20, abv: 35, sugar: 2, aliases: ['jägermeister', 'jäger', 'jager', 'fernet'] },
    { id: 'portvin', name: 'Portvin', size: '6 cl · 20 %', ml: 60, abv: 20, sugar: 6, aliases: ['portvin', 'sherry', 'madeira', 'dessertvin', 'vermouth', 'vermut'] },

    // --- Drinkar ---
    { id: 'espresso-martini', name: 'Espresso Martini', size: 'vodka, kaffelikör, espresso', ml: 100, alc: 15.8, caf: 65, sugar: 16,
      aliases: ['espresso martini', 'espressomartini', 'espresso martinis'] },
    { id: 'gin-tonic', name: 'Gin & tonic', size: '4 cl gin + tonic', ml: 190, alc: alcoholGrams(40, 40), sugar: 10,
      aliases: ['gin tonic', 'gin och tonic', 'gin & tonic', 'gt', 'g&t', 'vodka tonic'] },
    { id: 'cuba-libre', name: 'Rom & cola', size: '4 cl rom + cola', ml: 190, alc: alcoholGrams(40, 40), caf: 15, sugar: 16,
      aliases: ['cuba libre', 'rom cola', 'rom och cola', 'romcola', 'whisky cola', 'jack cola', 'vodka cola'] },
    { id: 'vodka-redbull', name: 'Vodka Red Bull', size: '4 cl vodka + energidryck', ml: 290, alc: alcoholGrams(40, 40), caf: 80, sugar: 27,
      aliases: ['vodka red bull', 'vodka redbull', 'vodka energi', 'jägerbomb', 'jager bomb', 'jägerbomb'] },
    { id: 'mojito', name: 'Mojito', size: '4 cl rom, lime, mynta', ml: 200, alc: alcoholGrams(40, 40), sugar: 16, aliases: ['mojito'] },
    { id: 'aperol-spritz', name: 'Aperol Spritz', size: 'aperol, prosecco, soda', ml: 180, alc: alcoholGrams(60, 11) + alcoholGrams(90, 11), sugar: 15,
      aliases: ['aperol spritz', 'aperol', 'spritz', 'campari spritz'] },
    { id: 'negroni', name: 'Negroni', size: 'gin, campari, vermouth', ml: 90, alc: alcoholGrams(30, 40) + alcoholGrams(30, 25) + alcoholGrams(30, 16), sugar: 12,
      aliases: ['negroni', 'boulevardier', 'negroni sbagliato'] },
    { id: 'margarita', name: 'Margarita', size: 'tequila, triple sec, lime', ml: 100, alc: alcoholGrams(50, 40) + alcoholGrams(20, 40), sugar: 8,
      aliases: ['margarita', 'margaritas', 'frozen margarita'] },
    { id: 'moscow-mule', name: 'Moscow Mule', size: '4 cl vodka + ginger beer', ml: 180, alc: alcoholGrams(40, 40), sugar: 11,
      aliases: ['moscow mule', 'mule', 'dark and stormy', 'dark n stormy'] },
    { id: 'old-fashioned', name: 'Old Fashioned', size: '6 cl whiskey', ml: 70, alc: alcoholGrams(60, 43), sugar: 5,
      aliases: ['old fashioned', 'manhattan', 'bourbon old fashioned'] },
    { id: 'dry-martini', name: 'Dry Martini', size: 'gin, torr vermouth', ml: 70, alc: alcoholGrams(60, 40) + alcoholGrams(10, 17), sugar: 0,
      aliases: ['dry martini', 'martini', 'vodka martini', 'dirty martini'] },
    { id: 'cosmopolitan', name: 'Cosmopolitan', size: 'vodka, cointreau, tranbär', ml: 100, alc: alcoholGrams(40, 40) + alcoholGrams(15, 40), sugar: 10,
      aliases: ['cosmopolitan', 'cosmo'] },
    { id: 'pina-colada', name: 'Piña Colada', size: 'rom, kokos, ananas', ml: 250, alc: alcoholGrams(50, 40), sugar: 30,
      aliases: ['pina colada', 'piña colada'] },
    { id: 'long-island', name: 'Long Island Iced Tea', size: '4 sorters sprit + triple sec, cola', ml: 250, alc: alcoholGrams(75, 40), caf: 5, sugar: 20,
      aliases: ['long island', 'long island iced tea'] },
    { id: 'irish-coffee', name: 'Irish Coffee', size: 'whiskey, kaffe, grädde', ml: 200, alc: alcoholGrams(40, 40), caf: 65, sugar: 8,
      aliases: ['irish coffee', 'kaffekask', 'kaffe karlsson', 'karlsson kaffe', 'kaffegrogg'] },
    { id: 'bloody-mary', name: 'Bloody Mary', size: '4 cl vodka, tomatjuice', ml: 200, alc: alcoholGrams(40, 40), sugar: 5, aliases: ['bloody mary'] },
    { id: 'white-russian', name: 'White Russian', size: 'vodka, kaffelikör, grädde', ml: 120, alc: alcoholGrams(40, 40) + alcoholGrams(20, 20), caf: 2, sugar: 8,
      aliases: ['white russian', 'black russian'] },
    { id: 'french-75', name: 'French 75', size: 'gin, citron, bubbel', ml: 130, alc: alcoholGrams(30, 40) + alcoholGrams(80, 12), sugar: 8, aliases: ['french 75'] },
  ];

  // Räkna ut näringsinnehåll per portion (+ ev. skalning).
  function nutrients(d, factor = 1, abvOverride = null) {
    const ml = d.ml * factor;
    let alc;
    if (abvOverride != null) alc = alcoholGrams(ml, abvOverride);
    else if (d.alc != null) alc = d.alc * factor;
    else alc = alcoholGrams(ml, d.abv || 0);
    return {
      ml,
      alcoholG: alc,
      caffeineMg: (d.caf || 0) * factor,
      sugarG: (d.sugar || 0) * factor,
      waterMl: Math.max(0, ml - alc / ETHANOL_DENSITY),
      hydrates: d.hydrates !== false,
    };
  }

  // ---------- Fritext ----------
  const NUMBER_WORDS = {
    en: 1, ett: 1, ena: 1, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, åtta: 8, nio: 9, tio: 10,
    'ett par': 2, par: 2, dubbel: 2,
  };
  const FILLER = ['glas', 'flaska', 'flaskor', 'burk', 'burkar', 'kopp', 'koppar', 'st', 'stycken', 'styck',
    'shot', 'av', 'med', 'lite', 'en till', 'till', 'stor', 'stora', 'liten', 'små', 'drink', 'drinkar'];

  const normalize = (s) => ' ' + s.toLowerCase()
    .replace(/[’'´`]/g, '')
    .replace(/[^a-z0-9åäöéüñ%.,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() + ' ';

  // Alias-index sorterat på längd så att "cola zero" vinner över "cola" och "espresso martini" över "espresso".
  const ALIASES = [];
  for (const d of DRINKS) {
    for (const a of new Set([d.name, ...d.aliases])) {
      const n = normalize(a).trim();
      if (n) ALIASES.push({ alias: n, drink: d });
    }
  }
  ALIASES.sort((a, b) => b.alias.length - a.alias.length);

  function parseVolumeMl(text) {
    const m = text.match(/(\d+(?:[.,]\d+)?)\s*(ml|cl|dl|l)(?![a-zåäö])/);
    if (!m) return null;
    const v = parseFloat(m[1].replace(',', '.'));
    return { ml: v * { ml: 1, cl: 10, dl: 100, l: 1000 }[m[2]], match: m[0] };
  }

  function parseAbv(text) {
    const m = text.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (!m) return null;
    return { abv: parseFloat(m[1].replace(',', '.')), match: m[0] };
  }

  // Tolkar ett segment, t.ex. "två glas ramlösa" eller "vodka red bull 50cl".
  function parseSegment(raw) {
    let text = normalize(raw);
    if (!text.trim()) return null;

    let count = 1;
    const lead = text.match(/^ (\d+)\s*(x\s)?/);
    if (lead) { count = parseInt(lead[1], 10); text = ' ' + text.slice(lead[0].length); }
    else {
      for (const [w, n] of Object.entries(NUMBER_WORDS).sort((a, b) => b[0].length - a[0].length)) {
        if (text.startsWith(' ' + w + ' ')) { count = n; text = text.slice(w.length + 1); break; }
      }
    }
    const trail = text.match(/ x\s?(\d+) $/);
    if (trail) { count = parseInt(trail[1], 10); text = text.slice(0, -trail[0].length) + ' '; }

    const vol = parseVolumeMl(text);
    if (vol) text = text.replace(vol.match, ' ');
    const abv = parseAbv(text);
    if (abv) text = text.replace(abv.match, ' ');
    const flaska = / flask/.test(text);
    const big = / stor(a)? /.test(text);

    // Hitta alla icke-överlappande alias, längst först.
    const found = [];
    let rest = text;
    for (const { alias, drink } of ALIASES) {
      const needle = ' ' + alias + ' ';
      let idx = rest.indexOf(needle);
      while (idx !== -1) {
        found.push({ drink, pos: idx });
        rest = rest.slice(0, idx) + ' ' + '\u0000'.repeat(alias.length) + ' ' + rest.slice(idx + needle.length);
        idx = rest.indexOf(needle);
      }
    }
    // Om bara utfyllnadsord återstår är tolkningen säker.
    if (!found.length) return { raw: raw.trim(), unknown: true };
    found.sort((a, b) => a.pos - b.pos);

    const parts = found.map((f) => f.drink);
    let n;
    let name;
    if (parts.length === 1) {
      const d = parts[0];
      let factor = 1;
      if (vol) factor = vol.ml / d.ml;
      else if (flaska && d.containers && d.containers.flaska) factor = d.containers.flaska / d.ml;
      else if (big && d.id === 'ol') factor = 500 / d.ml;
      n = nutrients(d, factor, abv ? abv.abv : null);
      name = d.name;
    } else {
      // Ihopsatt drink, t.ex. "vodka sprite": summera ingredienserna.
      n = parts.map((d) => nutrients(d)).reduce((a, b) => ({
        ml: a.ml + b.ml, alcoholG: a.alcoholG + b.alcoholG, caffeineMg: a.caffeineMg + b.caffeineMg,
        sugarG: a.sugarG + b.sugarG, waterMl: a.waterMl + b.waterMl, hydrates: a.hydrates || b.hydrates,
      }));
      name = capitalize(raw.trim().replace(/^\s*(\d+|en|ett|två|tre|fyra|fem)\s+/i, ''));
    }
    return { raw: raw.trim(), name, count, ...n, matched: parts.map((d) => d.id) };
  }

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // Hela fritexten: "en öl, en espresso martini, en cola zero och två glas ramlösa"
  const OCH_ALIASES = ALIASES.map((a) => a.alias).filter((a) => a.includes(' och '));

  function parse(text) {
    // Skydda drinknamn som innehåller "och" (t.ex. "gin och tonic") innan vi delar upp texten.
    let src = text.toLowerCase();
    for (const a of OCH_ALIASES) src = src.split(a).join(a.replace(' och ', ' \u0001 '));
    return src
      .split(/,|;|\+|\n| och | samt /i)
      .map((s) => s.replace(/\u0001/g, 'och').trim())
      .filter((s) => s && !FILLER.includes(s.toLowerCase()))
      .map(parseSegment)
      .filter(Boolean);
  }

  function fromQuick(id) {
    const d = DRINKS.find((x) => x.id === id);
    return { raw: d.name, name: d.name, count: 1, ...nutrients(d), matched: [d.id] };
  }

  const api = { DRINKS, UNIT_G, ETHANOL_DENSITY, nutrients, parse, parseSegment, fromQuick,
    quick: DRINKS.filter((d) => d.quick) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Drinks = api;
})(typeof window !== 'undefined' ? window : globalThis);
