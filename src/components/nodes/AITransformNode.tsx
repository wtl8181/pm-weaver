import type { NodeProps } from 'reactflow';
import type { PMNodeData } from '../../types/workflow';
import { PMNodeShell } from './PMNodeShell';

export function AITransformNode({ data, selected }: NodeProps<PMNodeData>) {
  return (
    <PMNodeShell data={data} selected={selected}>
      <div className="rounded-md border border-line bg-canvas/70 p-3 text-xs leading-5 text-slate-400">
        Reads connected message context and generates PRD Markdown with the selected AI provider.
      </div>
    </PMNodeShell>
  );
}
