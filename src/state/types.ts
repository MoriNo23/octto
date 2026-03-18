import type { Answer, BaseConfig, QuestionType } from "@/session";

export const BRANCH_STATUSES = {
  EXPLORING: "exploring",
  DONE: "done",
} as const;

export type BranchStatus = (typeof BRANCH_STATUSES)[keyof typeof BRANCH_STATUSES];

export interface BranchQuestion {
  readonly id: string;
  readonly type: QuestionType;
  readonly text: string;
  readonly config: BaseConfig;
  answer?: Answer;
  answeredAt?: number;
}

export interface Branch {
  readonly id: string;
  readonly scope: string;
  status: BranchStatus;
  questions: BranchQuestion[];
  finding: string | null;
}

export interface BrainstormState {
  readonly session_id: string;
  browser_session_id: string | null;
  readonly request: string;
  readonly created_at: number;
  updated_at: number;
  branches: Record<string, Branch>;
  readonly branch_order: string[];
}

export interface CreateBranchInput {
  id: string;
  scope: string;
}
