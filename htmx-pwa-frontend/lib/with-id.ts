import type { Element } from './types';

export const withId = (fn: (id: string) => Element): Element => {
  const id = `el-${crypto.randomUUID()}`;

  const el = fn(id);
  if (typeof el === 'string') return el;
  el.shape = { ...(el.shape || {}), id };
  return el;
};
