'use strict';

const metatests = require('metatests');
const { Sheet } = require('..');

metatests.test('Sheet tests stub', async (test) => {
  const sheet = new Sheet();
  sheet.cells['A1'] = 100;
  sheet.cells['B1'] = 2;
  sheet.cells['C1'] = '=A1*B1';
  test.strictSame(sheet.values['C1'], 200);
  test.end();
});
