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
  const { expressions, data } = target;
  if (!expressions.has(prop)) return data.get(prop);
  const expression = expressions.get(prop);
  return expression();
};

const wrapValue = (target, prop) =>
  new Proxy(target, {
    get: (currentTarget, currentProp) => {
      const targetProp = `${prop}.${currentProp}`;
      return getValue(target, targetProp);
    },
  });

const getCell = (target, prop) => {
  const { expressions, data } = target;
  const collection = expressions.has(prop) ? expressions : data;
  return collection.get(prop);
};

const setCell = (target, prop, value) => {
  target.expressions.delete(prop);
  target.data.delete(prop);

  if (typeof value === 'string' && value[0] === '=') {
    const src = '() => ' + value.substring(1);
    const options = { context: target.context };
    const script = metavm.createScript(prop, src, options);
    target.expressions.set(prop, script.exports);
    return true;
  }

  if (prop.includes('.')) {
    let nextDotIndex = prop.indexOf('.');
    while (nextDotIndex !== -1) {
      const key = prop.substring(0, nextDotIndex);
      target.data.set(key, wrapValue(target, key));
      nextDotIndex = prop.indexOf('.', nextDotIndex + 1);
    }

    target.data.set(prop, value);
    return true;
  }

  target.data.set(prop, value);
  return true;
};

class Sheet {
  constructor() {
    this.data = new Map();
    this.expressions = new Map();
    this.values = new Proxy(this, { get: getValue });
    this.context = metavm.createContext(this.values);
    this.cells = new Proxy(this, { get: getCell, set: setCell });
  }
}

module.exports = { Sheet };
