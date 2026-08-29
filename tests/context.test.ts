import { describe, expect, it } from "vitest";
import { configurePresenter } from "../src/config";
import { UserPresenter, makeUser } from "./fixtures";

describe("context, authorization, and i18n", () => {
  it("canEdit depends on context.currentUserId", () => {
    const mine = UserPresenter.present(makeUser({ id: "456" }), { currentUserId: "456" });
    const someoneElses = UserPresenter.present(makeUser({ id: "1" }), { currentUserId: "456" });
    expect(mine.canEdit).toBe(true);
    expect(someoneElses.canEdit).toBe(false);
  });

  it("showEmail depends on an injected authorization callback", () => {
    const authorized = UserPresenter.present(makeUser(), {
      currentUser: { can: () => true },
    });
    const unauthorized = UserPresenter.present(makeUser(), {
      currentUser: { can: () => false },
    });
    expect(authorized.showEmail).toBe(true);
    expect(unauthorized.showEmail).toBe(false);
  });

  it("t() uses the globally configured translate function", () => {
    configurePresenter({
      translate: (key, _params, locale) => `[${locale ?? "default"}] ${key}`,
    });
    const user = UserPresenter.present(makeUser({ status: "active" }), { locale: "ja-JP" });
    expect(user.statusLabel).toBe("[ja-JP] users.status.active");
    // reset for other tests
    configurePresenter({ translate: undefined });
  });

  it("format.date uses context.locale", () => {
    const user = UserPresenter.present(makeUser({ createdAt: "2024-03-15T00:00:00.000Z" }), {
      locale: "en-US",
    });
    expect(user.formattedCreatedAt).toMatch(/Mar/);
  });
});
