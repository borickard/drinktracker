(function () {
  const { SUBSTANCES, totals, tomorrow, fmt, clock } = window.Substances;
  const STORE_KEY = 'ikvall.entries.v1';
  const GLASS_MAX_UNIT_PX = 110; // höjd för ett ämne som precis når sin gräns
  const MIN_LAYER_PX = 44;
  const MIN_LAYER_HINT_PX = 62; // plats för tre rader etikett

  const $ = (id) => document.getElementById(id);
  let entries = load();
  let lastAdded = null;
  let toastTimer = null;

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(entries)); } catch { /* privat läge */ }
  }

  // ---------- Rendering ----------
  function render() {
    const t = totals(entries);
    const active = SUBSTANCES
      .map((s) => ({ s, load: s.load(t), level: s.level(t) }))
      .filter((x) => x.level !== 'none' && x.load > 0.005);

    const glass = $('glass');
    $('empty').hidden = active.length > 0;

    // Lagren behålls mellan renderingar så att höjden kan animeras när man fyller på.
    const keep = new Set(active.map((x) => x.s.id));
    glass.querySelectorAll('.layer').forEach((n) => { if (!keep.has(n.dataset.id)) n.remove(); });

    const h = glass.clientHeight - 8;
    const minPx = (x) => (x.level === 'ok' ? MIN_LAYER_PX : MIN_LAYER_HINT_PX);
    const sum = active.reduce((a, x) => a + Math.min(x.load, 2.5), 0);
    const unit = sum ? Math.min(GLASS_MAX_UNIT_PX, h / sum) : 0;
    let heights = active.map((x) => Math.max(minPx(x), Math.min(x.load, 2.5) * unit));
    const total = heights.reduce((a, b) => a + b, 0);
    if (total > h) heights = heights.map((v) => (v * h) / total);

    active.forEach((x, i) => {
      let el = glass.querySelector(`.layer[data-id="${x.s.id}"]`);
      const fresh = !el;
      if (fresh) {
        el = document.createElement('button');
        el.dataset.id = x.s.id;
        el.setAttribute('role', 'listitem');
        el.style.height = '0px';
        el.addEventListener('click', () => openInfo(x.s.id));
      }
      el.className = `layer layer-${x.s.id} level-${x.level}`;
      if (x.s.deficit && x.s.deficit(t)) el.classList.add('deficit');
      // Del över gränsen streckas.
      el.style.setProperty('--limit', x.load > 1 ? (100 / Math.min(x.load, 2.5)).toFixed(1) + '%' : '100%');
      const hint = x.level === 'ok' ? '' : `<span class="hint">${x.s.describe(t, entries).headline}</span>`;
      el.innerHTML = `<span class="label"><span class="name">${x.s.name}</span><span class="amount">${x.s.amount(t)}</span>${hint}</span>`;
      el.setAttribute('aria-label', `${x.s.name} ${x.s.amount(t)}. Visa mer`);
      // Håll ordningen vätska → alkohol → koffein → socker (nerifrån och upp).
      const next = glass.querySelectorAll('.layer')[i];
      if (next !== el) glass.insertBefore(el, next || null);
      if (fresh) { void el.offsetHeight; }
      el.style.height = heights[i] + 'px';
    });

    const n = entries.reduce((a, e) => a + e.count, 0);
    $('summary').textContent = n
      ? `${n} ${n === 1 ? 'dryck' : 'drycker'} sedan kl ${clock(Math.min(...entries.map((e) => e.t)))}`
      : '';
    $('tomorrow').textContent = tomorrow(t);
    $('reset').hidden = !entries.length;

    const log = $('log');
    log.innerHTML = '';
    [...entries].reverse().forEach((e) => {
      const li = document.createElement('li');
      const sub = e.raw && e.raw.toLowerCase() !== e.name.toLowerCase() ? `<span class="raw">${escapeHtml(e.raw)}</span>` : '';
      li.innerHTML = `<span class="time">${clock(e.t)}</span><span class="what">${e.count > 1 ? e.count + ' × ' : ''}${escapeHtml(e.name)}${sub}</span>
        <span class="tags">${tags(e)}</span><button class="remove" aria-label="Ta bort">×</button>`;
      li.querySelector('.remove').addEventListener('click', () => { entries = entries.filter((x) => x !== e); save(); render(); });
      log.appendChild(li);
    });
  }

  function tags(e) {
    const out = [];
    const units = (e.alcoholG * e.count) / 12;
    if (units >= 0.05) out.push(`<i class="t-alcohol"></i>${fmt(units, 1)}`);
    if (e.caffeineMg) out.push(`<i class="t-caffeine"></i>${fmt(e.caffeineMg * e.count)}`);
    if (e.sugarG >= 1) out.push(`<i class="t-sugar"></i>${fmt(e.sugarG * e.count)}`);
    return out.map((x) => `<span>${x}</span>`).join('');
  }

  const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Lägg till ----------
  function add(items) {
    const now = Date.now();
    const added = items.filter((x) => !x.unknown).map((x, i) => ({ ...x, t: now + i }));
    if (!added.length) return;
    entries.push(...added);
    lastAdded = added;
    save();
    render();
    toast(added.length === 1 ? `${added[0].name} tillagd` : `${added.length} drycker tillagda`);
  }

  function toast(text) {
    $('toast-text').textContent = text;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
  }

  $('undo').addEventListener('click', () => {
    if (lastAdded) entries = entries.filter((e) => !lastAdded.includes(e));
    lastAdded = null;
    $('toast').hidden = true;
    save();
    render();
  });

  function buildQuick() {
    const q = $('quick');
    for (const d of window.Drinks.quick) {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<span class="q-name">${d.name}</span><span class="q-size">${d.size}</span>`;
      b.addEventListener('click', () => { add([window.Drinks.fromQuick(d.id)]); closeSheets(); });
      q.appendChild(b);
    }
  }

  function updatePreview() {
    const parsed = window.Drinks.parse($('free').value);
    const ul = $('preview');
    ul.innerHTML = '';
    for (const p of parsed) {
      const li = document.createElement('li');
      if (p.unknown) {
        li.className = 'unknown';
        li.textContent = `”${p.raw}” – känner inte igen den. Välj en standarddryck nedan.`;
      } else {
        const bits = [];
        const units = (p.alcoholG * p.count) / 12;
        if (units >= 0.05) bits.push(`${fmt(units, 1)} enh`);
        if (p.caffeineMg) bits.push(`${fmt(p.caffeineMg * p.count)} mg koffein`);
        if (p.sugarG >= 1) bits.push(`${fmt(p.sugarG * p.count)} g socker`);
        if (!bits.length) bits.push(`${fmt((p.ml * p.count) / 10)} cl vätska`);
        li.innerHTML = `<strong>${p.count > 1 ? p.count + ' × ' : ''}${escapeHtml(p.name)}</strong> <span>${bits.join(' · ')}</span>`;
      }
      ul.appendChild(li);
    }
    $('free-add').disabled = !parsed.some((p) => !p.unknown);
  }

  $('free').addEventListener('input', updatePreview);
  $('free-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const parsed = window.Drinks.parse($('free').value);
    if (!parsed.some((p) => !p.unknown)) return;
    add(parsed);
    $('free').value = '';
    updatePreview();
    closeSheets();
  });

  // ---------- Ämnesinfo ----------
  function openInfo(id) {
    const s = SUBSTANCES.find((x) => x.id === id);
    const t = totals(entries);
    const d = s.describe(t, entries);
    $('info-dot').className = `dot dot-${id}`;
    $('info-title').textContent = s.name;
    $('info-amount').textContent = s.amount(t);
    $('info-headline').textContent = d.headline;
    $('info-headline').className = `info-headline level-${s.level(t)}`;
    $('info-body').innerHTML = d.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
    $('info-from').innerHTML = d.from.map((f) => `<li><span>${escapeHtml(f.name)}</span><span>${f.value}</span></li>`).join('');
    openSheet('info-sheet');
  }

  // ---------- Sheets ----------
  function openSheet(id) {
    const el = $(id);
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('open'));
  }
  function closeSheets() {
    document.querySelectorAll('.sheet.open').forEach((el) => {
      el.classList.remove('open');
      setTimeout(() => { el.hidden = true; }, 220);
    });
  }
  document.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeSheets));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheets(); });

  $('add').addEventListener('click', () => {
    openSheet('add-sheet');
    setTimeout(() => $('free').focus(), 250);
  });
  $('reset').addEventListener('click', () => {
    if (!confirm('Börja en ny kväll? Dagens drycker rensas.')) return;
    entries = [];
    save();
    render();
  });

  window.addEventListener('resize', render);
  buildQuick();
  render();
})();
