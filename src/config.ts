import type { PresenterGlobalConfig, TranslateFn } from "./types";

let globalConfig: PresenterGlobalConfig = {
  locale: "en-US",
};

/**
 * Wire up your app's i18n library / default locale / formatter overrides
 * once, e.g. in a root layout or app entry point:
 *
 * ```ts
 * configurePresenter({
 *   translate: (key, params, locale) => i18next.t(key, { ...params, lng: locale }),
 *   locale: "en-US",
 * });
 * ```
 */
export function configurePresenter(config: PresenterGlobalConfig): void {
  globalConfig = { ...globalConfig, ...config };
}

export function getPresenterConfig(): PresenterGlobalConfig {
  return globalConfig;
}

/** Identity fallback so `this.t(key)` is always safe to call. */
export const defaultTranslate: TranslateFn = (key) => key;
