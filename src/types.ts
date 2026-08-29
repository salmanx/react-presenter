export type AnyRecord = Record<string, unknown>;

/**
 * Shape tsc needs to accept a presenter class as a value (e.g. in
 * `decorate(data, UserPresenter)` or `usePresenter(UserPresenter, data)`),
 * so `T`/`C`/`P` can be inferred from the class that's passed in.
 */
export interface PresenterConstructor<T, C, P> {
  new (data: T, context?: C): P;
}

/**
 * Extract a presenter's `data` type from the presenter type itself. Used
 * so that `SomePresenter.present(data, context)` infers `T`/`C` from the
 * concrete subclass (`this`) rather than independently from whatever gets
 * passed at the call site — which is what lets a partial context object
 * literal type-check against the presenter's declared context type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataOf<P> = P extends { data: infer T } ? T : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContextOf<P> = P extends { context: infer C } ? C : never;

export interface PresentOptions {
  /**
   * Cache each getter's return value the first time it's read on a given
   * presenter instance. Useful when a computed getter is expensive (e.g.
   * heavy formatting or derived aggregation) and may be read more than
   * once during a render. Off by default because most getters are cheap
   * and memoizing can hide the fact that `data` changed underneath you.
   */
  memoize?: boolean;
}

export interface ToJSONOptions {
  /** Only include these presenter properties, in the given order. */
  only?: readonly string[];
  /** Include every presenter property except these. */
  except?: readonly string[];
}

export interface FormatAdapter {
  date(value: Date | string | number, options?: Intl.DateTimeFormatOptions): string;
  number(value: number, options?: Intl.NumberFormatOptions): string;
  currency(value: number, currency?: string, options?: Intl.NumberFormatOptions): string;
  relativeTime(value: Date | string | number, unit?: Intl.RelativeTimeFormatUnit): string;
}

export type TranslateFn = (key: string, params?: AnyRecord, locale?: string) => string;

export interface PresenterGlobalConfig {
  /** Plug in your i18n library (i18next, next-intl, FormatJS, ...) here. */
  translate?: TranslateFn;
  /** Fallback locale used when a presenter's context has none. */
  locale?: string;
  /** Override individual Intl-backed formatters globally. */
  formatters?: Partial<FormatAdapter>;
}
