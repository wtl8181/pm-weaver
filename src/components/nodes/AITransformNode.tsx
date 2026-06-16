import type { NodeProps } from 'reactflow';
import type { PMNodeData } from '../../types/workflow';
import { PMNodeShell } from './PMNodeShell';

export function AITransformNode({ data }: NodeProps<PMNodeData>) {
  return (
    <PMNodeShell data={data}>
      <div className="rounded-md border border-line bg-canvas/70 p-3 text-xs leading-5 text-slate-400">
        Reads upstream context and generates structured Markdown with OpenAI.
      </div>
    </PMNodeShell>
  );
}
