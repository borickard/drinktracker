// Ämnen, gränsvärden och texter om vad de gör i kroppen.
// Tonen är saklig och lugn – informera, inte skrämma.
(function (root) {
  const UNIT_G = 12;
  const CAFFEINE_HALF_LIFE_H = 5;
  const ALCOHOL_BURN_G_PER_H = 7; // ungefär, för en vuxen på ~70 kg
  const DIURESIS_ML_PER_G = 10; // alkohol driver ut ca 1 dl extra vätska per 10 g

  const fmt = (n, d = 0) => n.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const clock = (t) => new Date(t).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  const HOUR = 3600e3;

  function totals(entries) {
    const t = { alcoholG: 0, caffeineMg: 0, sugarG: 0, waterMl: 0, softMl: 0 }; // softMl = alkoholfri vätska
    for (const e of entries) {
      t.alcoholG += e.alcoholG * e.count;
      t.caffeineMg += e.caffeineMg * e.count;
      t.sugarG += e.sugarG * e.count;
      t.waterMl += e.waterMl * e.count;
      if (e.alcoholG < 1) t.softMl += e.waterMl * e.count;
    }
    t.units = t.alcoholG / UNIT_G;
    t.lostMl = t.alcoholG * DIURESIS_ML_PER_G;
    t.netFluidMl = t.waterMl - t.lostMl;
    return t;
  }

  function contributors(entries, key, unit, scale = 1) {
    return entries
      .filter((e) => e[key] * e.count > 0.05)
      .map((e) => ({ name: (e.count > 1 ? e.count + ' × ' : '') + e.name, value: fmt(e[key] * e.count * scale) + ' ' + unit }));
  }

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
        if (t.waterMl === 0 && t.alcoholG === 0) return 'none';
        if (t.alcoholG === 0) return 'good';
        return t.netFluidMl >= 0 ? 'good' : 'notice';
      },
      describe(t, entries) {
        const lost = fmt(t.lostMl / 10);
        const got = fmt(t.waterMl / 10);
        const p = [];
        let headline;
        if (t.alcoholG === 0) {
          headline = 'Bra vätskebalans';
          p.push(`Du har fått i dig ungefär ${got} cl vätska. Vätska hjälper koncentration och energi, och kroppen återhämtar sig lättare i natt.`);
        } else if (t.netFluidMl >= 0) {
          headline = 'Alkoholen är kompenserad';
          p.push(`Alkoholen driver ut ungefär ${lost} cl extra vätska ur kroppen. Du har fått i dig ${got} cl, så balansen är på plus.`);
          p.push(t.softMl > 0
            ? 'Det minskar risken för huvudvärk, muntorrhet och trötthet imorgon.'
            : 'Vätskan kommer från dryckerna själva. Ett glas vatten till ger ändå marginal inför imorgon.');
        } else {
          headline = 'Lite vätskeunderskott';
          p.push(`Alkoholen driver ut ungefär ${lost} cl extra vätska, och du har fått i dig ${got} cl. Det blir ett underskott på ca ${fmt(-t.netFluidMl / 10)} cl.`);
          p.push(`Ungefär ${Math.max(1, Math.ceil(-t.netFluidMl / 250))} glas vatten före sängen jämnar ut det – det märks i måendet imorgon.`);
        }
        return { headline, paragraphs: p, from: contributors(entries, 'waterMl', 'cl', 0.1) };
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
          headline = 'Låg mängd';
          p.push(`${u} standardenhet (12 g alkohol per enhet). Ger avslappning och lite sänkta spärrar. Kroppen bryter ned ungefär en enhet på en och en halv till två timmar.`);
          p.push('Även en liten mängd kan göra sömnen något ytligare under natten.');
        } else if (t.units < 4) {
          headline = 'Påverkar sömnen';
          p.push(`${u} enheter. Du somnar ofta snabbare, men sömnen blir ytligare under andra halvan av natten och REM-sömnen – den som återställer humör och minne – blir kortare.`);
          p.push('Vilopulsen ligger ofta högre i natt, så återhämtningen blir sämre än vanligt.');
        } else {
          headline = 'Mycket för en kväll';
          p.push(`${u} enheter. Fyra eller fler vid ett tillfälle räknas som intensivkonsumtion. I den här mängden påverkas omdöme och koordination tydligt.`);
          p.push('Sömnen blir märkbart sämre, pulsen högre och kroppen tappar vätska. Imorgon kan du känna dig tröttare, mer lättirriterad och orolig än vanligt.');
          p.push('Vatten mellan glasen och något att äta hjälper.');
        }
        const first = Math.min(...entries.filter((e) => e.alcoholG > 0).map((e) => e.t));
        const done = first + (t.alcoholG / ALCOHOL_BURN_G_PER_H) * HOUR;
        if (done > Date.now()) p.push(`Alkoholen är ungefär ute ur kroppen runt kl ${clock(done)} (varierar med vikt, kön och mat).`);
        return { headline, paragraphs: p, from: contributors(entries, 'alcoholG', 'g') };
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

  // En mening om morgondagen.
  function tomorrow(t) {
    if (t.alcoholG === 0 && t.caffeineMg === 0 && t.sugarG === 0) {
      return t.waterMl > 0 ? 'Imorgon: pigg. Bara vätska ikväll.' : '';
    }
    let score = 0;
    const why = [];
    if (t.units >= 4) { score -= 2; why.push('alkoholen'); } else if (t.units >= 1.5) { score -= 1; why.push('alkoholen'); }
    if (t.caffeineMg >= 200) { score -= 1; why.push('koffeinet'); }
    if (t.sugarG >= 50) { score -= 0.5; why.push('sockret'); }
    if (t.alcoholG > 0) score += t.netFluidMl >= 0 ? 0.5 : -0.5;
    const feel = score >= 0 ? 'pigg' : score >= -1 ? 'ganska pigg' : score >= -2 ? 'lite seg' : 'seg';
    let s = `Imorgon: ${feel}.`;
    if (why.length) s += ` Sömnen påverkas av ${why.join(why.length > 2 ? ', ' : ' och ').replace(/, ([^,]*)$/, ' och $1')}.`;
    if (t.alcoholG > 0 && t.netFluidMl >= 0 && t.softMl > 0) s += ' Vattnet hjälper.';
    else if (t.alcoholG > 0 && t.netFluidMl >= 0) s += ' Vätskan räcker, men ett glas vatten skadar inte.';
    else if (t.alcoholG > 0) s += ' Ett glas vatten till hjälper.';
    return s;
  }

  const api = { SUBSTANCES, totals, tomorrow, caffeineAt, fmt, clock };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Substances = api;
})(typeof window !== 'undefined' ? window : globalThis);
