// Små dryckessymboler (inline SVG). Konturen följer textfärgen, fyllningen visar drycken.
(function (root) {
  const S = 'stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';
  const svg = (body) => `<svg class="icon" viewBox="0 0 32 32" aria-hidden="true">${body}</svg>`;
  const can = (color, extra = '') => svg(`
    <rect x="10" y="5" width="12" height="22" rx="2.5" fill="${color}" ${S}/>
    <path d="M10 10h12M10 22h12" ${S} fill="none" stroke-opacity=".35"/>${extra}`);

  const ICONS = {
    ol: svg(`
      <path d="M8 10h13v14a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z" fill="#e2a64b"/>
      <rect x="7.5" y="6" width="14" height="5" rx="2.5" fill="#fbf3df"/>
      <path d="M8 8.5v15.5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.5M21 12h2.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H21" ${S} fill="none"/>`),
    'stor-stark': svg(`
      <path d="M9 5h14l-2 22H11z" fill="#e2a64b"/>
      <path d="M9 5h14l-.4 4.5H9.4z" fill="#fbf3df"/>
      <path d="M9 5h14l-2 22H11z" ${S} fill="none"/>`),
    vin: svg(`
      <path d="M10.3 9h11.4c-.4 4-2.6 6.5-5.7 6.5s-5.3-2.5-5.7-6.5z" fill="#a3324b"/>
      <path d="M10 5h12c.4 6.5-2.5 10.5-6 10.5S9.6 11.5 10 5zM16 15.5V26M12 26.5h8" ${S} fill="none"/>`),
    bubbel: svg(`
      <path d="M13.3 8h5.4l-.4 7.2c-.2 2-1.1 3-2.3 3s-2.1-1-2.3-3z" fill="#e9cf74"/>
      <circle cx="15.3" cy="12" r=".7" fill="#fff"/><circle cx="16.7" cy="14.8" r=".6" fill="#fff"/>
      <path d="M13 4h6l-.6 11.2c-.2 2-1.2 3-2.4 3s-2.2-1-2.4-3zM16 18.2V26M13 26.5h6" ${S} fill="none"/>`),
    sprit: svg(`
      <path d="M10.6 17h10.8l-1 9h-8.8z" fill="#c98b3a"/>
      <path d="M10 12h12l-1.5 14h-9z" ${S} fill="none"/>`),
    cider: svg(`
      <path d="M9.6 11h12.8L21 26H11z" fill="#d6c158"/>
      <path d="M9 7h14l-1.8 19.5h-10.4z" ${S} fill="none"/>`),
    cola: can('#b3262d'),
    'cola-zero': can('#2b2b2b', `<path d="M10 14h12v4H10z" fill="#c8333a"/>`),
    lask: can('#e8892b', `<circle cx="16" cy="16" r="3" fill="#f6d36b"/>`),
    'lask-zero': can('#e9e5dc', `<circle cx="16" cy="16" r="3" fill="#e8892b"/>`),
    'alkoholfri-ol': svg(`
      <path d="M8 10h13v14a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z" fill="#f0d79a"/>
      <rect x="7.5" y="6" width="14" height="5" rx="2.5" fill="#fbf3df"/>
      <text x="14.5" y="22.5" text-anchor="middle" font-size="9" font-weight="700" font-family="system-ui, sans-serif" fill="#8a6a2a">0</text>
      <path d="M8 8.5v15.5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.5M21 12h2.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H21" ${S} fill="none"/>`),
    kaffe: svg(`
      <path d="M7 12h15v6a6 6 0 0 1-6 6h-3a6 6 0 0 1-6-6z" fill="#6e4c3a"/>
      <path d="M7 12h15v6a6 6 0 0 1-6 6h-3a6 6 0 0 1-6-6zM22 14h1.5a2.5 2.5 0 0 1 0 5H22M6 27h18M12 5.5c-1 1 1 2 0 3.5M17 5.5c-1 1 1 2 0 3.5" ${S} fill="none"/>`),
    espresso: svg(`
      <path d="M10 15h10v3.5a4.5 4.5 0 0 1-4.5 4.5h-1A4.5 4.5 0 0 1 10 18.5z" fill="#4a3226"/>
      <path d="M10 15h10v3.5a4.5 4.5 0 0 1-4.5 4.5h-1A4.5 4.5 0 0 1 10 18.5zM20 16.5h1a2 2 0 0 1 0 4h-1.3M8 26h14" ${S} fill="none"/>`),
    energi: can('#2f62ad', `<path d="M17 9l-4 7h3l-1 6 4-7.5h-3z" fill="#f4d23c"/>`),
    vatten: svg(`
      <path d="M9.5 12.5h13L21.2 26H10.8z" fill="#8fb9df"/>
      <path d="M9 7h14l-1.8 19.5h-10.4z" ${S} fill="none"/>`),
    drink: svg(`
      <path d="M9 9h14l-7 7.5z" fill="#e69bb2"/>
      <path d="M7 7h18l-9 9.8zM16 16.8V26M12 26.5h8M20 4l-2.5 5" ${S} fill="none"/>`),
    te: svg(`
      <path d="M7 12h15v6a6 6 0 0 1-6 6h-3a6 6 0 0 1-6-6z" fill="#9aae6a"/>
      <path d="M7 12h15v6a6 6 0 0 1-6 6h-3a6 6 0 0 1-6-6zM22 14h1.5a2.5 2.5 0 0 1 0 5H22M6 27h18" ${S} fill="none"/>`),
    juice: svg(`
      <path d="M9.6 11h12.8L21 26H11z" fill="#f0a030"/>
      <path d="M9 7h14l-1.8 19.5h-10.4z" ${S} fill="none"/>`),
  };

  // Symbol för en dryck: egen symbol, annars en närliggande, annars utifrån innehållet.
  const ALIAS = {
    folkol: 'ol', 'pepsi-max': 'cola-zero', tonic: 'vatten', 'ginger-beer': 'cider',
    'energi-zero': 'energi', matcha: 'te', orte: 'te', 'varm-choklad': 'kaffe', kombucha: 'te', 'irish-coffee': 'kaffe',
    likor: 'sprit', jager: 'sprit', portvin: 'vin',
    lattol: 'ol', ipa: 'ol', halvliter: 'stor-stark', 'hard-seltzer': 'lask-zero', rtd: 'lask', sake: 'sprit', fireball: 'sprit',
    sangria: 'vin', glogg: 'vin', 'alkoholfri-glogg': 'vin', 'alkoholfritt-vin': 'vin', kir: 'bubbel', mimosa: 'bubbel', hugo: 'bubbel',
    'alkoholfritt-bubbel': 'bubbel', 'alkoholfri-cider': 'cider', mocktail: 'drink', 'espresso-tonic': 'espresso', iste: 'juice',
    mjolk: 'vatten', sportdryck: 'vatten', festis: 'juice',
  };
  function iconFor(entry) {
    const ids = entry.matched || [];
    if (ids.length === 1) {
      const id = ids[0];
      if (ICONS[id]) return ICONS[id];
      if (ALIAS[id]) return ICONS[ALIAS[id]];
    }
    if (entry.alcoholG >= 1) return ICONS.drink;
    if (entry.caffeineMg > 0) return ICONS.kaffe;
    return ICONS.vatten;
  }

  root.Icons = { ICONS, iconFor };
})(window);
