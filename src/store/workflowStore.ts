import { create } from 'zustand';
import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from 'reactflow';
import type { AISettings, PMEdge, PMNode, PMNodeData, PMNodeType, TaskSummary, WorkflowDocument } from '../types/workflow';
import { createNode, createStarterWorkflow } from '../lib/workflow/definitions';
import { defaultSettings, loadSettings, saveSettings, saveWorkflow } from '../lib/storage/localStorage';
import {
  createTaskInVault,
  listTasksFromVault,
  loadWorkflowFromVault,
  saveTaskNodesToVault,
  saveWorkflowToVault,
} from '../lib/storage/vaultStorage';

interface WorkflowState {
  tasks: TaskSummary[];
  currentTask?: TaskSummary;
  nodes: PMNode[];
  edges: PMEdge[];
  selectedNodeId?: string;
  settings: AISettings;
  settingsOpen: boolean;
  artifactOpen: boolean;
  lastRunError?: string;
  taskError?: string;
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
  loadTasks: () => Promise<void>;
  createTask: (name: string) => Promise<void>;
  openTask: (task: TaskSummary) => Promise<void>;
  closeTask: () => void;
  save: () => void;
  saveArtifacts: () => Promise<void>;
}

const emptyWorkflow: WorkflowDocument = {
  nodes: [],
  edges: [],
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  tasks: [],
  currentTask: undefined,
  nodes: emptyWorkflow.nodes,
  edges: emptyWorkflow.edges,
  selectedNodeId: undefined,
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
    const node = createNode(type, { x: 160 + get().nodes.length * 36, y: 180 + get().nodes.length * 24 });
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
  loadTasks: async () => {
    try {
      set({ taskError: undefined });
      const tasks = await listTasksFromVault();
      set({ tasks });
    } catch (error) {
      set({ taskError: error instanceof Error ? error.message : 'Failed to load tasks.' });
    }
  },
  createTask: async (name) => {
    try {
      set({ taskError: undefined });
      const task = await createTaskInVault(name);
      const workflow = createStarterWorkflow(task.id);
      await saveWorkflowToVault(task.id, workflow);
      saveWorkflow(workflow);
      set({
        tasks: [task, ...get().tasks],
        currentTask: task,
        nodes: workflow.nodes,
        edges: workflow.edges,
        selectedNodeId: workflow.selectedNodeId,
        artifactOpen: true,
      });
    } catch (error) {
      set({ taskError: error instanceof Error ? error.message : 'Failed to create task.' });
    }
  },
  openTask: async (task) => {
    try {
      set({ taskError: undefined });
      const storedWorkflow = await loadWorkflowFromVault(task.id);
      const workflow = storedWorkflow ?? createStarterWorkflow(task.id);
      if (!storedWorkflow) {
        await saveWorkflowToVault(task.id, workflow);
      }
      saveWorkflow(workflow);
      set({
        currentTask: task,
        nodes: workflow.nodes,
        edges: workflow.edges,
        selectedNodeId: workflow.selectedNodeId,
        artifactOpen: true,
      });
    } catch (error) {
      set({ taskError: error instanceof Error ? error.message : 'Failed to open task.' });
    }
  },
  closeTask: () =>
    set({
      currentTask: undefined,
      nodes: [],
      edges: [],
      selectedNodeId: undefined,
      artifactOpen: true,
      lastRunError: undefined,
    }),
  save: () => {
    const { currentTask, nodes, edges, selectedNodeId } = get();
    if (!currentTask) return;
    const workflow = { taskId: currentTask.id, nodes, edges, selectedNodeId };
    saveWorkflow(workflow);
    void saveWorkflowToVault(currentTask.id, workflow);
  },
  saveArtifacts: async () => {
    const { currentTask, nodes } = get();
    if (!currentTask) return;
    await saveTaskNodesToVault(currentTask.id, nodes);
  },
}));
