const EXCLUDED_KEYS = new Set(["constructor"]);

/**
 * Collect every `get` accessor defined anywhere in `instance`'s prototype
 * chain, up to (but not including) `stopAt`'s own prototype. This is how
 * `toJSON()` / `only()` / `except()` know which properties are
 * presenter-defined (as opposed to raw pass-through data attributes).
 */
export function getGetterNames(instance: object, stopAt: Function): string[] {
  const names = new Set<string>();
  let proto: object | null = Object.getPrototypeOf(instance);

  while (proto && proto !== Object.prototype) {
    if (proto === stopAt.prototype) break;

    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
      if (!EXCLUDED_KEYS.has(key) && typeof descriptor.get === "function") {
        names.add(key);
      }
    }

    proto = Object.getPrototypeOf(proto);
  }

  return Array.from(names);
}

/**
 * Collect every plain `async` method (not accessor — JS has no
 * `async get`) defined anywhere in `instance`'s prototype chain, up to
 * `stopAt`. Used by `resolve()` to auto-discover async computed
 * properties without requiring any extra registration from the user.
 */
export function getAsyncMethodNames(instance: object, stopAt: Function): string[] {
  const names = new Set<string>();
  let proto: object | null = Object.getPrototypeOf(instance);

  while (proto && proto !== Object.prototype) {
    if (proto === stopAt.prototype) break;

    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
      if (
        !EXCLUDED_KEYS.has(key) &&
        typeof descriptor.value === "function" &&
        descriptor.value.constructor?.name === "AsyncFunction"
      ) {
        names.add(key);
      }
    }

    proto = Object.getPrototypeOf(proto);
  }

  return Array.from(names);
}
