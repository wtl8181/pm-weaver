import type { PMNode, WorkflowDocument } from '../../types/workflow';

interface WorkflowResponse {
  workflow: WorkflowDocument | null;
  path: string;
}

const workflowEndpoint = '/api/vault/workflow';
const artifactEndpoint = '/api/vault/artifacts';

export async function loadWorkflowFromVault(): Promise<WorkflowDocument | null> {
  try {
    const response = await fetch(workflowEndpoint);
    if (!response.ok) return null;
    const data = (await response.json()) as WorkflowResponse;
    return data.workflow;
  } catch {
    return null;
  }
}

export async function saveWorkflowToVault(workflow: WorkflowDocument): Promise<void> {
  await fetch(workflowEndpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
}

export async function saveNodeArtifactToVault(node: PMNode): Promise<void> {
  if (!node.data.output?.trim()) return;

  const fileName =
    node.data.nodeType === 'markdownExport' && 'fileName' in node.data.config
      ? String(node.data.config.fileName)
      : `${node.data.label}-${node.id}.md`;

  await fetch(artifactEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflowId: 'default',
      nodeId: node.id,
      nodeType: node.data.nodeType,
      label: node.data.label,
      fileName,
      content: node.data.output,
    }),
  });
}

export async function saveSuccessfulArtifactsToVault(nodes: PMNode[]): Promise<void> {
  await Promise.all(nodes.filter((node) => node.data.status === 'success').map((node) => saveNodeArtifactToVault(node)));
}
