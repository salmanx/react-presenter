import type { ToJSONOptions } from "./types";
import { getGetterNames } from "./reflection";

/**
 * Serialize a presenter to a plain object containing only its own
 * computed getters — never the raw `data`/`context`, and never a getter
 * that isn't defined on the presenter itself. This is what makes
 * `toJSON()` safe to send across a server action / API boundary: it can
 * never accidentally leak the full underlying entity.
 *
 * A getter that throws (e.g. an authorization check like
 * `if (!this.context.currentUser.can(...)) throw ...`) is treated the
 * same as one that returns `undefined` — it's simply omitted from the
 * output rather than blowing up serialization for the whole object.
 */
export function serializePresenter<P extends object>(
  presenter: P,
  stopAt: Function,
  options: ToJSONOptions = {}
): Record<string, unknown> {
  const allKeys = getGetterNames(presenter, stopAt);
  const onlySet = options.only ? new Set(options.only) : null;
  const exceptSet = options.except ? new Set(options.except) : null;

  const allowedKeys = allKeys.filter((key) => {
    if (onlySet && !onlySet.has(key)) return false;
    if (exceptSet && exceptSet.has(key)) return false;
    return true;
  });

  // Preserve the order the caller asked for in `only`, when given.
  const orderedKeys = onlySet
    ? Array.from(onlySet).filter((key) => allowedKeys.includes(key))
    : allowedKeys;

  const result: Record<string, unknown> = {};
  for (const key of orderedKeys) {
    try {
      result[key] = (presenter as Record<string, unknown>)[key];
    } catch {
      result[key] = undefined;
    }
  }
  return result;
}
