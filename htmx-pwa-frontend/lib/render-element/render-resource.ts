import type { Element } from '../types';

export const renderResource = (el: Exclude<Element, string>): string => {
  const { resource } = el.behavior || {};
  if (!resource) return '';
  const { action, url } = resource;
  return `hx-${action}=${url}`;
};
