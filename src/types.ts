/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Team = 'Team_A' | 'Team_B';

export interface Agent {
  id: string;
  name: string;
  team: Team;
  color: string;
  className: string;
}

export interface Task {
  id: string;
  agentId: string;
  method: string;
  material: string;
  dependencyIds: string[];
  completed?: boolean;
}

export interface Mission {
  agents: Agent[];
  tasks: Task[];
}
