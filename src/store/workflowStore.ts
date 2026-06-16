import { create } from 'zustand';
import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from 'reactflow';
import type { AISettings, PMEdge, PMNode, PMNodeData, PMNodeType } from '../types/workflow';
import { createNode } from '../lib/workflow/definitions';
import { defaultSettings, loadSettings, loadWorkflow, saveSettings, saveWorkflow } from '../lib/storage/localStorage';

interface WorkflowState {
  nodes: PMNode[];
  edges: PMEdge[];
  selectedNodeId?: string;
  settings: AISettings;
  settingsOpen: boolean;
  artifactOpen: boolean;
  lastRunError?: string;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: PMNodeType) => void;
  deleteSelectedNode: () => void;
  selectNode: (nodeId?: string) => void;
  updateNodeData: (nodeId: string, patch: Partial<PMNodeData>) => void;
  updateSettings: (settings: AISettings) => void;
  setSettingsOpen: (open: boolean) => void;
  setArtifactOpen: (open: boolean) => void;
  setLastRunError: (message?: string) => void;
  save: () => void;
}

const savedWorkflow = typeof localStorage === 'undefined' ? null : loadWorkflow();

const starterNodes: PMNode[] = [
  createNode('textInput', { x: 80, y: 120 }),
  createNode('requirementExtractor', { x: 420, y: 120 }),
  createNode('prdGenerator', { x: 760, y: 120 }),
  createNode('markdownExport', { x: 1100, y: 120 }),
];

const starterEdges: PMEdge[] = [
  { id: 'starter-1', source: starterNodes[0].id, target: starterNodes[1].id, animated: true },
  { id: 'starter-2', source: starterNodes[1].id, target: starterNodes[2].id, animated: true },
  { id: 'starter-3', source: starterNodes[2].id, target: starterNodes[3].id, animated: true },
];

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: savedWorkflow?.nodes ?? starterNodes,
  edges: savedWorkflow?.edges ?? starterEdges,
  selectedNodeId: savedWorkflow?.selectedNodeId ?? starterNodes[0].id,
  settings: typeof localStorage === 'undefined' ? defaultSettings : loadSettings(),
  settingsOpen: false,
  artifactOpen: true,
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) as PMNode[] });
    get().save();
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
    get().save();
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          animated: true,
          style: { stroke: '#3dd6a6' },
        },
        get().edges,
      ),
    });
    get().save();
  },
  addNode: (type) => {
    const node = createNode(type, { x: 160 + get().nodes.length * 28, y: 160 + get().nodes.length * 18 });
    set({ nodes: [...get().nodes, node], selectedNodeId: node.id, artifactOpen: true });
    get().save();
  },
  deleteSelectedNode: () => {
    const selectedNodeId = get().selectedNodeId;
    if (!selectedNodeId) return;
    set({
      nodes: get().nodes.filter((node) => node.id !== selectedNodeId),
      edges: get().edges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId),
      selectedNodeId: undefined,
    });
    get().save();
  },
  selectNode: (nodeId) => set({ selectedNodeId: nodeId, artifactOpen: Boolean(nodeId) }),
  updateNodeData: (nodeId, patch) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...patch,
                config: patch.config ?? node.data.config,
              },
            }
          : node,
      ),
    });
    get().save();
  },
  updateSettings: (settings) => {
    set({ settings });
    saveSettings(settings);
  },
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setArtifactOpen: (artifactOpen) => set({ artifactOpen }),
  setLastRunError: (lastRunError) => set({ lastRunError }),
  save: () => {
    const { nodes, edges, selectedNodeId } = get();
    saveWorkflow({ nodes, edges, selectedNodeId });
  },
}));
