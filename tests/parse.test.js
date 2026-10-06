const test = require('node:test');
const assert = require('node:assert');
const Drinks = require('../js/drinks.js');
const S = require('../js/substances.js');

const names = (text) => Drinks.parse(text).map((x) => [x.name, x.count]);

test('tolkar exemplet från idén', () => {
  assert.deepStrictEqual(names('en öl, en espresso martini, en cola zero och två glas ramlösa'),
    [['Öl', 1], ['Espresso Martini', 1], ['Cola zero', 1], ['Vatten', 2]]);
});

test('längsta namnet vinner', () => {
  assert.deepStrictEqual(names('espresso'), [['Espresso', 1]]);
  assert.deepStrictEqual(names('pepsi max'), [['Pepsi Max', 1]]);
});

test('drinknamn med "och" delas inte upp', () => {
  assert.deepStrictEqual(names('gin och tonic och en öl'), [['Gin & tonic', 1], ['Öl', 1]]);
});

test('volym, procent och flaska', () => {
  assert.strictEqual(Drinks.parse('öl 50cl')[0].ml, 500);
  assert.strictEqual(Drinks.parse('flaska vin')[0].ml, 750);
  assert.ok(Math.abs(Drinks.parse('cider 4%')[0].alcoholG - 330 * 0.04 * 0.789) < 0.01);
});

test('ihopsatt drink summerar ingredienser', () => {
  const [d] = Drinks.parse('vodka sprite');
  assert.ok(d.alcoholG > 12 && d.sugarG > 20);
});

test('läsk med och utan koffein', () => {
  const caf = (q) => Drinks.parse(q)[0].caffeineMg;
  assert.ok(caf('cola') > 0);
  assert.ok(caf('cola zero') > 0);
  assert.ok(caf('pepsi max') > 0);
  assert.strictEqual(caf('fanta'), 0);
  assert.strictEqual(caf('sprite zero'), 0);
  assert.strictEqual(caf('läsk'), 0);
});

test('okänd dryck markeras', () => {
  assert.ok(Drinks.parse('något konstigt')[0].unknown);
});

test('nivåer', () => {
  const now = Date.now();
  const t = S.totals(Drinks.parse('3 stor stark, 2 espresso martini, red bull').map((x) => ({ ...x, t: now })));
  const lvl = Object.fromEntries(S.SUBSTANCES.map((s) => [s.id, s.level(t)]));
  assert.strictEqual(lvl.alcohol, 'over');
  assert.strictEqual(lvl.caffeine, 'over');
});

test('en öl räknas inte som vätska – varva med vatten', () => {
  const now = Date.now();
  const water = S.SUBSTANCES.find((s) => s.id === 'water');
  const tot = (q, profile) => S.totals(Drinks.parse(q).map((x) => ({ ...x, t: now })), profile);
  assert.strictEqual(water.level(tot('en öl')), 'notice');
  assert.strictEqual(water.level(tot('en öl och ett glas vatten')), 'good');
  assert.strictEqual(water.level(tot('2 vin och en cola zero')), 'notice');
  // Mycket alkohol: vattnet är bra, men prognosen blir ändå sämre.
  const heavy = tot('6 öl och 6 glas vatten');
  assert.strictEqual(water.level(heavy), 'good');
  assert.match(S.tomorrow(heavy), /inte fullt ut/);
});

test('varannan vatten räknas i glas', () => {
  const now = Date.now();
  const water = S.SUBSTANCES.find((s) => s.id === 'water');
  const tot = (q) => S.totals(Drinks.parse(q).map((x) => ({ ...x, t: now })));
  const head = (q) => { const t = tot(q); return water.describe(t, []).headline; };
  assert.strictEqual(tot('en öl och en cola zero').waterGlasses, 1);
  assert.strictEqual(head('en öl och en cola zero'), 'Varannan vatten ✅');
  assert.strictEqual(head('en öl och en alkoholfri öl'), 'Varannan vatten ✅');
  assert.strictEqual(head('2 öl och 3 glas vatten'), 'Bra! Du dricker tillräckligt med vatten');
  assert.strictEqual(head('3 öl och ett glas vatten'), 'Drick 2 glas till för mer balans');
  assert.strictEqual(head('2 öl och ett glas vatten'), 'Drick ett glas till för mer balans');
  assert.strictEqual(water.amount(tot('2 öl och 3 glas vatten')), '3 glas');
  // Alkoholfri öl räknas inte som alkohol
  assert.strictEqual(tot('alkoholfri öl').alcoholG, 0);
});

test('alkoholnivåer trappas upp efter 3 standardglas', () => {
  const now = Date.now();
  const alcohol = S.SUBSTANCES.find((s) => s.id === 'alcohol');
  const head = (q) => { const e = Drinks.parse(q).map((x) => ({ ...x, t: now })); const t = S.totals(e); return [alcohol.level(t), alcohol.describe(t, e).headline]; };
  assert.deepStrictEqual(head('2 sprit'), ['notice', 'Påverkar sömnen']);
  assert.deepStrictEqual(head('3 sprit'), ['notice', 'Påverkar sömnen']);
  assert.deepStrictEqual(head('4 sprit'), ['over', 'Mer än 3 standardglas innebär en risk']);
  assert.deepStrictEqual(head('5 sprit'), ['over', 'Risken för skador ökar']);
  assert.deepStrictEqual(head('7 sprit'), ['over', 'Risk för minnesluckor och förgiftning']);
});

test('kaffe räknas inte som vatten', () => {
  const now = Date.now();
  const tot = (q) => S.totals(Drinks.parse(q).map((x) => ({ ...x, t: now })));
  assert.strictEqual(tot('två kaffe och en espresso').softMl, 0);
  assert.ok(tot('två kaffe och en espresso').caffeineMg > 200);
  assert.strictEqual(S.SUBSTANCES.find((s) => s.id === 'water').level(tot('en öl och en kaffe')), 'notice');
  assert.ok(tot('ett te').softMl > 0);
});

test('tid när koffeinet inte längre påverkar sömnen', () => {
  const now = Date.now();
  const e = Drinks.parse('2 kaffe').map((x) => ({ ...x, t: now })); // 200 mg
  const t = S.totals(e);
  // 200 → 50 mg = två halveringstider ≈ 10 h; under 10 mg ≈ 21–22 h
  const h = (at) => (at - now) / 3600e3;
  assert.ok(Math.abs(h(t.caffeineSleepOkAt) - 10) < 0.2);
  assert.ok(h(t.caffeineGoneAt) > 21 && h(t.caffeineGoneAt) < 22.5);
  assert.ok(S.caffeineAt(e, t.caffeineSleepOkAt) < 50);
});

test('profilen påverkar promille men inte gränsen', () => {
  const now = Date.now();
  const e = Drinks.parse('3 öl').map((x) => ({ ...x, t: now }));
  const small = S.totals(e, { weight: 55, height: 160, sex: 'kvinna' });
  const big = S.totals(e, { weight: 95, height: 190, sex: 'man' });
  assert.ok(small.bac > big.bac * 1.5);
  const alcohol = S.SUBSTANCES.find((s) => s.id === 'alcohol');
  assert.strictEqual(alcohol.level(small), alcohol.level(big));
});
