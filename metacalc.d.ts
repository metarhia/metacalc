import { EventEmitter } from 'node:events';
import { Context } from 'node:vm';

export interface Sheet extends EventEmitter {
  data: Map<string, string | number>;
  expressions: Map<string, Function>;
  values: object;
  context: Context;
  cells: object;
}
