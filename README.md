# Spreadsheet calculations for Metarhia

[![ci status](https://github.com/metarhia/metacalc/workflows/Testing%20CI/badge.svg)](https://github.com/metarhia/metacalc/actions?query=workflow%3A%22Testing+CI%22+branch%3Amaster)
[![snyk](https://snyk.io/test/github/metarhia/metacalc/badge.svg)](https://snyk.io/test/github/metarhia/metacalc)
[![npm version](https://badge.fury.io/js/metacalc.svg)](https://badge.fury.io/js/metacalc)
[![npm downloads/month](https://img.shields.io/npm/dm/metacalc.svg)](https://www.npmjs.com/package/metacalc)
[![npm downloads](https://img.shields.io/npm/dt/metacalc.svg)](https://www.npmjs.com/package/metacalc)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/metarhia/metacalc/blob/master/LICENSE)

## Uasge

```js
const { Sheet } = require('metacalc');

const sheet = new Sheet();

sheet.cells['A1'] = 100;
sheet.cells['B1'] = 2;
sheet.cells['C1'] = '=A1*B1';

console.log({ sheet });
```

## License & Contributors

Copyright (c) 2022 [Metarhia contributors](https://github.com/metarhia/metacalc/graphs/contributors).
Metacalc is [MIT licensed](./LICENSE).\
Metacalc is a part of [Metarhia](https://github.com/metarhia) technology stack.
