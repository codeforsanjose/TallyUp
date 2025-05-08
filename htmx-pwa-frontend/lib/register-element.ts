import type { ElementBehavior, ElementTree } from './types.ts';

const routes: Record<string, ElementBehavior['onTriggered']> = {};

export const registerElement = (el: ElementTree) => {
  if (Array.isArray(el)) {
    el.forEach(registerElement);
    return;
  }

  if (typeof el === 'string') return;

  const { behavior } = el;
  if (!behavior) return;
  const { resource, onTriggered } = behavior;
  if (!resource || !onTriggered) return;
  const { action, url } = resource;
  if (routes[`${action} ${url}`]) console.warn(`Route already registered for ${action} ${url}`); // TODO: handle this case better
  routes[`${resource.action} ${resource.url}`] = onTriggered;

  console.log(`Registered route for ${resource.action} ${resource.url}`);
};

export const getRoutes = () => routes;
