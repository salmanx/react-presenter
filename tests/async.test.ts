import { describe, expect, it } from "vitest";
import { UserPresenter, makeUser } from "./fixtures";

describe("resolve()", () => {
  it("resolves async computed properties and merges them with sync getters", async () => {
    const user = UserPresenter.present(makeUser({ active: true }));
    const resolved = await user.resolve();
    expect(resolved.profileScore).toBe(100);
    expect(resolved.fullName).toBe("Ada Lovelace");
  });

  it("respects only()/except() options passed to resolve()", async () => {
    const user = UserPresenter.present(makeUser());
    const resolved = await user.resolve({ only: ["fullName"] });
    expect(Object.keys(resolved).sort()).toEqual(["fullName", "profileScore"].sort());
  });

  it("a rejected async property resolves to undefined instead of rejecting resolve()", async () => {
    class FlakyPresenter extends UserPresenter {
      async profileScore(): Promise<number> {
        throw new Error("boom");
      }
    }
    const user = FlakyPresenter.present(makeUser());
    const resolved = await user.resolve();
    expect(resolved.profileScore).toBeUndefined();
  });
});
