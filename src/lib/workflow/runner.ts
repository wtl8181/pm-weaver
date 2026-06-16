import type { AISettings, PMEdge, PMNode, PMNodeData } from '../../types/workflow';
import { runAINode } from '../ai/runAI';

type UpdateNode = (nodeId: string, patch: Partial<PMNodeData>) => void;

function getExecutionOrder(nodes: PMNode[], edges: PMEdge[]): PMNode[] {
  const inDegree = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  }

  const queue = nodes.filter((node) => (inDegree.get(node.id) ?? 0) === 0);
  const ordered: PMNode[] = [];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) continue;
    ordered.push(node);

    for (const targetId of outgoing.get(node.id) ?? []) {
      const nextDegree = (inDegree.get(targetId) ?? 0) - 1;
      inDegree.set(targetId, nextDegree);
      if (nextDegree === 0) {
        const target = nodes.find((item) => item.id === targetId);
        if (target) queue.push(target);
      }
    }
  }

  if (ordered.length !== nodes.length) {
    throw new Error('Workflow contains a cycle. Remove circular connections before running.');
  }

  return ordered;
}

function collectUpstream(nodeId: string, edges: PMEdge[], outputs: Map<string, string>) {
  return edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => outputs.get(edge.source))
    .filter((value): value is string => Boolean(value))
    .join('\n\n---\n\n');
}

export async function runWorkflow(nodes: PMNode[], edges: PMEdge[], settings: AISettings, updateNode: UpdateNode) {
  const ordered = getExecutionOrder(nodes, edges);
  const outputs = new Map<string, string>();

  for (const node of ordered) {
    const upstream = collectUpstream(node.id, edges, outputs);
    updateNode(node.id, { status: 'running', inputSnapshot: upstream, errorMessage: undefined });

    try {
      let output = '';

      if (node.data.nodeType === 'message') {
        const config = node.data.config as { title: string; rawText: string };
        output = config.rawText.trim();
        if (!output) {
          throw new Error('Message node is empty.');
        }
      } else {
        if (!upstream.trim()) {
          throw new Error(`${node.data.label} requires upstream context.`);
        }
        output = await runAINode(node.data.nodeType, upstream, settings);
      }

      outputs.set(node.id, output);
      updateNode(node.id, { status: 'success', output, inputSnapshot: upstream, errorMessage: undefined });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown workflow error.';
      updateNode(node.id, { status: 'error', errorMessage: message });
      throw new Error(`${node.data.label}: ${message}`);
    }
  }
}
