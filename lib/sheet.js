'use strict';

const metavm = require('metavm');

class Sheet {
  constructor() {
    this.data = new Map();
    this.expressions = new Map();
    this.values = new Proxy(this, {
      get(target, prop) {
        const { expressions, data } = target;
        if (!expressions.has(prop)) return data.get(prop);
        const expression = expressions.get(prop);
        return expression();
      },
    });
    this.context = metavm.createContext(this.values);
    this.cells = new Proxy(this, {
      get(target, prop) {
        const { expressions, data } = target;
        const collection = expressions.has(prop) ? expressions : data;
        return collection.get(prop);
      },
      set(target, prop, value) {
        target.data.set(prop, value);
        if (typeof value === 'string' && value[0] === '=') {
          const src = '() => ' + value.substring(1);
          const options = { context: target.context };
          const script = metavm.createScript(prop, src, options);
          target.expressions.set(prop, script.exports);
        }
        return true;
      },
    });
  }
}

module.exports = { Sheet };
