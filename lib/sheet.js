'use strict';

const { EventEmitter } = require('node:events');

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
  if (data.has(prop)) return data.get(prop);

  const expression = expressions.get(prop);
  if (expression) return expression.compute();
  return target.handleUnknownIdentifier(prop, target);
};

const getCell = (target, prop) => {
  const { expressions, data } = target;
  const collection = expressions.has(prop) ? expressions : data;
  return collection.get(prop);
};

const setCell = (target, prop, value) => {
  target.expressions.delete(prop);
  target.data.delete(prop);

  const isFormula = typeof value === 'string' && value[0] === '=';
  if (isFormula) {
    const src = `() => ${value.substring(1)}`;
    const options = { context: target.context };
    const script = metavm.createScript(prop, src, options);
    const cell = { compute: script.exports, source: value };
    target.expressions.set(prop, cell);
  } else {
    target.data.set(prop, value);
  }
  return true;
};

class Sheet extends EventEmitter {
  constructor() {
    super();
    this.data = new Map();
    this.expressions = new Map();
    this.values = new Proxy(this, { get: getValue });
    this.context = metavm.createContext(this.values);
    this.cells = new Proxy(this, { get: getCell, set: setCell });
  }

  handleUnknownIdentifier(...args) {
    let result = undefined;
    for (const listener of this.listeners('identifier')) {
      result = listener(...args);
      if (result !== undefined) return result;
    }
    return result;
  }
}

module.exports = { Sheet };
