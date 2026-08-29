import { describe, expect, it, afterEach } from "vitest";
import { configurePresenter } from "../src/config";
import { createFormatAdapter } from "../src/format";

describe("createFormatAdapter", () => {
  afterEach(() => {
    // reset any global overrides other tests may have left behind
    configurePresenter({ locale: "en-US", formatters: undefined });
  });

  it("formats currency using Intl", () => {
    const format = createFormatAdapter("en-US");
    expect(format.currency(1234.5, "USD")).toBe("$1,234.50");
  });

  it("formats numbers using Intl", () => {
    const format = createFormatAdapter("en-US");
    expect(format.number(1234567)).toBe("1,234,567");
  });

  it("falls back to the globally configured locale when none is passed", () => {
    configurePresenter({ locale: "de-DE" });
    const format = createFormatAdapter();
    expect(format.currency(1234.5, "EUR")).toContain("1.234,50");
  });

  it("relativeTime formats a past date", () => {
    const format = createFormatAdapter("en-US");
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(format.relativeTime(yesterday, "day")).toMatch(/yesterday|1 day ago/);
  });

  it("individual formatters can be overridden globally", () => {
    configurePresenter({
      formatters: {
        currency: (value) => `custom:${value}`,
      },
    });
    const format = createFormatAdapter("en-US");
    expect(format.currency(10)).toBe("custom:10");
    // non-overridden formatters keep working
    expect(format.number(10)).toBe("10");
  });
});
