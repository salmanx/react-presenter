"use client";

import { useMemo } from "react";
import type { Presenter } from "./Presenter";
import type { PresentOptions, PresenterConstructor } from "./types";

/**
 * Memoize `Presenter.present` across re-renders, so the Proxy + presenter
 * instance aren't rebuilt every render. Recomputes only when `deps`
 * change (defaults to `[data, context]`, matching most usage).
 *
 * ```tsx
 * function ProductCard({ product }: { product: Product }) {
 *   const presenter = usePresenter(ProductPresenter, product);
 *   return <h2>{presenter.title}</h2>;
 * }
 * ```
 *
 * This is a client-only convenience — presenters themselves have no
 * React dependency and work directly in Server Components without this
 * hook; just call `ProductPresenter.present(product)` there.
 */
export function usePresenter<T, C, P extends Presenter<T, C>>(
  PresenterClass: PresenterConstructor<T, C, P>,
  data: T,
  context?: C,
  options?: PresentOptions,
  deps: readonly unknown[] = [data, context]
): P & T {
  return useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (PresenterClass as any).present(data, context, options) as P & T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );
}

/** `presentMany` equivalent of `usePresenter`. */
export function usePresenterMany<T, C, P extends Presenter<T, C>>(
  PresenterClass: PresenterConstructor<T, C, P>,
  dataList: readonly T[],
  context?: C,
  options?: PresentOptions,
  deps: readonly unknown[] = [dataList, context]
): Array<P & T> {
  return useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (PresenterClass as any).presentMany(dataList, context, options) as Array<P & T>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );
}
