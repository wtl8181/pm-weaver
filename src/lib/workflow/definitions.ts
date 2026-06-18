import type { NodeDefinition, PMEdge, PMNode, PMNodeType, WorkflowDocument } from '../../types/workflow';

export const nodeDefinitions: NodeDefinition[] = [
  {
    type: 'context',
    label: 'Context',
    description: 'Provide upstream context to downstream nodes such as PRD generation.',
  },
  {
    type: 'prd',
    label: 'PRD',
    description: 'Generate a PRD draft from connected context.',
  },
  {
    type: 'teamup',
    label: 'TEAMUP',
    description: 'Create a TeamUP issue from an upstream PRD.',
  },
  {
    type: 'dingMeeting',
    label: 'Ding Meeting',
    description: 'Create a DingTalk meeting from a calendar template.',
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
      config:
        type === 'context'
          ? { content: '' }
          : type === 'prd'
            ? { title: '', content: '', promptHint: '' }
            : type === 'teamup'
              ? {
                  title: '',
                  productLine: '微牛OMNI',
                  version: '产品待规划版本',
                  template: 'Requirement',
                  description: '',
                  owner: '',
                  priority: 'P2',
                  createInTeamup: true,
                }
              : {
                  title: 'Product Sync',
                  start: '',
                  end: '',
                  attendees: '',
                  openDingTalkIds: '',
                  location: '',
                  description: '',
                  createInDingTalk: false,
                },
    },
  };
}

export function createStarterWorkflow(taskId: string): WorkflowDocument {
  const contextNode = createNode('context', { x: 120, y: 160 });
  const prdNode = createNode('prd', { x: 500, y: 160 });

  return {
    taskId,
    nodes: [contextNode, prdNode],
    edges: [
      {
        id: `${contextNode.id}-${prdNode.id}`,
        source: contextNode.id,
        target: prdNode.id,
        animated: true,
        style: { stroke: '#3dd6a6' },
      },
    ] satisfies PMEdge[],
    selectedNodeId: contextNode.id,
  };
}
