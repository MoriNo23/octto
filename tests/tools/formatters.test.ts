// tests/tools/formatters.test.ts
import { describe, expect, it } from "bun:test";

import type { BrainstormState, Branch } from "../../src/state/types";
import { formatBranchStatus, formatFindings, formatFindingsList, formatQASummary } from "../../src/tools/formatters";

function makeBranch(overrides: Partial<Branch> = {}): Branch {
  return {
    id: "test_branch",
    scope: "Test scope",
    status: "exploring",
    questions: [],
    finding: null,
    ...overrides,
  };
}

function makeState(branches: Branch[]): BrainstormState {
  const branchMap: Record<string, Branch> = {};
  const order: string[] = [];
  for (const b of branches) {
    branchMap[b.id] = b;
    order.push(b.id);
  }
  return {
    session_id: "ses_test",
    browser_session_id: null,
    request: "Test request",
    created_at: Date.now(),
    updated_at: Date.now(),
    branches: branchMap,
    branch_order: order,
  };
}

describe("formatBranchStatus", () => {
  it("should format exploring branch with pending finding", () => {
    const result = formatBranchStatus(makeBranch({ id: "infra", scope: "Infrastructure", status: "exploring" }));

    expect(result).toContain('id="infra"');
    expect(result).toContain('status="exploring"');
    expect(result).toContain("<scope>Infrastructure</scope>");
    expect(result).toContain("<finding>pending</finding>");
  });

  it("should format done branch with actual finding", () => {
    const result = formatBranchStatus(
      makeBranch({ id: "db", scope: "Database", status: "done", finding: "Use PostgreSQL" }),
    );

    expect(result).toContain('status="done"');
    expect(result).toContain("<finding>Use PostgreSQL</finding>");
  });

  it("should escape XML characters in scope and finding", () => {
    const result = formatBranchStatus(makeBranch({ scope: "Compare <A> & <B>", finding: "Use A > B & C" }));

    expect(result).toContain("Compare &lt;A&gt; &amp; &lt;B&gt;");
    expect(result).toContain("Use A &gt; B &amp; C");
  });
});

describe("formatFindings", () => {
  it("should wrap all branch findings in <findings> element", () => {
    const state = makeState([
      makeBranch({ id: "b1", scope: "Scope 1", finding: "Finding 1" }),
      makeBranch({ id: "b2", scope: "Scope 2", finding: "Finding 2" }),
    ]);

    const result = formatFindings(state);

    expect(result).toContain("<findings>");
    expect(result).toContain("</findings>");
    expect(result).toContain("Finding 1");
    expect(result).toContain("Finding 2");
  });

  it("should show 'no finding' for branches without findings", () => {
    const state = makeState([makeBranch({ id: "b1", scope: "Scope", finding: null })]);

    const result = formatFindings(state);

    expect(result).toContain("no finding");
  });
});

describe("formatFindingsList", () => {
  it("should format findings as a list with scope attributes", () => {
    const state = makeState([
      makeBranch({ id: "b1", scope: "Database choice", finding: "PostgreSQL" }),
      makeBranch({ id: "b2", scope: "Caching", finding: "Redis" }),
    ]);

    const result = formatFindingsList(state);

    expect(result).toContain('<finding scope="Database choice">PostgreSQL</finding>');
    expect(result).toContain('<finding scope="Caching">Redis</finding>');
  });
});

describe("formatQASummary", () => {
  it("should return no-questions message when branch has no answered questions", () => {
    const result = formatQASummary(makeBranch());

    expect(result).toContain("no questions answered");
  });

  it("should format answered questions as XML qa pairs", () => {
    const branch = makeBranch({
      questions: [
        {
          id: "q1",
          type: "ask_text",
          text: "What database?",
          config: { question: "What database?" },
          answer: { text: "PostgreSQL" },
          answeredAt: Date.now(),
        },
      ],
    });

    const result = formatQASummary(branch);

    expect(result).toContain("<question>What database?</question>");
    expect(result).toContain("<answer>PostgreSQL</answer>");
  });

  it("should skip unanswered questions", () => {
    const branch = makeBranch({
      questions: [
        {
          id: "q1",
          type: "ask_text",
          text: "Answered question",
          config: { question: "Answered" },
          answer: { text: "Yes" },
          answeredAt: Date.now(),
        },
        {
          id: "q2",
          type: "ask_text",
          text: "Unanswered question",
          config: { question: "Unanswered" },
        },
      ],
    });

    const result = formatQASummary(branch);

    expect(result).toContain("Answered question");
    expect(result).not.toContain("Unanswered question");
  });
});
