import type { PMNode, TaskSummary, WorkflowDocument } from '../../types/workflow';

interface TasksResponse {
  tasks: TaskSummary[];
  vaultRoot: string;
}

interface TaskResponse {
  task: TaskSummary;
}

interface WorkflowResponse {
  workflow: WorkflowDocument | null;
  path: string;
}

export async function listTasksFromVault(): Promise<TaskSummary[]> {
  const response = await fetch('/api/vault/tasks');
  if (!response.ok) {
    throw new Error('Failed to load tasks from vault.');
  }

  const data = (await response.json()) as TasksResponse;
  return data.tasks;
}

export async function createTaskInVault(name: string): Promise<TaskSummary> {
  const response = await fetch('/api/vault/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  const data = (await response.json()) as Partial<TaskResponse> & { error?: string };
  if (!response.ok || !data.task) {
    throw new Error(data.error ?? 'Failed to create task.');
  }

  return data.task;
}

export async function loadWorkflowFromVault(taskId: string): Promise<WorkflowDocument | null> {
  const response = await fetch(`/api/vault/tasks/${encodeURIComponent(taskId)}/workflow`);
  if (!response.ok) return null;
  const data = (await response.json()) as WorkflowResponse;
  return data.workflow;
}

export async function saveWorkflowToVault(taskId: string, workflow: WorkflowDocument): Promise<void> {
  await fetch(`/api/vault/tasks/${encodeURIComponent(taskId)}/workflow`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
}

export async function saveNodeArtifactToVault(taskId: string, node: PMNode): Promise<void> {
  const content = node.data.nodeType === 'message' ? 'rawText' in node.data.config ? node.data.config.rawText : '' : node.data.output;
  if (!content?.trim()) return;

  await fetch(`/api/vault/tasks/${encodeURIComponent(taskId)}/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nodeId: node.id,
      nodeType: node.data.nodeType,
      label: node.data.label,
      content,
    }),
  });
}

export async function saveTaskNodesToVault(taskId: string, nodes: PMNode[]): Promise<void> {
  await Promise.all(nodes.map((node) => saveNodeArtifactToVault(taskId, node)));
}
