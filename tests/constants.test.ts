import { describe, expect, it } from "bun:test";

import { DEFAULT_ANSWER_TIMEOUT_MS } from "../src/constants";

describe("constants", () => {
  it("should export DEFAULT_ANSWER_TIMEOUT_MS as 5 minutes", () => {
    expect(DEFAULT_ANSWER_TIMEOUT_MS).toBe(300000);
  });
});
