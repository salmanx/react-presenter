import type { AnyRecord, ContextOf, DataOf, PresentOptions, ToJSONOptions } from "./types";
import { createDataProxy } from "./proxy";
import { getAsyncMethodNames } from "./reflection";
import { serializePresenter } from "./serialize";
import { createFormatAdapter } from "./format";
import { defaultTranslate, getPresenterConfig } from "./config";

/**
 * Base class for all presenters/decorators.
 *
 * ```ts
 * class ProductPresenter extends Presenter<Product> {
 *   get isNew() {
 *     const days = (Date.now() - new Date(this.data.created_at).getTime()) / 86_400_000;
 *     return days <= 7;
 *   }
 * }
 *
 * const product = ProductPresenter.present(rawProduct);
 * product.isNew;        // presenter getter
 * product.seller;       // passed through from rawProduct automatically
 * ```
 */
export abstract class Presenter<T, C = AnyRecord> {
  readonly data: T;
  readonly context: C;

  constructor(data: T, context?: C) {
    this.data = data;
    this.context = (context ?? ({} as C)) as C;
  }

  /**
   * Intl-backed date/number/currency/relative-time formatting, aware of
   * `context.locale`. Override globally via `configurePresenter`.
   */
  protected get format() {
    const locale = (this.context as AnyRecord | undefined)?.locale as string | undefined;
    return createFormatAdapter(locale);
  }

  /**
   * Translate a key via the globally configured `translate` function
   * (wire up i18next / next-intl / FormatJS / etc. once with
   * `configurePresenter({ translate })`). Falls back to returning the key
   * itself if nothing is configured, so it's always safe to call.
   */
  protected t(key: string, params?: AnyRecord): string {
    const config = getPresenterConfig();
    const translate = config.translate ?? defaultTranslate;
    const locale = (this.context as AnyRecord | undefined)?.locale as string | undefined;
    return translate(key, params, locale ?? config.locale);
  }

  /**
   * Instantiate a presenter for a single entity and wrap it in a Proxy so
   * every raw attribute not shadowed by a getter passes through
   * automatically.
   */
  static present<P extends Presenter<any, any>>(
    this: new (data: DataOf<P>, context?: ContextOf<P>) => P,
    data: DataOf<P>,
    context?: ContextOf<P>,
    options?: PresentOptions
  ): P & DataOf<P> {
    // eslint-disable-next-line new-cap
    const presenter = new this(data, context);
    return createDataProxy(presenter, data, options);
  }

  /** Present a collection: `UserPresenter.presentMany(rawUsers)`. */
  static presentMany<P extends Presenter<any, any>>(
    this: new (data: DataOf<P>, context?: ContextOf<P>) => P,
    dataList: readonly DataOf<P>[],
    context?: ContextOf<P>,
    options?: PresentOptions
  ): Array<P & DataOf<P>> {
    return dataList.map((item) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).present(item, context, options)
    );
  }

  /**
   * Resolve every async computed property and merge it with the sync
   * getters into a single plain, JSON-serializable object.
   *
   * JavaScript has no `async get` syntax, so async computed properties are
   * plain `async` methods instead:
   *
   * ```ts
   * class UserPresenter extends Presenter<User> {
   *   async profileScore() {
   *     return calculateScore(this.data);
   *   }
   * }
   *
   * const resolved = await UserPresenter.present(user).resolve();
   * resolved.profileScore; // number
   * ```
   *
   * `resolve()` auto-detects any `async` method on the presenter — no
   * extra registration needed — calls each with no arguments, and merges
   * the results with `toJSON()`. A rejected async property resolves to
   * `undefined` rather than failing the whole call.
   */
  async resolve(this: Presenter<T, C>, options?: ToJSONOptions): Promise<Record<string, unknown>> {
    const asyncKeys = getAsyncMethodNames(this, Presenter);

    const resolvedEntries = await Promise.all(
      asyncKeys.map(async (key) => {
        try {
          const method = (this as unknown as Record<string, () => Promise<unknown>>)[key];
          return [key, await method.call(this)] as const;
        } catch {
          return [key, undefined] as const;
        }
      })
    );

    return {
      ...this.toJSON(options),
      ...Object.fromEntries(resolvedEntries),
    };
  }

  /**
   * Serialize the presenter's own computed getters (never the raw
   * `data`/`context`) to a plain object. Safe to return from a Next.js
   * Server Action or pass as props to a Client Component.
   */
  toJSON(options?: ToJSONOptions): Record<string, unknown> {
    return serializePresenter(this, Presenter, options);
  }

  /** `presenter.only("id", "fullName", "avatarUrl")` */
  only(...keys: string[]): Record<string, unknown> {
    return this.toJSON({ only: keys });
  }

  /** `presenter.except("internalNotes")` */
  except(...keys: string[]): Record<string, unknown> {
    return this.toJSON({ except: keys });
  }
}
