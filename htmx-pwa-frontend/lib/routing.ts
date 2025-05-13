import type { ElementBehavior, Routes, TriggerBehavior } from './types.ts';

const routes: Routes = {};

export const registerElement = (
  resource: ElementBehavior['resource'],
  onTriggered: TriggerBehavior,
  strict?: boolean,
) => {
  const key = `${resource.action} ${resource.url}`.toLowerCase();
  if (routes[key]) {
    if (strict) {
      throw new Error(`Route ${key} already exists. Use strict mode to override.`);
    } else {
      console.warn(`Route ${key} already exists. Overriding with new element.`);
    }
  } else {
    routes[key] = onTriggered;
    console.log(`Registered route for ${key}`);
  }
};

export const getRoute = (key: string): TriggerBehavior | undefined => {
  const normalizedKey = key.toLowerCase();
  if (routes[normalizedKey]) {
    return routes[normalizedKey];
  } else {
    return undefined;
  }
};
