import type { Element } from '../types';

export const renderTriggers = (el: Exclude<Element, string>): string => {
  const { triggers } = el.behavior || {};
  if (!triggers) return '';
  return Array.isArray(triggers) ? `hx-trigger=${triggers.join(', ')}` : `hx-trigger=${triggers}`;
};
