import type { NodeProps } from 'reactflow';
import type { PMNodeData, PrdConfig } from '../../types/workflow';
import { PMNodeShell } from './PMNodeShell';
import { useWorkflowStore } from '../../store/workflowStore';

export function AITransformNode({ id, data, selected }: NodeProps<PMNodeData>) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const config = data.config as PrdConfig;
  const title = config.title === 'PRD Draft' ? '' : config.title;
  const content = data.output || config.content;

  return (
    <PMNodeShell data={data} selected={selected}>
      {/* Title — read only, filled by agent */}
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Title</span>
        <div className="flex min-h-[38px] items-center rounded-md border border-line bg-canvas px-3 py-2 text-sm text-slate-100">
          {title || <span className="text-slate-500">PRD title (filled after Run)</span>}
        </div>
      </label>

      {/* Content — read only, filled by agent */}
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Content</span>
        <div className="h-28 overflow-auto rounded-md border border-line bg-canvas px-3 py-2 text-sm text-slate-100">
          {content || <span className="text-slate-500">Requirement content (filled after Run)</span>}
        </div>
      </label>

      {/* Prompt hint — editable */}
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Prompt Hint</span>
        <textarea
          className="nodrag h-14 w-full resize-none rounded-md border border-line bg-canvas px-3 py-2 text-xs text-slate-400 outline-none focus:border-accent"
          defaultValue={config.promptHint}
          onChange={(e) => updateNodeData(id, { config: { ...config, promptHint: e.target.value } })}
          placeholder="Optional guidance for the AI writing"
        />
      </label>
    </PMNodeShell>
  );
}
