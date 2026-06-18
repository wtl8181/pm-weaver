import type { AISettings, ContextConfig, DingMeetingConfig, PMEdge, PMNode, PMNodeData, PrdConfig, TeamupConfig } from '../../types/workflow';
import { runAINode } from '../ai/runAI';
import { runDingMeeting, runTeamup } from './actions';

type UpdateNode = (nodeId: string, patch: Partial<PMNodeData>) => void;

function getExecutableNodes(nodes: PMNode[], edges: PMEdge[]): PMNode[] {
  // Context nodes are data sources only — skip them in the execution order.
  const runnable = nodes.filter((n) => n.data.nodeType !== 'context');

  const inDegree = new Map(runnable.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();

  for (const edge of edges) {
    // Only consider edges from runnable nodes.
    if (!runnable.find((n) => n.id === edge.source)) continue;
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  }

  const queue = runnable.filter((node) => (inDegree.get(node.id) ?? 0) === 0);
  const ordered: PMNode[] = [];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) continue;
    ordered.push(node);

    for (const targetId of outgoing.get(node.id) ?? []) {
      const nextDegree = (inDegree.get(targetId) ?? 0) - 1;
      inDegree.set(targetId, nextDegree);
      if (nextDegree === 0) {
        const target = runnable.find((item) => item.id === targetId);
        if (target) queue.push(target);
      }
    }
  }

  if (ordered.length !== runnable.length) {
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

function prdTitleFromMarkdown(markdown: string) {
  const heading = markdown
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('# '));

  return heading?.replace(/^#+\s*/, '').replace(/^PRD\s*[-:]\s*/i, '').trim() ?? '';
}

function teamupSourceFromUpstream(node: PMNode, nodes: PMNode[], edges: PMEdge[], outputs: Map<string, string>) {
  const prdNode = edges
    .filter((edge) => edge.target === node.id)
    .map((edge) => nodes.find((item) => item.id === edge.source))
    .find((item): item is PMNode => item?.data.nodeType === 'prd');

  if (!prdNode) return undefined;

  const config = prdNode.data.config as PrdConfig;
  const content = (outputs.get(prdNode.id) || prdNode.data.output || config.content).trim();
  const title = (config.title && config.title !== 'PRD Draft' ? config.title : prdTitleFromMarkdown(content)).trim();

  return { title, content };
}

export async function runWorkflow(nodes: PMNode[], edges: PMEdge[], settings: AISettings, updateNode: UpdateNode) {
  // Pre-populate context nodes into the outputs map — they need no execution.
  const outputs = new Map<string, string>();
  for (const node of nodes) {
    if (node.data.nodeType === 'context') {
      const config = node.data.config as ContextConfig;
      outputs.set(node.id, config.content.trim());
      updateNode(node.id, { output: config.content.trim(), inputSnapshot: undefined, errorMessage: undefined });
    }
  }

  const ordered = getExecutableNodes(nodes, edges);

  for (const node of ordered) {
    const upstream = collectUpstream(node.id, edges, outputs);
    updateNode(node.id, { status: 'running', inputSnapshot: upstream, errorMessage: undefined });

    try {
      let output = '';

      if (node.data.nodeType === 'teamup') {
        output = await runTeamup(node.data.config as TeamupConfig, upstream, teamupSourceFromUpstream(node, nodes, edges, outputs));
      } else if (node.data.nodeType === 'dingMeeting') {
        output = await runDingMeeting(node.data.config as DingMeetingConfig, upstream);
      } else {
        if (!upstream.trim()) {
          throw new Error(`${node.data.label} requires upstream context.`);
        }
        output = await runAINode(node.data.nodeType, upstream, settings, (node.data.config as PrdConfig).promptHint);
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
