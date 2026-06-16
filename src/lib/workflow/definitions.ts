import type { NodeDefinition, PMEdge, PMNode, PMNodeType, WorkflowDocument } from '../../types/workflow';

export const nodeDefinitions: NodeDefinition[] = [
  {
    type: 'message',
    label: 'Message',
    description: 'Paste raw product messages, notes, or requirement context.',
  },
  {
    type: 'prd',
    label: 'PRD',
    description: 'Generate a PRD draft from connected message context.',
  },
];

export function createNode(type: PMNodeType, position = { x: 120, y: 120 }): PMNode {
  const definition = nodeDefinitions.find((item) => item.type === type);
  const id = `${type}-${crypto.randomUUID()}`;

  return {
    id,
    type,
    position,
    data: {
      label: definition?.label ?? type,
      nodeType: type,
      status: 'idle',
      config: type === 'message' ? { title: 'Raw Message', rawText: '' } : { title: 'PRD Draft' },
    },
  };
}

export function createStarterWorkflow(taskId: string): WorkflowDocument {
  const messageNode = createNode('message', { x: 120, y: 160 });
  const prdNode = createNode('prd', { x: 500, y: 160 });

  return {
    taskId,
    nodes: [messageNode, prdNode],
    edges: [
      {
        id: `${messageNode.id}-${prdNode.id}`,
        source: messageNode.id,
        target: prdNode.id,
        animated: true,
        style: { stroke: '#3dd6a6' },
      },
    ] satisfies PMEdge[],
    selectedNodeId: messageNode.id,
  };
}
