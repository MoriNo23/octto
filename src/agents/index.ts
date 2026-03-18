import type { AgentConfig } from "@opencode-ai/sdk";

import { agent as bootstrapper } from "./bootstrapper";
import { agent as octto } from "./octto";
import { agent as probe } from "./probe";

export const AGENTS = {
  octto: "octto",
  bootstrapper: "bootstrapper",
  probe: "probe",
} as const;

export type AgentName = (typeof AGENTS)[keyof typeof AGENTS];

export function isAgentName(value: string): value is AgentName {
  return Object.values(AGENTS).includes(value as AgentName);
}

export const agents: Record<AgentName, AgentConfig> = {
  [AGENTS.octto]: octto,
  [AGENTS.bootstrapper]: bootstrapper,
  [AGENTS.probe]: probe,
};

export { octto, bootstrapper, probe };
