import html from 'html-template-tag';
import type { Element, ElementTree } from '../types';

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

  return `hx-vals='js:{${entries.join(', ')}}'`;
};

export const renderElement = (el: ElementTree): string => {
  if (Array.isArray(el)) {
    return el.map(renderElement).join('');
  }
  if (typeof el === 'string') return el;

  const attrString = el.shape?.attrs?.join(' ') || '';
  const { triggers, resource, values, headers, swap } = el.behavior || {};

  // TODO: const renderTriggers = (triggers: string | string[]) => {
  const triggerString = !triggers
    ? ''
    : Array.isArray(triggers)
      ? `hx-trigger=${triggers.join(', ')} `
      : `hx-trigger=${triggers} `;
  const resourceString = !resource ? '' : `hx-${resource.action}=${resource.url} `;
  const swapString = !swap ? '' : `hx-swap=${swap} `;
  const headersString = renderHeaders(headers);
  console.log('headersString', headersString);

  const children = el.shape?.children || [];
  const childrenString =
    Array.isArray(children) && children.length > 0 ? children.map(renderElement).join('') : '';
  return html`<${el.type} ${attrString}${triggerString}${resourceString}${swapString}$${headersString}${renderValues(values)}>$${childrenString}</${el.type}>`;
};
