import { describe, expect, it } from "vitest";
import { decorate, decorateMany } from "../src/decorate";
import { UserPresenter, makeUser } from "./fixtures";

describe("presentMany / decorate", () => {
  it("presents a collection", () => {
    const users = UserPresenter.presentMany([
      makeUser({ id: "1", firstName: "Ada" }),
      makeUser({ id: "2", firstName: "Grace" }),
    ]);
    expect(users).toHaveLength(2);
    expect(users[0].fullName).toBe("Ada Lovelace");
    expect(users[1].fullName).toBe("Grace Lovelace");
  });

  it("shares context across every item in the collection", () => {
    const users = UserPresenter.presentMany(
      [makeUser({ id: "42" }), makeUser({ id: "7" })],
      { currentUserId: "42" }
    );
    expect(users[0].canEdit).toBe(true);
    expect(users[1].canEdit).toBe(false);
  });

  it("decorate() is equivalent to present()", () => {
    const user = decorate(makeUser(), UserPresenter);
    expect(user.fullName).toBe("Ada Lovelace");
  });

  it("decorateMany() is equivalent to presentMany()", () => {
    const users = decorateMany([makeUser({ id: "1" }), makeUser({ id: "2" })], UserPresenter);
    expect(users).toHaveLength(2);
  });
});
