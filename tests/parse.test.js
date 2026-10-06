const test = require('node:test');
const assert = require('node:assert');
const Drinks = require('../js/drinks.js');
const S = require('../js/substances.js');

const names = (text) => Drinks.parse(text).map((x) => [x.name, x.count]);

test('tolkar exemplet från idén', () => {
  assert.deepStrictEqual(names('en öl, en espresso martini, en cola zero och två glas ramlösa'),
    [['Öl', 1], ['Espresso Martini', 1], ['Läsk zero', 1], ['Vatten', 2]]);
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

test('en öl räknas inte som vätska', () => {
  const now = Date.now();
  const water = S.SUBSTANCES.find((s) => s.id === 'water');
  const beer = S.totals(Drinks.parse('en öl').map((x) => ({ ...x, t: now })));
  assert.ok(beer.netFluidMl < 0);
  assert.notStrictEqual(water.describe(beer, []).headline, 'Bra vätskebalans');
  const withWater = S.totals(Drinks.parse('en öl och ett glas vatten').map((x) => ({ ...x, t: now })));
  assert.strictEqual(water.level(withWater), 'good');
});
