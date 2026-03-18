import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import * as v from "valibot";

import type { BrainstormState } from "./types";

const BrainstormStateSchema = v.object({
  session_id: v.string(),
  browser_session_id: v.nullable(v.string()),
  request: v.string(),
  created_at: v.number(),
  updated_at: v.number(),
  branches: v.record(v.string(), v.any()),
  branch_order: v.array(v.string()),
});

export interface StatePersistence {
  save: (state: BrainstormState) => Promise<void>;
  load: (sessionId: string) => Promise<BrainstormState | null>;
  delete: (sessionId: string) => Promise<void>;
  list: () => Promise<string[]>;
}

function validateSessionId(sessionId: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
    throw new Error(`Invalid session ID: ${sessionId}`);
  }
}

function getFilePath(baseDir: string, sessionId: string): string {
  validateSessionId(sessionId);
  return join(baseDir, `${sessionId}.json`);
}

function ensureDir(baseDir: string): void {
  if (!existsSync(baseDir)) {
    mkdirSync(baseDir, { recursive: true });
  }
}

function parseBrainstormState(content: string, sessionId: string): BrainstormState | null {
  const raw: unknown = JSON.parse(content);
  const parseResult = v.safeParse(BrainstormStateSchema, raw);
  if (!parseResult.success) {
    console.error(`[octto] Invalid state file for session ${sessionId}:`, parseResult.issues);
    return null;
  }
  return parseResult.output as BrainstormState;
}

export function createStatePersistence(baseDir = ".brainstorm"): StatePersistence {
  return {
    async save(state: BrainstormState): Promise<void> {
      ensureDir(baseDir);
      const filePath = getFilePath(baseDir, state.session_id);
      state.updated_at = Date.now();
      await Bun.write(filePath, JSON.stringify(state, null, 2));
    },

    async load(sessionId: string): Promise<BrainstormState | null> {
      const filePath = getFilePath(baseDir, sessionId);
      if (!existsSync(filePath)) {
        return null;
      }
      const content = await Bun.file(filePath).text();
      return parseBrainstormState(content, sessionId);
    },

    async delete(sessionId: string): Promise<void> {
      const filePath = getFilePath(baseDir, sessionId);
      if (existsSync(filePath)) {
        rmSync(filePath);
      }
    },

    async list(): Promise<string[]> {
      if (!existsSync(baseDir)) {
        return [];
      }
      const files = readdirSync(baseDir);
      return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
    },
  };
}
