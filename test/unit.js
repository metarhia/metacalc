'use strict';

const metatests = require('metatests');
const { Sheet } = require('..');

metatests.test('Simple expressions', async (test) => {
  const sheet = new Sheet();
  sheet.cells['A1'] = 100;
  sheet.cells['B1'] = 2;
  sheet.cells['C1'] = '=A1*B1';
  sheet.cells['D1'] = '=(A1 / B1) - 5';
  sheet.cells['E1'] = '=-A1';
  test.strictSame(sheet.values['C1'], 200);
  test.strictSame(sheet.values['D1'], 45);
  test.strictSame(sheet.values['E1'], -100);
  test.end();
});

metatests.test('Expression chain', async (test) => {
  const sheet = new Sheet();
  sheet.cells['A1'] = 100;
  sheet.cells['B1'] = 2;
  sheet.cells['C1'] = '=A1*B1';
  sheet.cells['D1'] = '=C1+8';
  sheet.cells['E1'] = '=D1/2';
  test.strictSame(sheet.values['D1'], 208);
  test.strictSame(sheet.values['E1'], 104);
  test.end();
});

metatests.test('JavaScript Math', async (test) => {
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
  test.strictSame(sheet.values['C1'], 2);
  test.strictSame(sheet.values['D1'], Math.exp(100));
  test.strictSame(sheet.values['E1'], 100);
  test.strictSame(sheet.values['F1'], 10000);
  test.strictSame(sheet.values['G1'], Math.sin(100));
  test.strictSame(sheet.values['H1'], Math.sqrt(100));
  test.strictSame(sheet.values['I1'], Math.sin(Math.sqrt(Math.pow(100, -2))));
  test.strictSame(sheet.values['J1'], Math.PI * Math.E * Math.LN2 * Math.LN10);
  test.end();
});

metatests.test('Non-table identifiers', async (test) => {
  const sheet = new Sheet();
  sheet.cells['item1.price'] = 100;
  sheet.cells['item2.price'] = 200;
  sheet.cells['item3.price'] = 300;
  sheet.cells['total'] = '=item1.price + item2.price + item3.price';
  test.strictSame(sheet.values['total'], 600);
  test.end();
});

metatests.test('Prevent arbitrary js code execution', async (test) => {
  const sheet = new Sheet();

  sheet.cells['A1'] =
    '=Math.constructor.constructor("console.log(\\"Hello, World!\\")")();';
  try {
    sheet.values['A1'];
    test.fail();
  } catch (error) {
    test.strictSame(error.constructor.name === 'TypeError', true);
  }

  sheet.cells['A1'] =
    '=this.data.constructor.constructor("console.log(\\"Hello, World!\\")")();';
  try {
    sheet.values['A1'];
    test.fail();
  } catch (error) {
    test.strictSame(error.constructor.name === 'TypeError', true);
  }

  sheet.cells['A1'] =
    '=this.constructor.constructor("console.log(\\"Hello, World!\\")")();';
  try {
    sheet.values['A1'];
    test.fail();
  } catch (error) {
    test.strictSame(error.constructor.name === 'TypeError', true);
  }

  sheet.cells['A1'] = `=Reflect.get(this, "constructor")
    .constructor("console.log(\\"Hello, World!\\")")();`;
  try {
    sheet.values['A1'];
    test.fail();
  } catch (error) {
    test.strictSame(error.constructor.name === 'TypeError', true);
  }

  sheet.cells['A1'] =
    '=Object.constructor.constructor("console.log(\\"Hello, World!\\")")();';
  try {
    sheet.values['A1'];
    test.fail();
  } catch (error) {
    test.strictSame(error.constructor.name === 'TypeError', true);
  }

  sheet.cells['A1'] =
    '=({}).constructor.constructor("console.log(\\"Hello, World!\\")")();';
  try {
    sheet.values['A1'];
    test.fail();
  } catch (error) {
    test.strictSame(error.constructor.name === 'EvalError', true);
  }

  sheet.cells['A1'] =
    '=Math.ceil.constructor("console.log(\\"Hello, World!\\")")();';
  try {
    sheet.values['A1'];
    test.fail();
  } catch (error) {
    test.strictSame(error.constructor.name === 'TypeError', true);
  }

  test.end();
});
