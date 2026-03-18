// tests/hooks/hooks-integration.test.ts
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createFragmentInjector, getAgentSystemPromptPrefix } from "../../src/hooks/fragment-injector";

describe("createFragmentInjector", () => {
  let tempDir: string;
  let warnSpy: ReturnType<typeof spyOn>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "octto-hooks-test-"));
    warnSpy = spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(async () => {
    warnSpy.mockRestore();
    await rm(tempDir, { recursive: true });
  });

  it("should merge global and project fragments", async () => {
    await mkdir(join(tempDir, ".octto"));
    await writeFile(join(tempDir, ".octto", "fragments.json"), JSON.stringify({ octto: ["project rule"] }));

    const merged = await createFragmentInjector({ projectDir: tempDir }, { octto: ["global rule"] });

    expect(merged.octto).toEqual(["global rule", "project rule"]);
  });

  it("should return global fragments when no project fragments exist", async () => {
    const merged = await createFragmentInjector({ projectDir: tempDir }, { octto: ["global only"] });

    expect(merged.octto).toEqual(["global only"]);
  });

  it("should return project fragments when global is undefined", async () => {
    await mkdir(join(tempDir, ".octto"));
    await writeFile(join(tempDir, ".octto", "fragments.json"), JSON.stringify({ probe: ["project probe"] }));

    const merged = await createFragmentInjector({ projectDir: tempDir }, undefined);

    expect(merged.probe).toEqual(["project probe"]);
  });
});

describe("getAgentSystemPromptPrefix", () => {
  it("should return formatted prefix for known agent with fragments", () => {
    const fragments = { octto: ["Always be concise", "Use bullet points"] };

    const prefix = getAgentSystemPromptPrefix(fragments, "octto");

    expect(prefix).toContain("<user-instructions>");
    expect(prefix).toContain("- Always be concise");
    expect(prefix).toContain("- Use bullet points");
    expect(prefix).toContain("</user-instructions>");
  });

  it("should return empty string for agent with no fragments", () => {
    const fragments = { octto: ["Some instruction"] };

    const prefix = getAgentSystemPromptPrefix(fragments, "bootstrapper");

    expect(prefix).toBe("");
  });

  it("should return empty string for unknown agent", () => {
    const fragments = { octto: ["Some instruction"] };

    const prefix = getAgentSystemPromptPrefix(fragments, "nonexistent_agent");

    expect(prefix).toBe("");
  });
});
