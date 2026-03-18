// tests/tools/factory.test.ts
import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { createSessionStore, type SessionStore } from "../../src/session/sessions";
import { createQuestionToolFactory } from "../../src/tools/factory";

describe("createQuestionToolFactory", () => {
  let sessions: SessionStore;

  beforeEach(() => {
    sessions = createSessionStore({ skipBrowser: true });
  });

  afterEach(async () => {
    await sessions.cleanup();
  });

  it("should create a tool that pushes a question to a session", async () => {
    const { session_id } = await sessions.startSession({ title: "Test" });
    const createTool = createQuestionToolFactory(sessions);

    const askTextTool = createTool({
      type: "ask_text",
      description: "Ask a text question",
      args: {},
      toConfig: (_args: { session_id: string }) => ({ question: "What is your name?" }),
    });

    const result = await askTextTool.execute({ session_id }, {} as any);

    expect(result).toContain("Question pushed:");
    expect(result).toContain("Use get_answer");
  });

  it("should return failure when session_id is not found", async () => {
    const createTool = createQuestionToolFactory(sessions);

    const askTextTool = createTool({
      type: "ask_text",
      description: "Ask a text question",
      args: {},
      toConfig: () => ({ question: "What?" }),
    });

    const result = await askTextTool.execute({ session_id: "ses_nonexistent" }, {} as any);

    expect(result).toContain("Failed:");
    expect(result).toContain("Session not found");
  });

  it("should return validation error when validate function rejects args", async () => {
    const createTool = createQuestionToolFactory(sessions);

    const askTextTool = createTool({
      type: "ask_text",
      description: "Ask a text question",
      args: {},
      validate: () => "missing required field",
      toConfig: () => ({ question: "What?" }),
    });

    const result = await askTextTool.execute({ session_id: "ses_any" }, {} as any);

    expect(result).toBe("Failed: missing required field");
  });
});
