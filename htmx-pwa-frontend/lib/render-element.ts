import html from "html-template-tag";
import type { Element } from "../types";

export const renderElement = (el: Element): string => {
  if (typeof el === 'string')
    return el;

  const attrString = el.shape?.attrs?.join(' ') || '';
  const { triggers, resource } = el.behavior || {};
  const triggerString = !triggers ? '' : Array.isArray(triggers) ? `hx-trigger=${triggers.join(', ')} ` : `hx-trigger=${triggers} `;
  const resourceString = !resource ? '' : `hx-${resource.action}=${resource.url}`;
  const children = el.shape?.children || [];
  const childrenString = Array.isArray(children) && children.length > 0 ? children.map(renderElement).join('') : '';
  return html`<${el.type} ${attrString}${triggerString}${resourceString}>${childrenString}</${el.type}>`
}