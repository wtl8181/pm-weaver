import ReactFlow, { Background, Controls, MiniMap, type NodeTypes } from 'reactflow';
import { useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { TextInputNode } from '../nodes/TextInputNode';
import { AITransformNode } from '../nodes/AITransformNode';
import { TemplateActionNode } from '../nodes/TemplateActionNode';

export function WorkflowCanvas() {
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const onConnect = useWorkflowStore((state) => state.onConnect);
  const selectNode = useWorkflowStore((state) => state.selectNode);

  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      message: TextInputNode,
      prd: AITransformNode,
      teamup: TemplateActionNode,
      dingMeeting: TemplateActionNode,
    }),
    [],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node) => selectNode(node.id)}
      onPaneClick={() => selectNode(undefined)}
      fitView
      deleteKeyCode={['Backspace', 'Delete']}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#273142" gap={24} size={1.4} />
      <MiniMap
        pannable
        zoomable
        nodeColor="#172033"
        maskColor="rgba(9, 11, 16, 0.65)"
        className="!border !border-line !bg-panel"
      />
      <Controls position="bottom-left" />
    </ReactFlow>
  );
}
