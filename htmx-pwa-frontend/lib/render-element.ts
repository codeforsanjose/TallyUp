import html from 'html-template-tag';
import type { Element, ElementTree } from './types';

const renderHeaders = (
  headers: Required<Exclude<Element, string>>['behavior']['headers'],
): string => {
  if (!headers) return '';
  const entries = Object.entries(headers).map(([key, value]) => {
    const val =
      typeof value === 'function'
        ? `(${value.toString().replaceAll('"', "'").trim()})()`
        : JSON.stringify(value);
    return `${key}: ${val}`;
  });

  // TODO: js: is risky, need to implement some kind of sanitization
  return `hx-headers="js:{${entries.join(', ')}}" `;
};

const renderValues = (values: Required<Exclude<Element, string>>['behavior']['values']): string => {
  if (!values) return '';
  const entries = Object.entries(values).map(([key, value]) => {
    const val =
      typeof value === 'function'
        ? `(${value.toString().replace(/\s+/g, ' ').trim()})()`
        : JSON.stringify(value);
    return `${key}:${val}`;
  });

  // TODO: js: is risky, need to implement some kind of sanitization
  return `hx-vals='js:{${entries.join(', ')}}'`;
};

export const renderElement = (el: ElementTree): string => {
  if (Array.isArray(el)) {
    return el.map(renderElement).join('');
  }
  if (typeof el === 'string') return el;

  const { triggers, resource, values, headers, swap, target } = el.behavior || {};
  const { id, attrs } = el.shape || {};
  const attrString = attrs?.join(' ') || '';
  const idString = id ? `id=${id} ` : '';

  // TODO: const renderTriggers = (triggers: string | string[]) => {
  const triggerString = !triggers
    ? ''
    : Array.isArray(triggers)
      ? `hx-trigger=${triggers.join(', ')} `
      : `hx-trigger=${triggers} `;
  const resourceString = !resource ? '' : `hx-${resource.action}=${resource.url} `;
  const swapString = !swap ? '' : `hx-swap=${swap} `;
  const headersString = renderHeaders(headers);
  const targetString = target ? `hx-target=${target} ` : '';

  const children = el.shape?.children || [];
  const childrenString =
    Array.isArray(children) && children.length > 0 ? children.map(renderElement).join('') : '';
  return html`<${el.type} 
  ${attrString}
  ${idString}
  ${triggerString}
  ${resourceString}
  ${swapString}
  ${targetString}
  $${headersString}
  ${renderValues(values)}
  >$${childrenString}</${el.type}>`.replace(/\n/g, '');
};
