import { Context } from 'vm';

export interface Sheet {
  data: Map<string, string | number>;
  expressions: Map<string, Function>;
  values: object;
  context: Context;
  cells: object;
}
