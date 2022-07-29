'use strict';

const metavm = require('metavm');

const LIMIT_STEPS = 100;

const wrap = (target) =>
  new Proxy(target, {
    get: (target, prop) => {
      if (prop === 'constructor') return null;
      const value = target[prop];
      if (typeof value === 'number') return value;
      return wrap(value);
    },
  });

const math = wrap(Math);

const getValue = (target, prop) => {
  if (prop === 'Math') return math;
  const { expressions, data, callChain } = target;
  const propAmountSteps = Number(callChain.get(prop) ?? 0);
  if (propAmountSteps > LIMIT_STEPS) {
    throw new Error('Recursive expression error');
  }
  if (!expressions.has(prop)) return data.get(prop);
  const expression = expressions.get(prop);
  let value = null;
  try {
    callChain.set(prop, propAmountSteps + 1);
    value = expression();
    if (value) callChain.set(prop, 0);
  } catch (err) {
    if (err.message === 'Maximum call stack size exceeded') {
      throw new Error('Recursive expression error');
    }
    throw err;
  }
  return value;
};

const getCell = (target, prop) => {
  const { expressions, data } = target;
  const collection = expressions.has(prop) ? expressions : data;
  return collection.get(prop);
};

const setCell = (target, prop, value) => {
  target.expressions.delete(prop);
  target.data.delete(prop);
  target.callChain.set(prop, 0);

  if (typeof value === 'string' && value[0] === '=') {
    const src = '() => ' + value.substring(1);

    const options = { context: target.context };
    const script = metavm.createScript(prop, src, options);
    target.expressions.set(prop, script.exports);
  } else {
    target.data.set(prop, value);
  }
  return true;
};

class Sheet {
  constructor() {
    this.data = new Map();
    this.expressions = new Map();
    this.values = new Proxy(this, { get: getValue });
    this.context = metavm.createContext(this.values);
    this.cells = new Proxy(this, { get: getCell, set: setCell });
    this.callChain = new Map();
  }
}

module.exports = { Sheet };
