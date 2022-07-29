import { EventEmitter } from 'events';
import { Context } from 'vm';

export interface Sheet extends EventEmitter {
  data: Map<string, string | number>;
  expressions: Map<string, Function>;
  values: object;
  context: Context;
  cells: object;
}
