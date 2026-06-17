import type { Edge, Node } from 'reactflow';

export type PMNodeType = 'message' | 'prd' | 'teamup' | 'dingMeeting';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error';

export interface MessageConfig {
  title: string;
  rawText: string;
}

export interface PrdConfig {
  title: string;
}

export interface TeamupConfig {
  title: string;
  template: string;
  description: string;
  owner: string;
  priority: string;
  createInTeamup: boolean;
}

export interface DingMeetingConfig {
  title: string;
  start: string;
  end: string;
  attendees: string;
  openDingTalkIds: string;
  location: string;
  description: string;
  createInDingTalk: boolean;
}

export interface PMNodeData {
  label: string;
  nodeType: PMNodeType;
  status: NodeStatus;
  config: MessageConfig | PrdConfig | TeamupConfig | DingMeetingConfig;
  inputSnapshot?: string;
  output?: string;
  errorMessage?: string;
}

export type PMNode = Node<PMNodeData, PMNodeType>;
export type PMEdge = Edge;

export interface WorkflowDocument {
  taskId?: string;
  nodes: PMNode[];
  edges: PMEdge[];
  selectedNodeId?: string;
}

export interface TaskSummary {
  id: string;
  name: string;
  path?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AISettings {
  provider: 'hermesCli' | 'localHttp' | 'openai';
  apiKey: string;
  model: string;
  localEndpoint: string;
  temperature: number;
}

export interface AIRequest {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
}

export interface LocalAIRequest {
  provider: 'hermesCli' | 'localHttp';
  endpoint: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
}

export interface NodeDefinition {
  type: PMNodeType;
  label: string;
  description: string;
}
