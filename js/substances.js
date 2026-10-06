// Ämnen, gränsvärden och texter om vad de gör i kroppen.
// Råden om alkohol följer Socialstyrelsens rekommendationer:
//   riskbruk = 4 standardglas eller mer vid ett tillfälle, eller 10 eller mer per vecka – samma för alla.
// Tonen är saklig och lugn – informera, inte skrämma.
(function (root) {
  const GLASS_G = 12; // ett standardglas = 12 g ren alkohol
  const OCCASION_LIMIT = 4; // standardglas per tillfälle
  const DRIVING_LIMIT = 0.2; // promille, gränsen för rattfylleri
  const ELIMINATION = 0.15; // promille per timme
  const CAFFEINE_HALF_LIFE_H = 5;
  const DIURESIS_ML_PER_G = 10; // alkohol driver ut ca 1 dl extra vätska per 10 g
  const WATER_GLASS_ML = 250; // varva: ett glas vatten per standardglas
  const KCAL_PER_G_ALCOHOL = 7;
  const KCAL_PER_G_SUGAR = 4;
  const DEFAULT_BODY = { weight: 75, height: 175, sex: null };

  const HOUR = 3600e3;
  const fmt = (n, d = 0) => n.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const clock = (t) => new Date(t).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  const nextDay = (t) => new Date(t).toDateString() !== new Date().toDateString();
  const isSoft = (e) => e.alcoholG < 1; // alkoholfri öl (< 1 g) räknas som alkoholfritt
  // Räknas som vatten: alkoholfritt, men inte kaffe och espresso (små volymer).
  const hydrates = (e) => isSoft(e) && e.hydrates !== false;
  const glassWord = (n) => (n === 1 ? 'ett glas' : `${n} glas`);

  // ---------- Kroppen ----------
  // Andel kroppsvatten (Widmarks r) enligt Seidl m.fl., som tar hänsyn till både vikt och längd.
  function bodyModel(profile) {
    const p = { ...DEFAULT_BODY, ...(profile || {}) };
    const w = p.weight || DEFAULT_BODY.weight;
    const h = p.height || DEFAULT_BODY.height;
    const rMan = 0.31608 - 0.004821 * w + 0.004632 * h;
    const rWoman = 0.31223 - 0.006446 * w + 0.004466 * h;
    const r = p.sex === 'man' ? rMan : p.sex === 'kvinna' ? rWoman : (rMan + rWoman) / 2;
    return { weight: w, height: h, sex: p.sex, r: Math.min(0.85, Math.max(0.45, r)), personal: !!(profile && profile.weight) };
  }

  // Promille över tid. Förenklat: alkoholen räknas som upptagen direkt, nedbrytning 0,15 ‰/h.
  function promille(entries, body, at = Date.now()) {
    const drinks = entries.filter((e) => e.alcoholG > 0).sort((a, b) => a.t - b.t);
    let bac = 0;
    let last = null;
    for (const e of drinks) {
      if (e.t > at) break;
      if (last != null) bac = Math.max(0, bac - ELIMINATION * ((e.t - last) / HOUR));
      bac += (e.alcoholG * e.count) / (body.r * body.weight);
      last = e.t;
    }
    if (last == null) return 0;
    return Math.max(0, bac - ELIMINATION * ((at - last) / HOUR));
  }

  function totals(entries, profile) {
    const body = bodyModel(profile);
    const t = { alcoholG: 0, caffeineMg: 0, sugarG: 0, softMl: 0, body };
    for (const e of entries) {
      t.alcoholG += e.alcoholG * e.count;
      t.caffeineMg += e.caffeineMg * e.count;
      t.sugarG += e.sugarG * e.count;
      // Bara alkoholfria drycker räknas som vätska – alkoholen gör att kroppen gör sig av med mer.
      if (hydrates(e)) t.softMl += e.waterMl * e.count;
    }
    t.glasses = t.alcoholG / GLASS_G;
    t.kcal = t.alcoholG * KCAL_PER_G_ALCOHOL + t.sugarG * KCAL_PER_G_SUGAR;
    // Varva: ett glas vatten (eller annat alkoholfritt) per alkoholdryck – en flaska vin räknas som flera.
    t.waterNeededGlasses = entries
      .filter((e) => !isSoft(e))
      .reduce((n, e) => n + e.count * Math.max(1, Math.round(e.alcoholG / GLASS_G)), 0);
    t.waterNeededMl = t.waterNeededGlasses * WATER_GLASS_ML;
    t.waterGlasses = Math.floor((t.softMl + 20) / WATER_GLASS_ML); // 20 ml marginal: 33 cl läsk = 1 glas
    t.alternating = t.alcoholG > 0 && t.waterGlasses >= t.waterNeededGlasses;
    t.lostMl = t.alcoholG * DIURESIS_ML_PER_G;
    t.bac = promille(entries, body);
    t.soberAt = Date.now() + (t.bac / ELIMINATION) * HOUR;
    return t;
  }

  function contributors(entries, key, unit, scale = 1, digits = 0) {
    return entries
      .filter((e) => e[key] * e.count > 0.05)
      .map((e) => ({ name: (e.count > 1 ? e.count + ' × ' : '') + e.name, value: fmt(e[key] * e.count * scale, digits) + ' ' + unit }));
  }

  function caffeineAt(entries, at) {
    return entries.reduce((sum, e) => {
      const h = Math.max(0, (at - e.t) / HOUR);
      return sum + e.caffeineMg * e.count * Math.pow(0.5, h / CAFFEINE_HALF_LIFE_H);
    }, 0);
  }

  function promilleText(bac) {
    if (bac < DRIVING_LIMIT) return 'Under gränsen för rattfylleri (0,2 ‰), men reaktionsförmågan kan redan vara påverkad.';
    if (bac < 0.5) return 'Över gränsen för rattfylleri. Omdöme och reaktionsförmåga påverkas, och man tar lättare risker.';
    if (bac < 1.0) return 'Tydligt påverkad: sämre balans, koordination och omdöme.';
    if (bac < 1.5) return 'Kraftigt påverkad. Risken ökar för olyckor, illamående och minnesluckor.';
    return 'Mycket hög promille. Risk för minnesluckor och alkoholförgiftning – sluta dricka och se till att inte vara ensam.';
  }

  // Varje ämne: load = andel av referensnivån (1 = gränsen nås).
  const SUBSTANCES = [
    {
      id: 'water', name: 'Vatten',
      amount: (t) => (t.alcoholG > 0 ? `${t.waterGlasses} av ${t.waterNeededGlasses} glas` : `${fmt(t.softMl / 10)} cl`),
      load: (t) => Math.max(t.softMl, t.waterNeededMl) / 1000,
      // Andel av lagret som är fyllt – resten visas som kontur (det som saknas för att varva).
      fill: (t) => (t.waterNeededMl > 0 ? Math.min(1, t.softMl / Math.max(t.softMl, t.waterNeededMl)) : 1),
      level(t) {
        if (t.softMl === 0 && t.alcoholG === 0) return 'none';
        if (t.alcoholG === 0 || t.alternating) return 'good';
        return 'notice';
      },
      describe(t, entries) {
        const p = [];
        let headline;
        const g = fmt(t.glasses, 1);
        if (t.alcoholG === 0) {
          headline = 'Bra vätskebalans';
          p.push(`Du har druckit ungefär ${fmt(t.softMl / 10)} cl. Vätska hjälper koncentration och energi, och kroppen återhämtar sig lättare i natt.`);
        } else if (t.alternating) {
          headline = t.glasses >= OCCASION_LIMIT ? 'Hjälper – men inte fullt ut' : 'Du varvar med vatten';
          p.push('Ett glas vatten eller annat alkoholfritt per glas alkohol gör att du dricker långsammare och minskar vätskeförlusten. Det minskar risken för huvudvärk och muntorrhet imorgon.');
          if (t.glasses >= OCCASION_LIMIT) {
            p.push(`Men vid ${g} standardglas påverkas sömn, återhämtning och mående imorgon ändå. Vatten gör dig inte nyktrare – det är bara tiden som bryter ned alkoholen.`);
          } else {
            p.push('Vatten gör dig däremot inte nyktrare och tar inte bort alkoholens effekt på sömnen.');
          }
        } else {
          const missing = t.waterNeededGlasses - t.waterGlasses;
          headline = t.softMl === 0 ? 'Inget vatten än' : 'Varva med vatten';
          p.push(`Du har druckit ${g} standardglas och ${glassWord(t.waterGlasses)} vatten eller alkoholfritt. Ett glas vatten per glas alkohol är en bra tumregel – du ligger ${glassWord(missing)} efter.`);
          p.push(`Att varva gör att du dricker långsammare, och alkoholen driver ut ungefär ${fmt(t.lostMl / 10)} cl vätska ur kroppen. Det märks i måendet imorgon.`);
          p.push('Öl, vin och drinkar räknas inte – alkoholen gör att kroppen gör sig av med mer vätska än den får. Kaffe räknas inte heller, eftersom det oftast är små volymer.');
        }
        return { headline, paragraphs: p, from: contributors(entries.filter(hydrates), 'waterMl', 'cl', 0.1) };
      },
    },
    {
      id: 'alcohol', name: 'Alkohol',
      amount: (t) => `${fmt(t.glasses, 1)} standardglas`,
      sub: (t) => (t.bac >= 0.05 ? `≈ ${fmt(t.bac, 1)} ‰ just nu` : ''),
      load: (t) => t.glasses / OCCASION_LIMIT,
      level(t) {
        if (t.glasses < 0.05) return 'none';
        if (t.glasses < 2) return 'ok';
        if (t.glasses < OCCASION_LIMIT) return 'notice';
        return 'over';
      },
      describe(t, entries) {
        const p = [];
        let headline;
        const g = fmt(t.glasses, 1);
        if (t.glasses < 2) {
          headline = 'Märks redan';
          p.push(`${g} standardglas. Du känner dig avslappnad, men omdöme och reaktionsförmåga påverkas redan innan du själv märker det. Även lite alkohol gör sömnen ytligare.`);
        } else if (t.glasses < OCCASION_LIMIT) {
          headline = 'Påverkar sömnen';
          p.push(`${g} standardglas. Du somnar ofta snabbare, men sömnen blir ytligare under andra halvan av natten och REM-sömnen – den som återställer humör och minne – blir kortare. Vilopulsen ligger högre och återhämtningen blir sämre.`);
          p.push(`Socialstyrelsens gräns för ett tillfälle är 4 standardglas. Du är på ${g}.`);
        } else {
          headline = 'Över Socialstyrelsens gräns';
          p.push(`${g} standardglas. Att dricka 4 standardglas eller mer vid ett tillfälle räknas som riskbruk om det sker en gång i månaden eller oftare.`);
          p.push('I den här mängden påverkas omdöme, balans och minne tydligt, och risken ökar för olyckor och skador. Sömnen blir märkbart sämre och imorgon kan du känna dig trött, nedstämd eller orolig.');
        }
        if (t.bac >= 0.05) p.push(`Uppskattad promille just nu: ${fmt(t.bac, 1)} ‰. ${promilleText(t.bac)}`);
        if (t.soberAt > Date.now() + 5 * 60e3) {
          p.push(`Kroppen bryter ned alkoholen i sin egen takt – inget kan skynda på det. Räkna med alkohol i blodet till ungefär kl ${clock(t.soberAt)}${nextDay(t.soberAt) ? ' imorgon' : ''}. Vänta med att köra bil tills dess.`);
        }
        p.push(`Kvällens alkohol${t.sugarG >= 1 ? ' och socker' : ''} motsvarar ungefär ${fmt(Math.round(t.kcal / 10) * 10)} kcal.`);
        if (!t.body.personal) p.push('Ange vikt, längd och kön i din profil för en uppskattning som passar dig.');
        return { headline, paragraphs: p, tips: alcoholTips(t, entries), guidance: true,
          from: contributors(entries, 'alcoholG', 'standardglas', 1 / GLASS_G, 1) };
      },
    },
    {
      id: 'caffeine', name: 'Koffein',
      amount: (t) => fmt(t.caffeineMg) + ' mg',
      load: (t) => t.caffeineMg / 200,
      level(t) {
        if (t.caffeineMg < 1) return 'none';
        if (t.caffeineMg < 100) return 'ok';
        if (t.caffeineMg < 200) return 'notice';
        return 'over';
      },
      describe(t, entries) {
        const p = [];
        let headline;
        const mg = fmt(t.caffeineMg);
        if (t.caffeineMg < 100) {
          headline = 'Lagom';
          p.push(`${mg} mg, ungefär som ${fmt(t.caffeineMg / 63, 1)} espresso. Ger ökad vakenhet och fokus i några timmar.`);
        } else if (t.caffeineMg < 200) {
          headline = 'Kan skjuta upp sömnen';
          p.push(`${mg} mg. Koffein blockerar adenosin – ämnet som gör dig sömnig – så det kan ta längre tid att somna.`);
        } else {
          headline = 'Påverkar sömnen';
          p.push(`${mg} mg på kvällen ger ofta längre insomning och mindre djupsömn, även om du känner dig trött. Återhämtningen blir sämre.`);
        }
        if (t.alcoholG > 0) p.push('Tillsammans med alkohol känner du dig piggare men blir inte nyktrare. Det gör det lätt att dricka mer än man tänkt.');
        const later = Date.now() + 6 * HOUR;
        p.push(`Halveringstiden är ca 5 timmar. Kl ${clock(later)} finns ungefär ${fmt(caffeineAt(entries, later))} mg kvar i kroppen.`);
        return { headline, paragraphs: p, from: contributors(entries, 'caffeineMg', 'mg') };
      },
    },
    {
      id: 'sugar', name: 'Socker',
      amount: (t) => fmt(t.sugarG) + ' g',
      load: (t) => t.sugarG / 50,
      level(t) {
        if (t.sugarG < 1) return 'none';
        if (t.sugarG < 25) return 'ok';
        if (t.sugarG < 50) return 'notice';
        return 'over';
      },
      describe(t, entries) {
        const p = [];
        let headline;
        const g = fmt(t.sugarG);
        const cubes = fmt(t.sugarG / 3);
        if (t.sugarG < 25) {
          headline = 'Lite socker';
          p.push(`${g} g, ungefär ${cubes} sockerbitar. Ger en snabb energiknuff.`);
        } else if (t.sugarG < 50) {
          headline = 'Blodsockret svänger';
          p.push(`${g} g, ungefär ${cubes} sockerbitar. Blodsockret går upp och sedan ner igen – det kan ge sug och en trötthetsdipp senare i kväll.`);
        } else {
          headline = 'Mer än ett dagsintag';
          p.push(`${g} g, ungefär ${cubes} sockerbitar – mer än WHO:s riktvärde för en hel dag (50 g).`);
          p.push('Stora blodsockersvängningar kan ge oroligare sömn och sötsug imorgon.');
        }
        if (t.alcoholG > 0 && t.sugarG >= 25) p.push('Sött döljer alkoholsmaken, så söta drinkar går ofta ned snabbare än man tänkt.');
        return { headline, paragraphs: p, from: contributors(entries, 'sugarG', 'g') };
      },
    },
  ];

  // Konkreta tips för att dricka smartare, i prioritetsordning utifrån kvällen.
  function alcoholTips(t, entries) {
    const has = (...ids) => entries.some((e) => e.matched && e.matched.some((m) => ids.includes(m)));
    const tips = [];
    if (!t.alternating) tips.push('Varva: ett glas vatten eller något alkoholfritt per glas alkohol.');
    if (t.glasses >= 2 && t.glasses < OCCASION_LIMIT) tips.push('Bestäm i förväg var kvällen slutar – Socialstyrelsens gräns är 4 standardglas.');
    if (t.glasses >= OCCASION_LIMIT) tips.push('Byt till alkoholfritt resten av kvällen – det märks imorgon.');
    if (t.caffeineMg > 0) tips.push('Koffein gör dig piggare men inte nyktrare – omdöme och reaktion påverkas lika mycket.');
    if (has('ol', 'stor-stark', 'folkol')) tips.push('Alkoholfri öl till nästa runda? Smaken är kvar, men inte effekten på sömnen.');
    if (t.sugarG >= 25) tips.push('Söta drinkar döljer alkoholsmaken och går ned fort.');
    tips.push('Ät något – med mat i magen stiger promillen långsammare.');
    return tips.slice(0, 3);
  }

  // "Visste du?" – en fakta som byts ut när kvällen fylls på.
  function fact(t, entries) {
    if (t.alcoholG === 0) return '';
    const facts = [
      'Socialstyrelsens gränser är desamma för kvinnor och män: 4 standardglas vid ett tillfälle eller 10 per vecka räknas som riskbruk.',
      'Vatten, kaffe och en kall dusch gör dig inte nykter. Levern bryter ned alkohol i sin egen takt.',
      'Alkohol är en av de vanligaste orsakerna till dålig sömn. På en pulsklocka syns det ofta som högre vilopuls hela natten.',
      'Kvinnor får i regel högre promille än män av samma mängd, eftersom kroppen innehåller mindre vatten.',
      'Alkohol ökar risken för flera cancerformer, även i små mängder. Ju mindre man dricker, desto lägre risk.',
      'Ångest dagen efter är vanligt. När alkoholen lämnar kroppen blir hjärnan tillfälligt uppvarvad.',
      'Socialstyrelsen avråder helt från alkohol före 18 års ålder, vid graviditet och inför en operation.',
      `Kvällens alkohol motsvarar ungefär ${fmt(Math.round((t.alcoholG * KCAL_PER_G_ALCOHOL) / 10) * 10)} kcal – kalorier som inte mättar.`,
    ];
    if (t.caffeineMg > 0) facts.unshift('Koffein och alkohol tillsammans gör att du känner dig mindre berusad än du är.');
    if (t.glasses >= 3) facts.unshift('Kroppen hinner bryta ned ungefär ett standardglas per 1–2 timmar. Dricker man snabbare än så stiger promillen.');
    const n = entries.reduce((a, e) => a + e.count, 0);
    return facts[n % facts.length];
  }

  // En mening om morgondagen.
  function tomorrow(t) {
    if (t.alcoholG === 0 && t.caffeineMg === 0 && t.sugarG === 0) {
      return t.softMl > 0 ? 'Imorgon: pigg. Bara alkoholfritt ikväll.' : '';
    }
    let score = 0;
    const why = [];
    if (t.glasses >= OCCASION_LIMIT) { score -= 2.5; why.push('alkoholen'); }
    else if (t.glasses >= 2) { score -= 1; why.push('alkoholen'); }
    else if (t.glasses > 0) score -= 0.5;
    if (t.caffeineMg >= 200) { score -= 1; why.push('koffeinet'); }
    if (t.sugarG >= 50) { score -= 0.5; why.push('sockret'); }
    // Att varva hjälper, men tar aldrig bort hela effekten av mycket alkohol.
    if (t.alcoholG > 0) score += t.alternating ? 0.5 : -0.5;
    const feel = score >= 0 ? 'pigg' : score >= -1 ? 'ganska pigg' : score >= -2 ? 'lite seg' : 'seg';
    let s = `Imorgon: ${feel}.`;
    if (why.length) s += ` Sömnen påverkas av ${why.join(why.length > 2 ? ', ' : ' och ').replace(/, ([^,]*)$/, ' och $1')}.`;
    if (t.alcoholG > 0 && t.alternating && t.glasses >= OCCASION_LIMIT) s += ' Vattnet hjälper, men inte fullt ut vid den här mängden.';
    else if (t.alcoholG > 0 && t.alternating) s += ' Bra att du varvar med vatten.';
    else if (t.alcoholG > 0) {
      const w = glassWord(t.waterNeededGlasses - t.waterGlasses);
      s += ` ${w.charAt(0).toUpperCase() + w.slice(1)} vatten till hjälper.`;
    }
    return s;
  }

  const api = { SUBSTANCES, totals, tomorrow, fact, promille, bodyModel, caffeineAt, fmt, clock, GLASS_G };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Substances = api;
})(typeof window !== 'undefined' ? window : globalThis);
