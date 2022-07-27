'use strict';

const metavm = require('metavm');

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
  if (callChain.has(prop)) {
    throw new Error('Recursive expression error');
  }
  if (!expressions.has(prop)) return data.get(prop);
  const expression = expressions.get(prop);
  callChain.add(prop);
  const value = expression();
  if (value) callChain.clear();
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
  target.callChain.clear();

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
    this.callChain = new Set();
  }
}

module.exports = { Sheet };
