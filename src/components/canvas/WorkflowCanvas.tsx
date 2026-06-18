import ReactFlow, { Background, Controls, MiniMap, type NodeTypes, useReactFlow } from 'reactflow';
import { useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { TextInputNode } from '../nodes/TextInputNode';
import { AITransformNode } from '../nodes/AITransformNode';
import { TemplateActionNode } from '../nodes/TemplateActionNode';
import type { PMNodeType } from '../../types/workflow';

export function WorkflowCanvas() {
  const { project } = useReactFlow();
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const onConnect = useWorkflowStore((state) => state.onConnect);
  const selectNode = useWorkflowStore((state) => state.selectNode);

  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      context: TextInputNode,
      prd: AITransformNode,
      teamup: TemplateActionNode,
      dingMeeting: TemplateActionNode,
    }),
    [],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/pmweaver-node-type') as PMNodeType | '';
    if (!type) return;
    const position = project({ x: e.clientX, y: e.clientY });
    useWorkflowStore.getState().addNodeAt(type, position);
  };

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
      onDragOver={onDragOver}
      onDrop={onDrop}
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
