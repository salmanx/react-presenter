import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePresenter, usePresenterMany } from "../src/react";
import { UserPresenter, makeUser } from "./fixtures";

describe("usePresenter", () => {
  it("returns a working presenter", () => {
    const { result } = renderHook(() => usePresenter(UserPresenter, makeUser()));
    expect(result.current.fullName).toBe("Ada Lovelace");
    expect(result.current.id).toBe("1"); // raw pass-through still works
  });

  it("memoizes the presenter across re-renders with the same data/context", () => {
    const user = makeUser();
    const { result, rerender } = renderHook(
      ({ u }) => usePresenter(UserPresenter, u),
      { initialProps: { u: user } }
    );
    const first = result.current;
    rerender({ u: user });
    expect(result.current).toBe(first);
  });

  it("recomputes when data changes", () => {
    const { result, rerender } = renderHook(
      ({ u }) => usePresenter(UserPresenter, u),
      { initialProps: { u: makeUser({ firstName: "Ada" }) } }
    );
    expect(result.current.fullName).toBe("Ada Lovelace");
    rerender({ u: makeUser({ firstName: "Grace" }) });
    expect(result.current.fullName).toBe("Grace Lovelace");
  });
});

describe("usePresenterMany", () => {
  it("presents a collection", () => {
    const { result } = renderHook(() =>
      usePresenterMany(UserPresenter, [makeUser({ id: "1" }), makeUser({ id: "2" })])
    );
    expect(result.current).toHaveLength(2);
    expect(result.current[0].fullName).toBe("Ada Lovelace");
  });
});
