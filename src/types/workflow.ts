import type { Edge, Node } from 'reactflow';

export type PMNodeType =
  | 'textInput'
  | 'requirementExtractor'
  | 'openQuestions'
  | 'prdGenerator'
  | 'markdownExport';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error';

export interface TextInputConfig {
  title: string;
  rawText: string;
}

export interface MarkdownExportConfig {
  fileName: string;
}

export interface PMNodeData {
  label: string;
  nodeType: PMNodeType;
  status: NodeStatus;
  config: TextInputConfig | MarkdownExportConfig | Record<string, never>;
  inputSnapshot?: string;
  output?: string;
  errorMessage?: string;
}

export type PMNode = Node<PMNodeData, PMNodeType>;
export type PMEdge = Edge;

export interface WorkflowDocument {
  nodes: PMNode[];
  edges: PMEdge[];
  selectedNodeId?: string;
}

export interface AISettings {
  apiKey: string;
  model: string;
  temperature: number;
}

export interface AIRequest {
  apiKey: string;
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
