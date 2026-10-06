// Ämnen, gränsvärden och texter om vad de gör i kroppen.
// Tonen är saklig och lugn – informera, inte skrämma.
(function (root) {
  const UNIT_G = 12;
  const CAFFEINE_HALF_LIFE_H = 5;
  const ALCOHOL_BURN_G_PER_H = 7; // ungefär, för en vuxen på ~70 kg
  const DIURESIS_ML_PER_G = 10; // alkohol driver ut ca 1 dl extra vätska per 10 g
  const KCAL_PER_G_ALCOHOL = 7;
  const KCAL_PER_G_SUGAR = 4;
  const isSoft = (e) => e.alcoholG < 1; // < 1 g alkohol, t.ex. alkoholfri öl räknas som alkoholfritt

  const fmt = (n, d = 0) => n.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const clock = (t) => new Date(t).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  const HOUR = 3600e3;

  function totals(entries) {
    // Bara alkoholfria drycker räknas som vätska. Alkoholhaltiga drycker ger vätska men alkoholen
    // gör samtidigt att kroppen gör sig av med mer – de räknas därför inte som påfyllning.
    const t = { alcoholG: 0, caffeineMg: 0, sugarG: 0, softMl: 0, kcal: 0 };
    for (const e of entries) {
      t.alcoholG += e.alcoholG * e.count;
      t.caffeineMg += e.caffeineMg * e.count;
      t.sugarG += e.sugarG * e.count;
      if (isSoft(e)) t.softMl += e.waterMl * e.count;
    }
    t.units = t.alcoholG / UNIT_G;
    t.kcal = t.alcoholG * KCAL_PER_G_ALCOHOL + t.sugarG * KCAL_PER_G_SUGAR;
    t.lostMl = t.alcoholG * DIURESIS_ML_PER_G;
    t.netFluidMl = t.softMl - t.lostMl;
    return t;
  }

  function contributors(entries, key, unit, scale = 1) {
    return entries
      .filter((e) => e[key] * e.count > 0.05)
      .map((e) => ({ name: (e.count > 1 ? e.count + ' × ' : '') + e.name, value: fmt(e[key] * e.count * scale) + ' ' + unit }));
  }

  const glasses = (ml) => { const n = Math.max(1, Math.ceil(ml / 250)); return n === 1 ? 'Ett glas' : `${n} glas`; };

  function caffeineAt(entries, at) {
    return entries.reduce((sum, e) => {
      const h = Math.max(0, (at - e.t) / HOUR);
      return sum + e.caffeineMg * e.count * Math.pow(0.5, h / CAFFEINE_HALF_LIFE_H);
    }, 0);
  }

  // Varje ämne: load = andel av referensnivån (1 = gränsen nås).
  const SUBSTANCES = [
    {
      id: 'water', name: 'Vätska',
      amount: (t) => (t.netFluidMl >= 0 ? '+' : '−') + fmt(Math.abs(t.netFluidMl) / 10) + ' cl',
      load: (t) => Math.abs(t.netFluidMl) / 1000,
      deficit: (t) => t.netFluidMl < 0,
      level(t) {
        if (t.softMl === 0 && t.alcoholG === 0) return 'none';
        return t.netFluidMl >= 0 ? 'good' : 'notice';
      },
      describe(t, entries) {
        const lost = fmt(t.lostMl / 10);
        const got = fmt(t.softMl / 10);
        const p = [];
        let headline;
        if (t.alcoholG === 0) {
          headline = 'Bra vätskebalans';
          p.push(`Du har fått i dig ungefär ${got} cl vätska. Vätska hjälper koncentration och energi, och kroppen återhämtar sig lättare i natt.`);
        } else if (t.netFluidMl >= 0) {
          headline = 'Bra vätskebalans';
          p.push(`Alkoholen gör att kroppen gör sig av med ungefär ${lost} cl extra vätska. Med ${got} cl vatten och alkoholfritt är du på plus – det minskar risken för huvudvärk och muntorrhet imorgon.`);
          p.push('Vatten gör dig däremot inte nyktrare och tar inte bort alkoholens effekt på sömnen. Det är bara tiden som bryter ned alkoholen.');
        } else {
          headline = t.softMl === 0 ? 'Inget vatten än' : 'Lite vätskeunderskott';
          p.push(`Alkoholen gör att kroppen gör sig av med ungefär ${lost} cl extra vätska${t.softMl ? `, och du har druckit ${got} cl vatten eller alkoholfritt` : ''}. Det blir ett underskott på ca ${fmt(-t.netFluidMl / 10)} cl.`);
          p.push(`${glasses(-t.netFluidMl)} vatten jämnar ut det – gärna mellan glasen, annars före sängen. Det märks i måendet imorgon.`);
          p.push('Öl, vin och drinkar räknas inte som vätska här, eftersom alkoholen driver ut vätska ur kroppen.');
        }
        return { headline, paragraphs: p, from: contributors(entries.filter(isSoft), 'waterMl', 'cl', 0.1) };
      },
    },
    {
      id: 'alcohol', name: 'Alkohol',
      amount: (t) => fmt(t.units, 1) + ' enh',
      load: (t) => t.units / 4,
      level(t) {
        if (t.units < 0.05) return 'none';
        if (t.units < 1.5) return 'ok';
        if (t.units < 4) return 'notice';
        return 'over';
      },
      describe(t, entries) {
        const p = [];
        let headline;
        const u = fmt(t.units, 1);
        if (t.units < 1.5) {
          headline = 'Märks redan';
          p.push(`${u} standardenhet (12 g ren alkohol). Du känner dig avslappnad, men omdöme och reaktionsförmåga påverkas redan innan du själv märker det.`);
          p.push('Även en liten mängd gör sömnen något ytligare under natten.');
        } else if (t.units < 4) {
          headline = 'Påverkar sömnen';
          p.push(`${u} enheter. Du somnar ofta snabbare, men sömnen blir ytligare under andra halvan av natten och REM-sömnen – den som återställer humör och minne – blir kortare.`);
          p.push('Vilopulsen ligger ofta högre i natt och återhämtningen blir sämre. Dricker du snabbare än kroppen hinner bryta ned stiger promillen för varje glas.');
        } else {
          headline = 'Mycket för en kväll';
          p.push(`${u} enheter. Fyra eller fler vid ett tillfälle räknas som intensivkonsumtion. Omdöme, balans och minne påverkas tydligt, och det är här risken ökar för olyckor, skador och saker man ångrar.`);
          p.push('Sömnen blir märkbart sämre och kroppen tappar vätska. Imorgon kan du känna dig trött, nedstämd eller orolig – när alkoholen lämnar kroppen blir hjärnan tillfälligt uppvarvad.');
        }
        const first = Math.min(...entries.filter((e) => e.alcoholG > 0).map((e) => e.t));
        const done = first + (t.alcoholG / ALCOHOL_BURN_G_PER_H) * HOUR;
        if (done > Date.now()) {
          p.push(`Kroppen bryter ned ungefär en enhet på 1–2 timmar, och inget kan skynda på det. Räkna med alkohol i blodet till ungefär kl ${clock(done)}${nextDay(done) ? ' imorgon' : ''} – vänta med att köra bil tills dess.`);
        }
        p.push(`Kvällens alkohol${t.sugarG >= 1 ? ' och socker' : ''} motsvarar ungefär ${fmt(Math.round(t.kcal / 10) * 10)} kcal.`);
        return { headline, paragraphs: p, tips: alcoholTips(t, entries), from: contributors(entries, 'alcoholG', 'g') };
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
        const espressos = fmt(t.caffeineMg / 63, 1);
        if (t.caffeineMg < 100) {
          headline = 'Lagom';
          p.push(`${mg} mg, ungefär som ${espressos} espresso. Ger ökad vakenhet och fokus i några timmar.`);
        } else if (t.caffeineMg < 200) {
          headline = 'Kan skjuta upp sömnen';
          p.push(`${mg} mg. Koffein blockerar adenosin – ämnet som gör dig sömnig – så det kan ta längre tid att somna.`);
        } else {
          headline = 'Påverkar sömnen';
          p.push(`${mg} mg på kvällen ger ofta längre insomning och mindre djupsömn, även om du känner dig trött. Återhämtningen blir sämre.`);
        }
        if (t.alcoholG > 0) p.push('Tillsammans med alkohol kan koffeinet få dig att känna dig piggare än du är, vilket gör det lätt att dricka mer.');
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
          p.push('Sött maskerar alkoholsmaken så att det är lätt att dricka mer än man tänkt, och stora blodsockersvängningar kan ge oroligare sömn och sötsug imorgon.');
        }
        return { headline, paragraphs: p, from: contributors(entries, 'sugarG', 'g') };
      },
    },
  ];

  const nextDay = (t) => new Date(t).toDateString() !== new Date().toDateString();

  // Konkreta tips för att dricka smartare, i prioritetsordning utifrån kvällen.
  function alcoholTips(t, entries) {
    const has = (...ids) => entries.some((e) => e.matched && e.matched.some((m) => ids.includes(m)));
    const tips = [];
    if (t.netFluidMl < 0) tips.push('Varva med ett glas vatten eller något alkoholfritt.');
    if (t.caffeineMg > 0) tips.push('Koffein gör dig piggare men inte nyktrare – omdöme och reaktion påverkas lika mycket.');
    if (t.units >= 2) tips.push('Bestäm hur många glas det blir ikväll, och ta det lugnt med nästa.');
    if (has('ol', 'stor-stark', 'folkol')) tips.push('Alkoholfri öl till nästa runda? Smaken är kvar, men inte effekten på sömnen.');
    if (t.sugarG >= 25) tips.push('Söta drinkar döljer alkoholsmaken och går ned fort.');
    tips.push('Ät något – med mat i magen stiger promillen långsammare.');
    return tips.slice(0, 3);
  }

  // "Visste du?" – en fakta som byts ut när kvällen fylls på.
  function fact(t, entries) {
    if (t.alcoholG === 0) return '';
    const facts = [
      'Vatten, kaffe och en kall dusch gör dig inte nykter. Levern bryter ned alkohol i sin egen takt.',
      'Alkohol är en av de vanligaste orsakerna till dålig sömn. På en pulsklocka syns det ofta som högre vilopuls hela natten.',
      'Kvinnor får i regel högre promille än män av samma mängd, eftersom kroppen innehåller mindre vatten.',
      'Alkohol ökar risken för flera cancerformer, även i små mängder. Ju mindre man dricker, desto lägre risk.',
      'Ångest dagen efter är vanligt. När alkoholen lämnar kroppen blir hjärnan tillfälligt uppvarvad.',
      `Kvällens alkohol motsvarar ungefär ${fmt(Math.round((t.alcoholG * KCAL_PER_G_ALCOHOL) / 10) * 10)} kcal – kalorier som inte mättar.`,
    ];
    if (t.caffeineMg > 0) facts.unshift('Koffein och alkohol tillsammans gör att du känner dig mindre berusad än du är. Det gör det lätt att dricka mer.');
    if (t.units >= 3) facts.unshift('Kroppen hinner bryta ned ungefär en enhet per 1–2 timmar. Dricker man snabbare än så stiger promillen.');
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
    if (t.units >= 4) { score -= 2; why.push('alkoholen'); } else if (t.units >= 1.5) { score -= 1; why.push('alkoholen'); }
    if (t.caffeineMg >= 200) { score -= 1; why.push('koffeinet'); }
    if (t.sugarG >= 50) { score -= 0.5; why.push('sockret'); }
    // Vatten hjälper mot vätskeförlusten men tar inte bort alkoholens effekt – därför bara minuspoäng.
    if (t.alcoholG > 0 && t.netFluidMl < 0) score -= 0.5;
    const feel = score >= 0 ? 'pigg' : score >= -1 ? 'ganska pigg' : score >= -2 ? 'lite seg' : 'seg';
    let s = `Imorgon: ${feel}.`;
    if (why.length) s += ` Sömnen påverkas av ${why.join(why.length > 2 ? ', ' : ' och ').replace(/, ([^,]*)$/, ' och $1')}.`;
    if (t.alcoholG > 0 && t.netFluidMl >= 0) s += ' Vattnet minskar risken för huvudvärk.';
    else if (t.alcoholG > 0) s += ` ${glasses(-t.netFluidMl)} vatten före sängen hjälper.`;
    return s;
  }

  const api = { SUBSTANCES, totals, tomorrow, fact, caffeineAt, fmt, clock };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Substances = api;
})(typeof window !== 'undefined' ? window : globalThis);
