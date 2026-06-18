import { create } from 'zustand';
import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from 'reactflow';
import type {
  AISettings,
  ContextConfig,
  DingMeetingConfig,
  PMEdge,
  PMNode,
  PMNodeData,
  PMNodeType,
  PrdConfig,
  TaskSummary,
  TeamupConfig,
  WorkflowDocument,
} from '../types/workflow';
import { createNode, createStarterWorkflow } from '../lib/workflow/definitions';
import { defaultSettings, loadSettings, saveSettings, saveWorkflow } from '../lib/storage/localStorage';
import {
  createTaskInVault,
  listTasksFromVault,
  loadWorkflowFromVault,
  saveTaskNodesToVault,
  saveWorkflowToVault,
} from '../lib/storage/vaultStorage';
import { runAINode } from '../lib/ai/runAI';
import { runDingMeeting, runTeamup } from '../lib/workflow/actions';

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
  addNodeAt: (type: PMNodeType, position: { x: number; y: number }) => void;
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
  runSelectedNode: () => Promise<void>;
}

const emptyWorkflow: WorkflowDocument = {
  nodes: [],
  edges: [],
};

function prdTitleFromMarkdown(markdown: string) {
  const heading = markdown
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('# '));

  return heading?.replace(/^#+\s*/, '').replace(/^PRD\s*[-:]\s*/i, '').trim() ?? '';
}

function nodeContent(node: PMNode) {
  if (node.data.nodeType === 'context') {
    return (node.data.config as ContextConfig).content.trim();
  }
  if (node.data.nodeType === 'prd') {
    const config = node.data.config as PrdConfig;
    return (node.data.output || config.content).trim();
  }
  return node.data.output?.trim() ?? '';
}

function teamupSourceFromUpstream(nodeId: string, nodes: PMNode[], edges: PMEdge[]) {
  const prdNode = edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => nodes.find((node) => node.id === edge.source))
    .find((node): node is PMNode => node?.data.nodeType === 'prd');

  if (!prdNode) return undefined;

  const config = prdNode.data.config as PrdConfig;
  const content = nodeContent(prdNode);
  const title = (config.title && config.title !== 'PRD Draft' ? config.title : prdTitleFromMarkdown(content)).trim();

  return { title, content };
}

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
  addNodeAt: (type, position) => {
    const node = createNode(type, position);
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
  runSelectedNode: async () => {
    const { selectedNodeId, nodes, edges, settings, updateNodeData, setLastRunError, currentTask } = get();
    if (!selectedNodeId) return;

    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return;

    setLastRunError(undefined);

    if (node.data.nodeType === 'context') return;

    const upstream = edges
      .filter((edge) => edge.target === selectedNodeId)
      .map((edge) => {
        const src = nodes.find((n) => n.id === edge.source);
        return src ? nodeContent(src) : '';
      })
      .filter(Boolean)
      .join('\n\n---\n\n');

    if (!upstream.trim()) {
      setLastRunError(node.data.nodeType === 'teamup' ? 'TEAMUP requires upstream PRD.' : `${node.data.label} requires upstream context.`);
      return;
    }

    updateNodeData(selectedNodeId, { status: 'running', inputSnapshot: upstream, errorMessage: undefined });

    try {
      let output = '';
      if (node.data.nodeType === 'prd') {
        output = await runAINode(node.data.nodeType, upstream, settings, (node.data.config as PrdConfig).promptHint);
      } else if (node.data.nodeType === 'teamup') {
        output = await runTeamup(node.data.config as TeamupConfig, upstream, teamupSourceFromUpstream(selectedNodeId, nodes, edges));
      } else if (node.data.nodeType === 'dingMeeting') {
        output = await runDingMeeting(node.data.config as DingMeetingConfig, upstream);
      }
      updateNodeData(selectedNodeId, { status: 'success', output, inputSnapshot: upstream, errorMessage: undefined });
      get().save();
      if (currentTask) void saveTaskNodesToVault(currentTask.id, get().nodes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      updateNodeData(selectedNodeId, { status: 'error', errorMessage: msg });
      setLastRunError(msg);
    }
  },
}));
