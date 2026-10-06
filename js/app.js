(function () {
  const { SUBSTANCES, totals, tomorrow, fact, fmt, clock } = window.Substances;
  const STORE_KEY = 'ikvall.entries.v1';
  const PROFILE_KEY = 'ikvall.profile.v1';
  const GLASS_MAX_UNIT_PX = 110; // höjd för ett ämne som precis når sin gräns
  const MIN_LAYER_PX = 44;
  const MIN_LAYER_HINT_PX = 62; // plats för tre rader etikett
  const MIN_LAYER_WRAP_PX = 80; // vattnets status kan bli två rader

  const $ = (id) => document.getElementById(id);
  let entries = load();
  let profile = loadProfile();
  let lastAdded = null;
  let toastTimer = null;

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; }
  }
  function loadProfile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null; } catch { return null; }
  }
  function saveProfile() {
    try {
      if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      else localStorage.removeItem(PROFILE_KEY);
    } catch { /* privat läge */ }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(entries)); } catch { /* privat läge */ }
  }

  // ---------- Effekter i lagren ----------
  // Bubblor i alkoholen, kondens på vattnet, ånga från koffeinet och gnistrande socker.
  function seeded(seed) {
    let x = seed;
    return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  }
  function fxFor(id) {
    const r = seeded(id.length * 97 + id.charCodeAt(0));
    const pct = (a, b) => (a + r() * (b - a)).toFixed(1) + '%';
    const sec = (a, b) => (a + r() * (b - a)).toFixed(2) + 's';
    const px = (a, b) => (a + r() * (b - a)).toFixed(1) + 'px';
    let inner = '';
    let over = '';
    if (id === 'alcohol') {
      for (let i = 0; i < 10; i++) inner += `<i class="fx-bubble" style="--x:${pct(6, 90)};--s:${px(3, 8)};--dur:${sec(2.6, 4.8)};--t:-${sec(0, 4.8)}"></i>`;
      inner += '<i class="fx-foam"></i>';
    } else if (id === 'water') {
      for (let i = 0; i < 14; i++) inner += `<i class="fx-mist" style="--x:${pct(4, 94)};--y:${pct(8, 88)};--s:${px(1.5, 3.5)}"></i>`;
      for (let i = 0; i < 6; i++) inner += `<i class="fx-drop" style="--x:${pct(8, 88)};--y:${pct(6, 50)};--s:${px(5, 8)}"></i>`;
      for (let i = 0; i < 3; i++) inner += `<i class="fx-drop run" style="--x:${pct(12, 84)};--y:${pct(4, 30)};--s:${px(6, 9)};--dur:${sec(5, 8)};--t:-${sec(0, 8)}"></i>`;
    } else if (id === 'caffeine') {
      for (let i = 0; i < 4; i++) over += `<i class="fx-steam" style="--x:${pct(14, 70)};--dur:${sec(3.6, 5.2)};--t:-${sec(0, 5)}"></i>`;
      inner += '<i class="fx-crema"></i>';
    } else if (id === 'sugar') {
      for (let i = 0; i < 9; i++) inner += `<i class="fx-spark" style="--x:${pct(6, 90)};--y:${pct(10, 85)};--s:${px(5, 10)};--dur:${sec(1.8, 3.2)};--t:-${sec(0, 3)}"></i>`;
      for (let i = 0; i < 8; i++) inner += `<i class="fx-grain" style="--x:${pct(5, 95)};--s:${px(2, 3.5)};--dur:${sec(3.5, 6)};--t:-${sec(0, 6)}"></i>`;
    }
    return `<span class="fx" aria-hidden="true">${inner}</span>${over ? `<span class="fx-over" aria-hidden="true">${over}</span>` : ''}`;
  }

  // ---------- Rendering ----------
  function render() {
    const t = totals(entries, profile);
    const active = SUBSTANCES
      .map((s) => ({ s, load: s.load(t), level: s.level(t) }))
      .filter((x) => x.level !== 'none' && x.load > 0.005);

    const glass = $('glass');
    // Startvyn visas tills första drycken är tillagd.
    document.body.classList.toggle('is-empty', entries.length === 0);

    // Lagren behålls mellan renderingar så att höjden kan animeras när man fyller på.
    const keep = new Set(active.map((x) => x.s.id));
    glass.querySelectorAll('.layer').forEach((n) => { if (!keep.has(n.dataset.id)) n.remove(); });

    const h = glass.clientHeight - 8;
    const minPx = (x) => (x.level === 'ok' ? MIN_LAYER_PX : x.s.id === 'water' ? MIN_LAYER_WRAP_PX : MIN_LAYER_HINT_PX);
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
        el.innerHTML = `${fxFor(x.s.id)}<span class="label"></span>`;
        el.addEventListener('click', () => openInfo(x.s.id));
      }
      el.className = `layer layer-${x.s.id} level-${x.level}`;
      // Vatten: den del som saknas för att varva visas som kontur.
      const fill = x.s.fill ? x.s.fill(t) : 1;
      if (fill < 1) {
        el.classList.add('partial');
        el.style.setProperty('--fill', (fill * 100).toFixed(1) + '%');
      }
      // Del över gränsen streckas.
      el.style.setProperty('--limit', x.load > 1 ? (100 / Math.min(x.load, 2.5)).toFixed(1) + '%' : '100%');
      const d = x.level === 'ok' ? null : x.s.describe(t, entries);
      const hint = d ? `<span class="hint">${d.short || d.headline}</span>` : '';
      const sub = x.s.sub ? x.s.sub(t) : '';
      el.querySelector('.label').innerHTML = `<span class="name">${x.s.name}${sub ? ` · ${sub}` : ''}</span><span class="amount">${x.s.amount(t)}</span>${hint}`;
      el.setAttribute('aria-label', `${x.s.name} ${x.s.amount(t)}. Visa mer`);
      // Håll ordningen vätska → alkohol → koffein → socker (nerifrån och upp).
      const next = glass.querySelectorAll('.layer')[i];
      if (next !== el) glass.insertBefore(el, next || null);
      if (fresh) { void el.offsetHeight; }
      el.style.height = heights[i] + 'px';
      // Liten studs när mängden ändras.
      const amount = x.s.amount(t);
      if (!fresh && el.dataset.amount !== amount) bump(el);
      el.dataset.amount = amount;
    });

    const n = entries.reduce((a, e) => a + e.count, 0);
    $('summary').textContent = n
      ? `${n} ${n === 1 ? 'dryck' : 'drycker'} sedan kl ${clock(Math.min(...entries.map((e) => e.t)))}`
      : '';
    $('tomorrow').textContent = tomorrow(t);
    const f = fact(t, entries);
    $('fact').hidden = !f;
    $('fact-text').textContent = f;
    $('reset').hidden = !entries.length;

    const log = $('log');
    log.innerHTML = '';
    [...entries].reverse().forEach((e) => {
      const li = document.createElement('li');
      const sub = e.raw && e.raw.toLowerCase() !== e.name.toLowerCase() ? `<span class="raw">${escapeHtml(e.raw)}</span>` : '';
      li.innerHTML = `<span class="time">${clock(e.t)}</span>${window.Icons.iconFor(e)}<span class="what">${e.count > 1 ? e.count + ' × ' : ''}${escapeHtml(e.name)}${sub}</span>
        <span class="tags">${tags(e)}</span><button class="remove" aria-label="Ta bort">×</button>`;
      li.querySelector('.remove').addEventListener('click', () => { entries = entries.filter((x) => x !== e); save(); render(); });
      log.appendChild(li);
    });
  }

  function tags(e) {
    const out = [];
    const units = (e.alcoholG * e.count) / 12;
    if (units >= 0.2) out.push(`<i class="t-alcohol"></i>${fmt(units, 1)}`);
    if (e.caffeineMg) out.push(`<i class="t-caffeine"></i>${fmt(e.caffeineMg * e.count)}`);
    if (e.sugarG >= 1) out.push(`<i class="t-sugar"></i>${fmt(e.sugarG * e.count)}`);
    return out.map((x) => `<span>${x}</span>`).join('');
  }

  const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function bump(el) {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  // Dryckessymbolen "faller" ned i glaset.
  function drop(entry) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const glass = $('glass');
    const r = glass.getBoundingClientRect();
    if (!r.width) return;
    const el = document.createElement('div');
    el.className = 'drop';
    el.innerHTML = window.Icons.iconFor(entry);
    el.style.left = r.left + r.width / 2 - 20 + 'px';
    el.style.top = r.top + 6 + 'px';
    document.body.appendChild(el);
    // Landa på ytan av det översta lagret (lagren växer fortfarande – mät efter höjdövergången).
    const layers = glass.querySelectorAll('.layer');
    const heights = [...layers].reduce((sum, l) => sum + parseFloat(l.style.height || 0) + 2, 0);
    const target = Math.max(20, r.height - heights - 46);
    el.animate([
      { transform: 'translateY(-10px) scale(.6) rotate(-12deg)', opacity: 0 },
      { transform: 'translateY(6px) scale(1.05) rotate(0deg)', opacity: 1, offset: 0.2 },
      { transform: `translateY(${target}px) scale(.85) rotate(6deg)`, opacity: 1, offset: 0.85 },
      { transform: `translateY(${target + 14}px) scale(.4)`, opacity: 0 },
    ], { duration: 800, easing: 'cubic-bezier(.45,0,.7,.3)' }).onfinish = () => el.remove();
  }

  // ---------- Lägg till ----------
  function add(items) {
    const now = Date.now();
    const added = items.filter((x) => !x.unknown).map((x, i) => ({ ...x, t: now + i }));
    if (!added.length) return;
    entries.push(...added);
    lastAdded = added;
    save();
    render();
    setTimeout(() => added.slice(0, 3).forEach((e, i) => setTimeout(() => drop(e), i * 140)), 120);
    toast(added.length === 1 ? `${added[0].name} tillagd` : `${added.length} drycker tillagda`, true);
  }

  function toast(text, undoable = false) {
    $('toast-text').textContent = text;
    $('undo').hidden = !undoable;
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
    window.Drinks.quick.forEach((d, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.style.setProperty('--i', i);
      b.innerHTML = `${window.Icons.ICONS[d.id] || ''}<span class="q-name">${d.name}</span><span class="q-size">${d.size}</span>`;
      b.addEventListener('click', () => { closeSheets(); add([window.Drinks.fromQuick(d.id)]); });
      q.appendChild(b);
    });
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
        if (units >= 0.2) bits.push(`${fmt(units, 1)} standardglas`);
        if (p.caffeineMg) bits.push(`${fmt(p.caffeineMg * p.count)} mg koffein`);
        if (p.sugarG >= 1) bits.push(`${fmt(p.sugarG * p.count)} g socker`);
        if (!bits.length) bits.push(`${fmt((p.ml * p.count) / 10)} cl vätska`);
        li.innerHTML = `${window.Icons.iconFor(p)}<strong>${p.count > 1 ? p.count + ' × ' : ''}${escapeHtml(p.name)}</strong> <span>${bits.join(' · ')}</span>`;
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
    const t = totals(entries, profile);
    const d = s.describe(t, entries);
    $('info-dot').className = `dot dot-${id}`;
    $('info-title').textContent = s.name;
    $('info-amount').textContent = s.amount(t);
    $('info-headline').textContent = d.headline;
    $('info-headline').className = `info-headline level-${s.level(t)}`;
    $('info-body').innerHTML = d.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
    $('info-tips').hidden = !(d.tips && d.tips.length);
    $('info-tips-list').innerHTML = (d.tips || []).map((x) => `<li>${escapeHtml(x)}</li>`).join('');
    $('info-more').hidden = id !== 'alcohol';
    $('info-guidance').hidden = !d.guidance;
    $('info-from').innerHTML = d.from.map((f) => `<li><span>${escapeHtml(f.name)}</span><span>${f.value}</span></li>`).join('');
    openSheet('info-sheet');
  }

  // ---------- Sheets ----------
  function openSheet(id) {
    const el = $(id);
    el.hidden = false;
    el.querySelector('.sheet-panel').scrollTop = 0;
    document.body.classList.add('sheet-open');
    $('toast').hidden = true;
    requestAnimationFrame(() => el.classList.add('open'));
  }
  function closeSheets() {
    document.body.classList.remove('sheet-open');
    document.querySelectorAll('.sheet.open').forEach((el) => {
      el.classList.remove('open');
      const panel = el.querySelector('.sheet-panel');
      panel.classList.remove('dragging');
      panel.style.transform = '';
      setTimeout(() => { el.hidden = true; }, 220);
    });
  }

  // Svep nedåt för att stänga – från huvudet, eller var som helst när panelen är scrollad högst upp.
  document.querySelectorAll('.sheet-panel').forEach((panel) => {
    let startY = null;
    let dy = 0;
    let fromBar = false;
    const start = (y, target) => {
      fromBar = !!target.closest('.sheet-bar') && !target.closest('.sheet-close');
      if (!fromBar && panel.scrollTop > 0) return;
      startY = y;
      dy = 0;
    };
    const move = (y, ev) => {
      if (startY == null) return;
      dy = y - startY;
      if (dy <= 0) { if (!fromBar) startY = null; panel.style.transform = ''; return; }
      if (ev.cancelable) ev.preventDefault();
      panel.classList.add('dragging');
      panel.style.transform = `translateY(${dy}px)`;
    };
    const end = () => {
      if (startY == null) return;
      startY = null;
      panel.classList.remove('dragging');
      if (dy > 90) closeSheets();
      else panel.style.transform = '';
    };
    panel.addEventListener('touchstart', (e) => start(e.touches[0].clientY, e.target), { passive: true });
    panel.addEventListener('touchmove', (e) => move(e.touches[0].clientY, e), { passive: false });
    panel.addEventListener('touchend', end);
    panel.addEventListener('touchcancel', end);
    // Mus: dra i huvudet
    const bar = panel.querySelector('.sheet-bar');
    bar.addEventListener('mousedown', (e) => {
      start(e.clientY, e.target);
      const mm = (ev) => move(ev.clientY, ev);
      const mu = () => { end(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
      window.addEventListener('mousemove', mm);
      window.addEventListener('mouseup', mu);
    });
  });
  document.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeSheets));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheets(); });

  function openAdd() {
    openSheet('add-sheet');
    // Tangentbordet på mobil täcker snabbvalen – fokusera bara på större skärmar.
    if (window.matchMedia('(min-width: 700px)').matches) setTimeout(() => $('free').focus(), 250);
  }
  $('add').addEventListener('click', openAdd);
  $('cta').addEventListener('click', openAdd);
  $('welcome-profile').addEventListener('click', () => openProfile());

  // Snabbstart på startsidan: en tryckning lägger till direkt.
  for (const id of ['vatten', 'alkoholfri-ol', 'ol', 'vin', 'cola-zero', 'kaffe']) {
    const d = window.Drinks.DRINKS.find((x) => x.id === id);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.innerHTML = `${window.Icons.ICONS[id] || ''}<span>${d.name}</span><small>${d.size.split(' · ')[0]}</small>`;
    b.addEventListener('click', () => add([window.Drinks.fromQuick(id)]));
    $('starter').appendChild(b);
  }
  // ---------- Profil ----------
  function openProfile() {
    const f = $('profile-form');
    f.weight.value = profile && profile.weight ? profile.weight : '';
    f.height.value = profile && profile.height ? profile.height : '';
    f.querySelectorAll('input[name=sex]').forEach((r) => { r.checked = (profile && profile.sex ? profile.sex : '') === r.value; });
    $('profile-clear').hidden = !profile;
    openSheet('profile-sheet');
  }
  const num = (v, min, max) => { const n = parseFloat(String(v).replace(',', '.')); return n >= min && n <= max ? n : null; };
  $('profile').addEventListener('click', openProfile);
  $('profile-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const sex = (f.querySelector('input[name=sex]:checked') || {}).value || null;
    const next = { weight: num(f.weight.value, 30, 250), height: num(f.height.value, 120, 230), sex };
    profile = next.weight || next.height || next.sex ? next : null;
    saveProfile();
    render();
    closeSheets();
    toast(profile ? 'Profilen sparad' : 'Profilen rensad');
  });
  $('profile-clear').addEventListener('click', () => {
    profile = null;
    saveProfile();
    render();
    closeSheets();
    toast('Profilen rensad');
  });

  $('reset').addEventListener('click', () => {
    if (!confirm('Börja en ny kväll? Dagens drycker rensas.')) return;
    entries = [];
    save();
    render();
  });

  // Samma effekter i demoglaset på startsidan.
  for (const [cls, id] of [['d-water', 'water'], ['d-alcohol', 'alcohol'], ['d-caffeine', 'caffeine'], ['d-sugar', 'sugar']]) {
    const layer = document.querySelector(`.demo-layer.${cls}`);
    if (layer) layer.innerHTML = fxFor(id);
  }

  // Promillen sjunker med tiden – uppdatera varje minut.
  setInterval(render, 60e3);
  window.addEventListener('resize', render);
  buildQuick();
  render();
})();
