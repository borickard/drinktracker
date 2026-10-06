// Ämnen, gränsvärden och texter om vad de gör i kroppen.
// Råden om alkohol följer Socialstyrelsens rekommendationer:
//   riskbruk = 4 standardglas eller mer vid ett tillfälle, eller 10 eller mer per vecka – samma för alla.
// Tonen är saklig och lugn – informera, inte skrämma.
(function (root) {
  const GLASS_G = 12; // ett standardglas = 12 g ren alkohol
  const RISK_GLASSES = 3; // mer än 3 standardglas på en kväll innebär en risk (Socialstyrelsen: 4 eller fler = riskbruk)
  // Avrundat till hela glas – 3 starköl (3,3 standardglas) är inte "mer än 3".
  const overRisk = (t) => Math.round(t.glasses) > RISK_GLASSES;
  const DRIVING_LIMIT = 0.2; // promille, gränsen för rattfylleri
  const ELIMINATION = 0.15; // promille per timme
  const CAFFEINE_HALF_LIFE_H = 5;
  const CAFFEINE_SLEEP_OK_MG = 50; // under ungefär 50 mg i kroppen påverkas sömnen lite
  const CAFFEINE_GONE_MG = 10; // i stort sett ute ur kroppen
  const DIURESIS_ML_PER_G = 10; // alkohol driver ut ca 1 dl extra vätska per 10 g
  const WATER_GLASS_ML = 250; // varva: ett glas vatten per standardglas
  const KCAL_PER_G_ALCOHOL = 7;
  const KCAL_PER_G_SUGAR = 4;
  const DEFAULT_BODY = { weight: 75, height: 175, sex: null };

  const HOUR = 3600e3;
  const fmt = (n, d = 0) => n.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const clock = (t) => new Date(t).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  const nextDay = (t) => new Date(t).toDateString() !== new Date().toDateString();
  const ETHANOL_DENSITY = 0.789;
  // Alkoholfritt = högst 0,5 % alkohol, t.ex. alkoholfri öl.
  const isSoft = (e) => e.alcoholG === 0 || (e.ml > 0 && e.alcoholG / ETHANOL_DENSITY / e.ml <= 0.0055);
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // Antal glas en alkoholfri dryck motsvarar: minst ett, en stor flaska blir flera.
  const glassesOf = (e) => e.count * Math.max(1, Math.round(e.waterMl / WATER_GLASS_ML));
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

  // Varje enskild dryck (2 × öl blir två) med sin tidpunkt.
  function units(entries) {
    const out = [];
    for (const e of entries) {
      for (let k = 0; k < e.count; k++) out.push({ e, t: e.t + k * (e.spread || 0) });
    }
    return out.sort((a, b) => a.t - b.t);
  }

  // Om användaren angett när hen började dricka – och det är före första registrerade dryck –
  // antar vi att dryckerna druckits jämnt utspridda från starttiden till sista registreringen.
  function effectiveEntries(entries, startAt) {
    if (!startAt || !entries.length) return entries;
    const sorted = [...entries].sort((a, b) => a.t - b.t);
    const first = sorted[0].t;
    const last = sorted[sorted.length - 1].t;
    if (startAt >= first) return entries;
    const total = sorted.reduce((n, e) => n + e.count, 0);
    const step = (Math.max(last, first) - startAt) / total;
    let before = 0;
    const map = new Map();
    for (const e of sorted) {
      map.set(e, { ...e, t: startAt + before * step, spread: step });
      before += e.count;
    }
    return entries.map((e) => map.get(e));
  }

  // Promille över tid. Förenklat: alkoholen räknas som upptagen direkt, nedbrytning 0,15 ‰/h.
  function promille(entries, body, at = Date.now()) {
    let bac = 0;
    let last = null;
    for (const { e, t } of units(entries.filter((x) => !isSoft(x)))) {
      if (t > at) break;
      if (last != null) bac = Math.max(0, bac - ELIMINATION * ((t - last) / HOUR));
      bac += e.alcoholG / (body.r * body.weight);
      last = t;
    }
    if (last == null) return 0;
    return Math.max(0, bac - ELIMINATION * ((at - last) / HOUR));
  }

  function totals(entries, profile) {
    const body = bodyModel(profile);
    const t = { alcoholG: 0, caffeineMg: 0, sugarG: 0, softMl: 0, body };
    for (const e of entries) {
      if (!isSoft(e)) t.alcoholG += e.alcoholG * e.count;
      t.caffeineMg += e.caffeineMg * e.count;
      t.sugarG += e.sugarG * e.count;
      // Bara alkoholfria drycker räknas som vätska – alkoholen gör att kroppen gör sig av med mer.
      if (hydrates(e)) t.softMl += e.waterMl * e.count;
    }
    t.glasses = t.alcoholG / GLASS_G;
    t.kcal = t.alcoholG * KCAL_PER_G_ALCOHOL + t.sugarG * KCAL_PER_G_SUGAR;
    // Varva: ett glas vatten (eller annat alkoholfritt) per alkoholdryck – en flaska vin räknas som flera.
    t.alcoholDrinks = entries
      .filter((e) => !isSoft(e))
      .reduce((n, e) => n + e.count * Math.max(1, Math.round(e.alcoholG / GLASS_G)), 0);
    t.waterGlasses = entries.filter(hydrates).reduce((n, e) => n + glassesOf(e), 0);
    t.alternating = t.alcoholG > 0 && t.waterGlasses >= t.alcoholDrinks;
    t.lostMl = t.alcoholG * DIURESIS_ML_PER_G;
    t.bac = promille(entries, body);
    t.caffeineSleepOkAt = t.caffeineMg > 0 ? caffeineBelow(entries, CAFFEINE_SLEEP_OK_MG) : null;
    t.caffeineGoneAt = t.caffeineMg > 0 ? caffeineBelow(entries, CAFFEINE_GONE_MG) : null;
    t.soberAt = Date.now() + (t.bac / ELIMINATION) * HOUR;
    return t;
  }

  function contributors(entries, key, unit, scale = 1, digits = 0) {
    return entries
      .filter((e) => e[key] * e.count > 0.05)
      .map((e) => ({ name: (e.count > 1 ? e.count + ' × ' : '') + e.name, value: fmt(e[key] * e.count * scale, digits) + ' ' + unit }));
  }

  function caffeineAt(entries, at) {
    return units(entries).reduce((sum, { e, t }) => {
      const h = Math.max(0, (at - t) / HOUR);
      return sum + e.caffeineMg * Math.pow(0.5, h / CAFFEINE_HALF_LIFE_H);
    }, 0);
  }

  // Första tidpunkt (från nu) då koffeinet i kroppen understiger en nivå. Steg om 5 min, max 48 h.
  function caffeineBelow(entries, mg, from = Date.now()) {
    for (let at = from; at < from + 48 * HOUR; at += 5 * 60e3) {
      if (caffeineAt(entries, at) < mg) return at;
    }
    return null;
  }

  const atClock = (t) => `kl ${clock(t)}${nextDay(t) ? ' imorgon' : ''}`;

  // Effekter vid olika promille, enligt IQ (iq.se/fakta-om-alkohol).
  function promilleText(bac) {
    if (bac < DRIVING_LIMIT) return 'Effekterna märks knappt än, men reaktionsförmågan kan redan påverkas.';
    if (bac < 0.5) return 'Runt 0,2 promille börjar de första effekterna märkas: välbefinnande och en känsla av att vara mer social. Det är också gränsen för rattfylleri.';
    if (bac < 1.0) return 'Från 0,5 promille släpper hämningarna och man blir upprymd, men omdömet försämras och det blir svårare att ta in information.';
    if (bac < 1.5) return 'Runt 1 promille blir talet sluddrigt, koordinationen sämre och det blir svårare att gå och att kontrollera känslor.';
    if (bac < 2.0) return 'Runt 1,5 promille kommer illamående och balansproblem, och risken för alkoholrelaterade skador ökar.';
    return 'Runt 2 promille kommer minnesluckor och förvirring, och det finns risk för medvetslöshet och alkoholförgiftning.';
  }

  // Varje ämne: load = andel av referensnivån (1 = gränsen nås).
  const SUBSTANCES = [
    {
      id: 'water', name: 'Vatten',
      amount: (t) => `${t.waterGlasses} glas`,
      load: (t) => (Math.max(t.waterGlasses, t.alcoholDrinks) * WATER_GLASS_ML) / 1000,
      // Andel av lagret som är fyllt – resten visas som kontur (det som saknas för att varva).
      fill: (t) => (t.alcoholDrinks > 0 ? Math.min(1, t.waterGlasses / Math.max(t.waterGlasses, t.alcoholDrinks)) : 1),
      level(t) {
        if (t.waterGlasses === 0 && t.alcoholG === 0) return 'none';
        if (t.alcoholG === 0 || t.alternating) return 'good';
        return 'notice';
      },
      describe(t, entries) {
        const p = [];
        let headline;
        let short;
        const g = fmt(t.glasses, 1);
        const drinks = t.alcoholDrinks === 1 ? 'en alkoholdryck' : `${t.alcoholDrinks} alkoholdrycker`;
        if (t.alcoholG === 0) {
          headline = 'Bra vätskebalans';
          p.push(`Du har druckit ${glassWord(t.waterGlasses)} vatten eller alkoholfritt. Vätska hjälper koncentration och energi, och kroppen återhämtar sig lättare i natt.`);
        } else if (t.waterGlasses > t.alcoholDrinks) {
          headline = 'Bra! Du dricker tillräckligt med vatten';
          short = 'Bra! Tillräckligt med vatten';
          p.push(`${capitalize(glassWord(t.waterGlasses))} vatten eller alkoholfritt mot ${drinks}. Att varva gör att du dricker långsammare och minskar vätskeförlusten – det minskar risken för huvudvärk och muntorrhet imorgon.`);
        } else if (t.alternating) {
          headline = 'Varannan vatten ✅';
          p.push(`${capitalize(glassWord(t.waterGlasses))} vatten eller alkoholfritt mot ${drinks}. Att varva gör att du dricker långsammare och minskar vätskeförlusten – det minskar risken för huvudvärk och muntorrhet imorgon.`);
        } else {
          const missing = t.alcoholDrinks - t.waterGlasses;
          headline = t.glasses >= 5 && missing > 2 ? 'Byt till vatten resten av kvällen' : `Drick ${glassWord(missing)} till för mer balans`;
          p.push(`${capitalize(glassWord(t.waterGlasses))} vatten eller alkoholfritt mot ${drinks}. Ett glas vatten per alkoholdryck – varannan vatten – är en bra tumregel.`);
          p.push(`Att varva gör att du dricker långsammare, och alkoholen driver ut ungefär ${fmt(t.lostMl / 10)} cl vätska ur kroppen. Det märks i måendet imorgon.`);
        }
        if (t.alcoholG > 0 && t.alternating) {
          p.push(overRisk(t)
            ? `Men vid ${g} standardglas påverkas sömn, återhämtning och mående imorgon ändå. Vatten gör dig inte nyktrare – det är bara tiden som bryter ned alkoholen.`
            : 'Vatten gör dig däremot inte nyktrare och tar inte bort alkoholens effekt på sömnen.');
        }
        if (t.alcoholG > 0) p.push('Vatten, läsk, alkoholfri öl och annat alkoholfritt räknas – men inte kaffe, eftersom det oftast är små volymer. En stor flaska räknas som flera glas.');
        return { headline, short, paragraphs: p, from: contributors(entries.filter(hydrates), 'waterMl', 'cl', 0.1) };
      },
    },
    {
      id: 'alcohol', name: 'Alkohol',
      amount: (t) => `${fmt(t.glasses, 1)} standardglas`,
      sub: (t) => (t.bac >= 0.05 ? `≈ ${fmt(t.bac, 1)} ‰ just nu` : ''),
      load: (t) => t.glasses / (RISK_GLASSES + 0.5),
      level(t) {
        if (t.glasses < 0.05) return 'none';
        if (t.glasses < 2) return 'ok';
        if (!overRisk(t)) return 'notice';
        return 'over';
      },
      describe(t, entries) {
        const p = [];
        let headline;
        let short;
        const g = fmt(t.glasses, 1);
        if (t.glasses < 1.05) {
          headline = 'Märks redan';
          p.push(`${g} standardglas. Du känner dig avslappnad, men omdöme och reaktionsförmåga påverkas innan du själv märker det. Även lite alkohol gör sömnen ytligare.`);
        } else if (t.glasses < 2) {
          headline = 'Påverkar omdömet';
          p.push(`${g} standardglas. Hämningarna släpper och man tar lättare risker. Sömnen blir ytligare och återhämtningen i natt sämre.`);
        } else if (!overRisk(t)) {
          headline = 'Påverkar sömnen';
          p.push(`${g} standardglas. Du somnar ofta snabbare, men sömnen blir ytligare under andra halvan av natten och REM-sömnen – den som återställer humör och minne – blir kortare. Vilopulsen ligger högre och återhämtningen blir sämre.`);
          p.push('Mer än 3 standardglas på en kväll innebär en risk. Ett glas vatten eller något alkoholfritt till nästa runda gör skillnad.');
        } else if (t.glasses < 5) {
          headline = 'Mer än 3 standardglas innebär en risk';
          short = 'Innebär en risk';
          p.push(`${g} standardglas. Att dricka mer än 3 standardglas på en kväll innebär en risk för hälsan. Gör man det en gång i månaden eller oftare räknas det som riskbruk.`);
          p.push('Sömnen blir märkbart sämre, och risken ökar för bakfylla imorgon – huvudvärk, illamående, trötthet och ångest.');
        } else if (t.glasses < 7) {
          headline = 'Risken för skador ökar';
          p.push(`${g} standardglas. Omdöme, balans och koordination påverkas tydligt, och risken ökar för olyckor, bråk och skador – och för att göra saker man ångrar.`);
          p.push('Bakfyllan imorgon blir ofta påtaglig. Byt till vatten eller alkoholfritt resten av kvällen.');
        } else {
          headline = 'Risk för minnesluckor och förgiftning';
          short = 'Risk för minnesluckor';
          p.push(`${g} standardglas. I den här mängden finns risk för minnesluckor, kraftigt illamående och alkoholförgiftning.`);
          p.push('Sluta dricka alkohol, drick vatten och se till att inte vara ensam. Om någon inte går att väcka eller andas oregelbundet – ring 112.');
        }
        if (t.bac >= 0.05) p.push(`Uppskattad promille just nu: ${fmt(t.bac, 1)} ‰. ${promilleText(t.bac)}`);
        if (t.soberAt > Date.now() + 5 * 60e3) {
          p.push(`Kroppen bryter ned alkoholen i sin egen takt – vila, träning och kaffe gör varken till eller från. Räkna med alkohol i blodet till ungefär kl ${clock(t.soberAt)}${nextDay(t.soberAt) ? ' imorgon' : ''}. Vänta med att köra bil tills dess.`);
        }
        if (overRisk(t)) p.push('Även när alkoholen är ute kan förmågan att köra bil vara nedsatt dagen efter – i studier med upp till 20 procent.');
        p.push(`Kvällens alkohol${t.sugarG >= 1 ? ' och socker' : ''} motsvarar ungefär ${fmt(Math.round(t.kcal / 10) * 10)} kcal.`);
        if (!t.body.personal) p.push('Ange vikt, längd och kön i din profil för en uppskattning som passar dig.');
        return { headline, short, paragraphs: p, tips: alcoholTips(t, entries), guidance: true,
          from: contributors(entries, 'alcoholG', 'standardglas', 1 / GLASS_G, 1) };
      },
    },
    {
      id: 'caffeine', name: 'Koffein',
      amount: (t) => fmt(t.caffeineMg) + ' mg',
      sub: (t) => (t.caffeineSleepOkAt > Date.now() ? `sömnvänligt ${clock(t.caffeineSleepOkAt)}` : ''),
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
        const now = Date.now();
        const left = caffeineAt(entries, now);
        if (left >= CAFFEINE_SLEEP_OK_MG) {
          p.push(`Just nu finns ungefär ${fmt(left)} mg i kroppen. Runt ${atClock(t.caffeineSleepOkAt)} är det under ${CAFFEINE_SLEEP_OK_MG} mg – då påverkar koffeinet sömnen lite. I stort sett ute ur kroppen är det runt ${atClock(t.caffeineGoneAt)}.`);
        } else if (left >= CAFFEINE_GONE_MG) {
          p.push(`Det som finns kvar, ungefär ${fmt(left)} mg, påverkar sömnen lite. I stort sett ute ur kroppen är det runt ${atClock(t.caffeineGoneAt)}.`);
        } else {
          p.push('Koffeinet är i stort sett ute ur kroppen.');
        }
        p.push('Halveringstiden är ungefär 5 timmar men varierar mellan personer, ofta 3–7 timmar.');
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
    if (t.glasses >= 2 && !overRisk(t)) tips.push('Bestäm i förväg var kvällen slutar – mer än 3 standardglas innebär en risk.');
    if (overRisk(t)) tips.push('Byt till alkoholfritt resten av kvällen – det märks imorgon.');
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
      'Det finns inget riskfritt drickande. Mer än 3 standardglas på en kväll, eller 10 i veckan, räknas som riskbruk – samma gräns för kvinnor och män.',
      'Vila, träning och kaffe gör varken till eller från. Levern bryter ned alkohol i sin egen takt – ett glas vin tar ungefär 2 timmar, en stor stark 3–4 timmar.',
      'Bakfylla beror bland annat på vätskebrist och på att levern arbetar hårt. Bastu och starkt kaffe hjälper inte – vatten och sömn gör det.',
      'Förmågan att köra bil kan vara nedsatt dagen efter, även när alkoholen är ute ur kroppen.',
      'Att dricka alkohol dagen efter för att må bättre är förenat med riskbruk.',
      'Alkohol är en av de vanligaste orsakerna till dålig sömn. På en pulsklocka syns det ofta som högre vilopuls hela natten.',
      'Kvinnor får i regel högre promille än män av samma mängd och bryter ned alkohol långsammare.',
      'Alkohol ökar risken för flera cancerformer, även i små mängder. Ju mindre man dricker, desto lägre risk.',
      'Ångest dagen efter är vanligt. Alkohol påverkar hjärnans signalsubstanser för humör och känslor – och omdömet, så det är lättare att göra något man ångrar.',
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
    if (t.glasses >= 5) { score -= 3; why.push('alkoholen'); }
    else if (overRisk(t)) { score -= 2.5; why.push('alkoholen'); }
    else if (t.glasses >= 2) { score -= 1; why.push('alkoholen'); }
    else if (t.glasses > 0) score -= 0.5;
    if (t.caffeineMg >= 200) { score -= 1; why.push('koffeinet'); }
    if (t.sugarG >= 50) { score -= 0.5; why.push('sockret'); }
    // Att varva hjälper, men tar aldrig bort hela effekten av mycket alkohol.
    if (t.alcoholG > 0) score += t.alternating ? 0.5 : -0.5;
    const feel = score >= 0 ? 'pigg' : score >= -1 ? 'ganska pigg' : score >= -2 ? 'lite seg' : 'seg';
    let s = overRisk(t) ? `Imorgon: ${feel}, med risk för bakfylla.` : `Imorgon: ${feel}.`;
    if (why.length) s += ` Sömnen påverkas av ${why.join(why.length > 2 ? ', ' : ' och ').replace(/, ([^,]*)$/, ' och $1')}.`;
    if (t.alcoholG > 0 && t.alternating && overRisk(t)) s += ' Vattnet hjälper, men inte fullt ut vid den här mängden.';
    else if (t.alcoholG > 0 && t.alternating) s += ' Bra att du varvar med vatten.';
    else if (t.glasses >= 5) s += ' Byt till vatten resten av kvällen.';
    else if (t.alcoholG > 0) {
      s += ` ${capitalize(glassWord(t.alcoholDrinks - t.waterGlasses))} vatten till hjälper.`;
    }
    return s;
  }

  const api = { SUBSTANCES, totals, tomorrow, fact, promille, bodyModel, caffeineAt, effectiveEntries, fmt, clock, GLASS_G };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Substances = api;
})(typeof window !== 'undefined' ? window : globalThis);
