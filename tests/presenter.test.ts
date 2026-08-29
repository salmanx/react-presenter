import { describe, expect, it } from "vitest";
import { UserPresenter, makeUser } from "./fixtures";

describe("Presenter.present", () => {
  it("exposes presenter-defined getters", () => {
    const user = UserPresenter.present(makeUser());
    expect(user.fullName).toBe("Ada Lovelace");
  });

  it("automatically passes through raw data attributes not overridden by a getter", () => {
    const raw = makeUser();
    const user = UserPresenter.present(raw);
    expect(user.id).toBe(raw.id);
    expect(user.active).toBe(raw.active);
    expect(user.firstName).toBe(raw.firstName);
  });

  it("lets a presenter getter override the raw attribute of the same name", () => {
    const user = UserPresenter.present(makeUser(), {
      currentUser: { can: () => true },
    });
    // `email` is a getter on UserPresenter, not a plain pass-through.
    expect(user.email).toBe("a@example.com");
  });

  it("`in` / has-trap sees both presenter and data properties", () => {
    const user = UserPresenter.present(makeUser());
    expect("fullName" in user).toBe(true);
    expect("firstName" in user).toBe(true);
    expect("doesNotExist" in user).toBe(false);
  });

  it("supports memoization of expensive getters via options", () => {
    let calls = 0;
    class CountingPresenter extends UserPresenter {
      get fullName() {
        calls += 1;
        return super.fullName;
      }
    }
    const user = CountingPresenter.present(makeUser(), {}, { memoize: true });
    expect(user.fullName).toBe("Ada Lovelace");
    expect(user.fullName).toBe("Ada Lovelace");
    expect(calls).toBe(1);
  });
});
