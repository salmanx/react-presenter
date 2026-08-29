import type { Presenter } from "./Presenter";
import type { PresentOptions, PresenterConstructor } from "./types";

/**
 * Functional, Rails-`decorate`-style alternative to `Presenter.present`:
 *
 * ```ts
 * import { decorate } from "react-presenter";
 * const user = decorate(rawUser, UserPresenter);
 * ```
 */
export function decorate<T, C, P extends Presenter<T, C>>(
  data: T,
  PresenterClass: PresenterConstructor<T, C, P>,
  context?: C,
  options?: PresentOptions
): P & T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (PresenterClass as any).present(data, context, options);
}

/** Functional equivalent of `presentMany`. */
export function decorateMany<T, C, P extends Presenter<T, C>>(
  dataList: readonly T[],
  PresenterClass: PresenterConstructor<T, C, P>,
  context?: C,
  options?: PresentOptions
): Array<P & T> {
  return dataList.map((item) => decorate(item, PresenterClass, context, options));
}
