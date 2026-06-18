import type { NodeProps } from 'reactflow';
import type { ContextConfig, PMNodeData } from '../../types/workflow';
import { useWorkflowStore } from '../../store/workflowStore';
import { PMNodeShell } from './PMNodeShell';

export function TextInputNode({ id, data, selected }: NodeProps<PMNodeData>) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const config = data.config as ContextConfig;

  return (
    <PMNodeShell data={data} selected={selected}>
      <textarea
        className="nodrag h-32 w-full resize-none rounded-md border border-line bg-canvas px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
        defaultValue={config.content}
        onChange={(event) =>
          updateNodeData(id, {
            config: { ...config, content: event.target.value },
          })
        }
        placeholder="Provide context, meeting notes, or requirement background..."
      />
    </PMNodeShell>
  );
}
