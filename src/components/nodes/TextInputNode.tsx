import type { NodeProps } from 'reactflow';
import type { MessageConfig, PMNodeData } from '../../types/workflow';
import { useWorkflowStore } from '../../store/workflowStore';
import { PMNodeShell } from './PMNodeShell';

export function TextInputNode({ id, data }: NodeProps<PMNodeData>) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const config = data.config as MessageConfig;

  return (
    <PMNodeShell data={data}>
      <input
        className="nodrag w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
        value={config.title}
        onChange={(event) =>
          updateNodeData(id, {
            config: { ...config, title: event.target.value },
          })
        }
        placeholder="Title"
      />
      <textarea
        className="nodrag h-28 w-full resize-none rounded-md border border-line bg-canvas px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
        value={config.rawText}
        onChange={(event) =>
          updateNodeData(id, {
            config: { ...config, rawText: event.target.value },
          })
        }
        placeholder="Paste raw message, meeting notes, or requirement context..."
      />
    </PMNodeShell>
  );
}
