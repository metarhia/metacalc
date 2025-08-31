'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { Sheet } = require('..');

test('Simple expressions', async () => {
  const sheet = new Sheet();
  sheet.cells['A1'] = 100;
  sheet.cells['B1'] = 2;
  sheet.cells['C1'] = '=A1*B1';
  sheet.cells['D1'] = '=(A1 / B1) - 5';
  sheet.cells['E1'] = '=-A1';
  assert.strictEqual(sheet.values['C1'], 200);
  assert.strictEqual(sheet.values['D1'], 45);
  assert.strictEqual(sheet.values['E1'], -100);
});

test('Expression chain', async () => {
  const sheet = new Sheet();
  sheet.cells['A1'] = 100;
  sheet.cells['B1'] = 2;
  sheet.cells['C1'] = '=A1*B1';
  sheet.cells['D1'] = '=C1+8';
  sheet.cells['E1'] = '=D1/2';
  assert.strictEqual(sheet.values['D1'], 208);
  assert.strictEqual(sheet.values['E1'], 104);
});

test('JavaScript Math', async () => {
  const sheet = new Sheet();
  sheet.cells['A1'] = 100;
  sheet.cells['B1'] = -2;
  sheet.cells['C1'] = '=Math.abs(B1)';
  sheet.cells['D1'] = '=Math.exp(A1)';
  sheet.cells['E1'] = '=Math.max(A1, B1)';
  sheet.cells['F1'] = '=Math.pow(A1, 2)';
  sheet.cells['G1'] = '=Math.sin(A1)';
  sheet.cells['H1'] = '=Math.sqrt(A1)';
  sheet.cells['I1'] = '=Math.sin(Math.sqrt(Math.pow(A1, B1)))';
  sheet.cells['J1'] = '=Math.PI * Math.E * Math.LN2 * Math.LN10';
  assert.strictEqual(sheet.values['C1'], 2);
  assert.strictEqual(sheet.values['D1'], Math.exp(100));
  assert.strictEqual(sheet.values['E1'], 100);
  assert.strictEqual(sheet.values['F1'], 10000);
  assert.strictEqual(sheet.values['G1'], Math.sin(100));
  assert.strictEqual(sheet.values['H1'], Math.sqrt(100));
  assert.strictEqual(
    sheet.values['I1'],
    Math.sin(Math.sqrt(Math.pow(100, -2))),
  );
  assert.strictEqual(
    sheet.values['J1'],
    Math.PI * Math.E * Math.LN2 * Math.LN10,
  );
});

test('Correct cell values', async () => {
  const sheet = new Sheet();
  sheet.cells['A1'] = 20;

  sheet.cells['B1'] = 100;
  assert.strictEqual(sheet.values['B1'], 100, 'Correct simple value');

  sheet.cells['B1'] = '=Math.pow(A1, 2)';
  assert.strictEqual(sheet.values['B1'], Math.pow(20, 2));

  sheet.cells['B1'] = 30;
  assert.strictEqual(sheet.values['B1'], 30);

  sheet.cells['B1'] = 'value';
  assert.strictEqual(sheet.values['B1'], 'value');

  sheet.cells['B1'] = '=(7 / 2).toFixed(2)';
  assert.strictEqual(sheet.values['B1'], '3.50');

  sheet.cells['B1'] = '=+(10 / 3).toFixed(4)';
  assert.strictEqual(sheet.values['B1'], 3.3333);

  sheet.cells['B1'] = '=+(Math.PI).toFixed(2)';
  assert.strictEqual(sheet.values['B1'], 3.14);
});

test('Prevent arbitrary js code execution', async () => {
  const sheet = new Sheet();

  sheet.cells['A1'] =
    '=Math.constructor.constructor("console.log(\\"Hello, World!\\")")();';
  try {
    sheet.values['A1'];
    assert.fail('Should have thrown an error');
  } catch (error) {
    assert.strictEqual(error.constructor.name === 'TypeError', true);
  }

  sheet.cells['A1'] =
    '=this.data.constructor.constructor("console.log(\\"Hello, World!\\")")();';
  try {
    sheet.values['A1'];
    assert.fail('Should have thrown an error');
  } catch (error) {
    assert.strictEqual(error.constructor.name === 'TypeError', true);
  }

  sheet.cells['A1'] =
    '=this.constructor.constructor("console.log(\\"Hello, World!\\")")();';
  try {
    sheet.values['A1'];
    assert.fail('Should have thrown an error');
  } catch (error) {
    assert.strictEqual(error.constructor.name === 'TypeError', true);
  }

  sheet.cells['A1'] = `=Reflect.get(this, "constructor")
    .constructor("console.log(\\"Hello, World!\\")")();`;
  try {
    sheet.values['A1'];
    assert.fail('Should have thrown an error');
  } catch (error) {
    assert.strictEqual(error.constructor.name === 'TypeError', true);
  }

  sheet.cells['A1'] =
    '=Object.constructor.constructor("console.log(\\"Hello, World!\\")")();';
  try {
    sheet.values['A1'];
    assert.fail('Should have thrown an error');
  } catch (error) {
    assert.strictEqual(error.constructor.name === 'TypeError', true);
  }

  sheet.cells['A1'] =
    '=({}).constructor.constructor("console.log(\\"Hello, World!\\")")();';
  try {
    sheet.values['A1'];
    assert.fail('Should have thrown an error');
  } catch (error) {
    assert.strictEqual(error.constructor.name === 'EvalError', true);
  }

  sheet.cells['A1'] =
    '=Math.ceil.constructor("console.log(\\"Hello, World!\\")")();';
  try {
    sheet.values['A1'];
    assert.fail('Should have thrown an error');
  } catch (error) {
    assert.strictEqual(error.constructor.name === 'TypeError', true);
  }
});

test('Should emit identifier hook', () => {
  const sheet = new Sheet();
  let hookCallCount = 0;

  sheet.on('identifier', (prop, sht) => {
    hookCallCount++;
    assert.strictEqual(sht, sheet);
    assert.strictEqual(prop, 'C1');
    return 3;
  });

  sheet.cells['A1'] = 100;
  sheet.cells['B1'] = -2;
  sheet.cells['D1'] = '= A1 + B1 + C1';
  assert.strictEqual(sheet.values['D1'], 101);
  assert.strictEqual(hookCallCount, 1);
});

test('Multiple identifier hooks must handle first non undefined value', () => {
  const sheet = new Sheet();
  let firstHookCalls = 0;
  let secondHookCalls = 0;

  // eslint-disable-next-line consistent-return
  sheet.on('identifier', (prop) => {
    firstHookCalls++;
    if (prop === 'A0') return 1;
  });

  // eslint-disable-next-line consistent-return
  sheet.on('identifier', (prop) => {
    secondHookCalls++;
    if (prop === 'A1') return 2;
  });

  assert.strictEqual(sheet.values['A0'], 1, 'Value from first subscription');
  assert.strictEqual(sheet.values['A1'], 2, 'Value from second subscription');
  assert.strictEqual(
    sheet.values['A2'],
    undefined,
    'Not handled value equals undefined',
  );

  assert.strictEqual(firstHookCalls, 3);
  assert.strictEqual(secondHookCalls, 2);
});

test('Keeping expression sources', async () => {
  const sheet = new Sheet();
  sheet.cells['A1'] = 100;
  sheet.cells['B1'] = -2;
  sheet.cells['C1'] = '=(A1 / B1) - 5';
  sheet.cells['D1'] = '=Math.exp(A1)';
  sheet.cells['E1'] = '=Math.sin(Math.sqrt(Math.pow(A1, B1)))';

  assert.strictEqual(
    sheet.cells['C1'].source,
    '=(A1 / B1) - 5',
    'Correct expression source',
  );
  assert.strictEqual(
    sheet.cells['D1'].source,
    '=Math.exp(A1)',
    'Correct expression source',
  );
  assert.strictEqual(
    sheet.cells['E1'].source,
    '=Math.sin(Math.sqrt(Math.pow(A1, B1)))',
    'Correct expression source',
  );
});
