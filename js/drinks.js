// Dryckesdatabas + fritexttolkning.
// Allt är ungefärliga värden – tillräckligt för att ge en bild av kvällen, inte för medicinska beslut.
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
    { id: 'alkoholfri-ol', name: 'Alkoholfri öl', size: '33 cl · 0,5 %', ml: 330, abv: 0.5, sugar: 5, quick: true,
      aliases: ['alkoholfri öl', 'alkoholfri', 'lättöl', 'noll procent'] },
    { id: 'ol', name: 'Öl', size: '33 cl · 5 %', ml: 330, abv: 5, sugar: 0, quick: true,
      aliases: ['öl', 'öl', 'bärs', 'lager', 'pilsner', 'pils', 'ipa', 'apa', 'ale', 'stout', 'porter', 'veteöl', 'ljus lager', 'flaska öl', 'burk öl'] },
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
    { id: 'lask', name: 'Läsk', size: '33 cl · koffeinfri', ml: 330, sugar: 30, quick: true,
      aliases: ['läsk', 'fanta', 'sprite', '7up', 'seven up', 'sockerdricka', 'zingo', 'apotekarnes', 'julmust', 'påskmust', 'must', 'loranga', 'champis'] },
    { id: 'lask-zero', name: 'Läsk zero', size: '33 cl · koffeinfri', ml: 330, sugar: 0, quick: true,
      aliases: ['läsk zero', 'sockerfri läsk', 'fanta zero', 'sprite zero', '7up free', 'zero', 'light'] },
    { id: 'kaffe', name: 'Kaffe', size: '2 dl', ml: 200, caf: 100, quick: true, hydrates: false,
      aliases: ['kaffe', 'kopp kaffe', 'bryggkaffe', 'kaffen', 'americano', 'latte', 'cappuccino', 'flat white', 'cortado'] },
    { id: 'espresso', name: 'Espresso', size: '3 cl', ml: 30, caf: 63, quick: true, hydrates: false,
      aliases: ['espresso', 'espressos', 'espresson', 'dubbel espresso'] },
    { id: 'energi', name: 'Energidryck', size: '25 cl', ml: 250, caf: 80, sugar: 27, quick: true,
      aliases: ['energidryck', 'energi dryck', 'red bull', 'redbull', 'monster', 'nocco', 'celsius', 'battery'] },

    // --- Läsk & alkoholfritt ---
    { id: 'pepsi-max', name: 'Pepsi Max', size: '33 cl', ml: 330, caf: 43, aliases: ['pepsi max', 'pepsimax'] },
    { id: 'tonic', name: 'Tonic', size: '20 cl', ml: 200, sugar: 17, aliases: ['tonic', 'tonic water'] },
    { id: 'ginger-beer', name: 'Ginger beer', size: '20 cl', ml: 200, sugar: 20, aliases: ['ginger beer', 'ginger ale'] },
    { id: 'juice', name: 'Juice', size: '2 dl', ml: 200, sugar: 18, aliases: ['juice', 'apelsinjuice', 'äppeljuice', 'tranbärsjuice', 'saft', 'smoothie'] },
    { id: 'energi-zero', name: 'Energidryck sockerfri', size: '33 cl', ml: 330, caf: 105, aliases: ['sockerfri energidryck', 'red bull sugarfree', 'red bull zero', 'monster ultra', 'energidryck zero'] },
    { id: 'te', name: 'Te', size: '2 dl', ml: 200, caf: 40, aliases: ['te', 'svart te', 'grönt te', 'chai', 'earl grey'] },
    { id: 'matcha', name: 'Matcha', size: '2 dl', ml: 200, caf: 70, aliases: ['matcha', 'matcha latte'] },
    { id: 'orte', name: 'Örtte', size: '2 dl', ml: 200, aliases: ['örtte', 'rooibos', 'kamomill', 'kamomillte', 'pepparmintste'] },
    { id: 'folkol', name: 'Folköl', size: '33 cl · 3,5 %', ml: 330, abv: 3.5, aliases: ['folköl', 'mellanöl'] },
    { id: 'varm-choklad', name: 'Varm choklad', size: '2 dl', ml: 200, caf: 5, sugar: 20, aliases: ['varm choklad', 'O\'boy', 'oboy', 'kakao', 'chokladdryck'] },
    { id: 'kombucha', name: 'Kombucha', size: '33 cl', ml: 330, sugar: 8, caf: 10, aliases: ['kombucha'] },

    // --- Likör & starkvin ---
    { id: 'likor', name: 'Likör', size: '4 cl · 20 %', ml: 40, abv: 20, sugar: 12, aliases: ['likör', 'baileys', 'kahlua', 'kahlúa', 'amaretto', 'limoncello', 'sambuca', 'cointreau', 'triple sec'] },
    { id: 'jager', name: 'Jägermeister', size: '2 cl · 35 %', ml: 20, abv: 35, sugar: 2, aliases: ['jägermeister', 'jäger', 'jager', 'fernet'] },
    { id: 'portvin', name: 'Portvin', size: '6 cl · 20 %', ml: 60, abv: 20, sugar: 6, aliases: ['portvin', 'sherry', 'madeira', 'dessertvin', 'glögg'] },

    // --- Drinkar ---
    { id: 'espresso-martini', name: 'Espresso Martini', size: 'vodka, kaffelikör, espresso', ml: 100, alc: 15.8, caf: 65, sugar: 16,
      aliases: ['espresso martini', 'espressomartini', 'espresso martinis'] },
    { id: 'gin-tonic', name: 'Gin & tonic', size: '4 cl gin + tonic', ml: 190, alc: alcoholGrams(40, 40), sugar: 13,
      aliases: ['gin tonic', 'gin och tonic', 'gin & tonic', 'gt', 'g&t', 'vodka tonic'] },
    { id: 'cuba-libre', name: 'Rom & cola', size: '4 cl rom + cola', ml: 190, alc: alcoholGrams(40, 40), caf: 15, sugar: 16,
      aliases: ['cuba libre', 'rom cola', 'rom och cola', 'romcola', 'whisky cola', 'jack cola', 'vodka cola'] },
    { id: 'vodka-redbull', name: 'Vodka Red Bull', size: '4 cl vodka + energidryck', ml: 290, alc: alcoholGrams(40, 40), caf: 80, sugar: 27,
      aliases: ['vodka red bull', 'vodka redbull', 'vodka energi', 'jägerbomb', 'jager bomb', 'jägerbomb'] },
    { id: 'mojito', name: 'Mojito', size: '4 cl rom, lime, mynta', ml: 200, alc: alcoholGrams(40, 40), sugar: 16, aliases: ['mojito'] },
    { id: 'aperol-spritz', name: 'Aperol Spritz', size: 'aperol, prosecco, soda', ml: 180, alc: alcoholGrams(60, 11) + alcoholGrams(90, 11), sugar: 15,
      aliases: ['aperol spritz', 'aperol', 'spritz', 'hugo', 'hugo spritz', 'limoncello spritz'] },
    { id: 'negroni', name: 'Negroni', size: 'gin, campari, vermouth', ml: 90, alc: alcoholGrams(30, 40) + alcoholGrams(30, 25) + alcoholGrams(30, 16), sugar: 14,
      aliases: ['negroni', 'boulevardier', 'americano drink'] },
    { id: 'margarita', name: 'Margarita', size: 'tequila, triple sec, lime', ml: 100, alc: alcoholGrams(50, 40) + alcoholGrams(20, 40), sugar: 8,
      aliases: ['margarita', 'margaritas', 'paloma'] },
    { id: 'moscow-mule', name: 'Moscow Mule', size: '4 cl vodka + ginger beer', ml: 180, alc: alcoholGrams(40, 40), sugar: 14,
      aliases: ['moscow mule', 'mule', 'dark and stormy', 'dark n stormy'] },
    { id: 'old-fashioned', name: 'Old Fashioned', size: '6 cl whiskey', ml: 70, alc: alcoholGrams(60, 43), sugar: 5,
      aliases: ['old fashioned', 'manhattan', 'whisky sour', 'whiskey sour'] },
    { id: 'dry-martini', name: 'Dry Martini', size: 'gin, torr vermouth', ml: 70, alc: alcoholGrams(60, 40) + alcoholGrams(10, 17), sugar: 0,
      aliases: ['dry martini', 'martini', 'vodka martini', 'dirty martini'] },
    { id: 'cosmopolitan', name: 'Cosmopolitan', size: 'vodka, cointreau, tranbär', ml: 100, alc: alcoholGrams(40, 40) + alcoholGrams(15, 40), sugar: 10,
      aliases: ['cosmopolitan', 'cosmo'] },
    { id: 'pina-colada', name: 'Piña Colada', size: 'rom, kokos, ananas', ml: 250, alc: alcoholGrams(50, 40), sugar: 30,
      aliases: ['pina colada', 'piña colada', 'daiquiri', 'strawberry daiquiri'] },
    { id: 'long-island', name: 'Long Island Iced Tea', size: '5 sorters sprit + cola', ml: 250, alc: alcoholGrams(75, 40) + alcoholGrams(15, 40), caf: 10, sugar: 20,
      aliases: ['long island', 'long island iced tea'] },
    { id: 'irish-coffee', name: 'Irish Coffee', size: 'whiskey, kaffe, grädde', ml: 200, alc: alcoholGrams(40, 40), caf: 80, sugar: 8,
      aliases: ['irish coffee', 'kaffekask', 'kaffe karlsson', 'karlsson kaffe', 'kaffegrogg'] },
    { id: 'bloody-mary', name: 'Bloody Mary', size: '4 cl vodka, tomatjuice', ml: 200, alc: alcoholGrams(40, 40), sugar: 7, aliases: ['bloody mary'] },
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
