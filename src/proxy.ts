import type { PresentOptions } from "./types";

const memoCache = new WeakMap<object, Map<string, unknown>>();

/**
 * Wrap a presenter instance so that reading any property first checks the
 * presenter itself (its getters/methods win), and falls back to the same
 * property on the raw `data` object if the presenter doesn't define it.
 * This is what lets `UserPresenter.present(user).email` work without
 * writing `get email() { return this.data.email }` for every field
 * (use case 10).
 */
export function createDataProxy<P extends object, T>(
  presenter: P,
  data: T,
  options: PresentOptions = {}
): P & T {
  return new Proxy(presenter, {
    get(target, property, receiver) {
      if (property in target) {
        if (options.memoize && typeof property === "string") {
          const proto = Object.getPrototypeOf(target);
          const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, property) : undefined;
          if (descriptor && typeof descriptor.get === "function") {
            let cache = memoCache.get(target);
            if (!cache) {
              cache = new Map();
              memoCache.set(target, cache);
            }
            if (cache.has(property)) {
              return cache.get(property);
            }
            const value = Reflect.get(target, property, receiver);
            cache.set(property, value);
            return value;
          }
        }
        return Reflect.get(target, property, receiver);
      }

      if (
        typeof property === "string" &&
        data !== null &&
        typeof data === "object" &&
        property in (data as object)
      ) {
        return (data as Record<string, unknown>)[property];
      }

      return undefined;
    },

    has(target, property) {
      if (property in target) return true;
      if (data !== null && typeof data === "object") {
        return property in (data as object);
      }
      return false;
    },
  }) as P & T;
}
