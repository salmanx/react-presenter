import { describe, expect, it } from "vitest";
import { UserPresenter, makeUser } from "./fixtures";

describe("serialization", () => {
  it("toJSON() only exposes presenter-defined getters, never raw data", () => {
    const user = UserPresenter.present(makeUser());
    const json = user.toJSON();
    expect(json).toHaveProperty("fullName");
    // `active`/`firstName` are raw pass-through attributes, not presenter
    // getters, so they must NOT leak into toJSON().
    expect(json).not.toHaveProperty("active");
    expect(json).not.toHaveProperty("firstName");
  });

  it("only() returns just the requested keys, in the requested order", () => {
    const user = UserPresenter.present(makeUser());
    const json = user.only("fullName", "canEdit");
    expect(Object.keys(json)).toEqual(["fullName", "canEdit"]);
  });

  it("toJSON({ only }) is equivalent to only()", () => {
    const user = UserPresenter.present(makeUser());
    expect(user.toJSON({ only: ["fullName"] })).toEqual({ fullName: "Ada Lovelace" });
  });

  it("except() omits the requested keys", () => {
    const user = UserPresenter.present(makeUser());
    const json = user.except("email", "formattedCreatedAt");
    expect(json).not.toHaveProperty("email");
    expect(json).toHaveProperty("fullName");
  });

  it("an unauthorized getter that throws is omitted as undefined instead of failing serialization", () => {
    const user = UserPresenter.present(makeUser(), {
      currentUser: { can: () => false },
    });
    expect(user.showEmail).toBe(false);
    const json = user.only("email");
    expect(json.email).toBeUndefined();
  });

  it("only() ignores keys that aren't presenter getters", () => {
    const user = UserPresenter.present(makeUser());
    // "firstName" is a raw pass-through attribute, not a presenter getter,
    // and "notAKey" doesn't exist at all — neither should appear.
    const json = user.only("fullName", "firstName" as never, "notAKey" as never);
    expect(json).toEqual({ fullName: "Ada Lovelace" });
  });

  it("toJSON({ only, except }) applies except as a filter within only", () => {
    const user = UserPresenter.present(makeUser(), {
      currentUser: { can: () => true },
    });
    const json = user.toJSON({ only: ["fullName", "email"], except: ["email"] });
    expect(json).toEqual({ fullName: "Ada Lovelace" });
  });
});
