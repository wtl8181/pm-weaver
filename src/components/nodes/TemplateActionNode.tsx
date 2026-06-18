import type { NodeProps } from 'reactflow';
import type { DingMeetingConfig, PMNodeData, TeamupConfig } from '../../types/workflow';
import { useWorkflowStore } from '../../store/workflowStore';
import { PMNodeShell } from './PMNodeShell';

function Field({
  label,
  value,
  placeholder,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {multiline ? (
        <textarea
          className="nodrag h-20 w-full resize-none rounded-md border border-line bg-canvas px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
          defaultValue={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="nodrag w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
          defaultValue={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

export function TemplateActionNode({ id, data, selected }: NodeProps<PMNodeData>) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  if (data.nodeType === 'teamup') {
    const config = data.config as TeamupConfig;
    const patch = (next: Partial<TeamupConfig>) => updateNodeData(id, { config: { ...config, ...next } });

    return (
      <PMNodeShell data={data} selected={selected}>
        <Field label="Product Line" value={config.productLine ?? '微牛OMNI'} onChange={(productLine) => patch({ productLine })} />
        <Field label="Version" value={config.version ?? '产品待规划版本'} onChange={(version) => patch({ version })} />
        <Field label="Issue Type" value={config.template} onChange={(template) => patch({ template })} placeholder="Requirement / Bug / Task" />
        <Field label="Owner" value={config.owner} onChange={(owner) => patch({ owner })} placeholder="Owner or team" />
        <Field label="Priority" value={config.priority} onChange={(priority) => patch({ priority })} placeholder="P0 / P1 / P2" />
        <label className="nodrag flex items-center gap-2 rounded-md border border-line bg-canvas/70 px-3 py-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(config.createInTeamup)}
            onChange={(event) => patch({ createInTeamup: event.target.checked })}
          />
          Create in TeamUP through Hermes on Run
        </label>
      </PMNodeShell>
    );
  }

  const config = data.config as DingMeetingConfig;
  const patch = (next: Partial<DingMeetingConfig>) => updateNodeData(id, { config: { ...config, ...next } });

  return (
    <PMNodeShell data={data} selected={selected}>
      <Field label="Title" value={config.title} onChange={(title) => patch({ title })} />
      <Field label="Start" value={config.start} onChange={(start) => patch({ start })} placeholder="2026-06-17T14:00:00+08:00" />
      <Field label="End" value={config.end} onChange={(end) => patch({ end })} placeholder="2026-06-17T15:00:00+08:00" />
      <Field label="Attendees" value={config.attendees} onChange={(attendees) => patch({ attendees })} placeholder="userId1,userId2" />
      <Field
        label="Open DingTalk IDs"
        value={config.openDingTalkIds}
        onChange={(openDingTalkIds) => patch({ openDingTalkIds })}
        placeholder="optional, comma separated"
      />
      <Field label="Location" value={config.location} onChange={(location) => patch({ location })} placeholder="optional" />
      <Field label="Description" value={config.description} onChange={(description) => patch({ description })} multiline />
      <label className="nodrag flex items-center gap-2 rounded-md border border-line bg-canvas/70 px-3 py-2 text-xs text-slate-300">
        <input
          type="checkbox"
          checked={config.createInDingTalk}
          onChange={(event) => patch({ createInDingTalk: event.target.checked })}
        />
        Create in DingTalk on Run
      </label>
    </PMNodeShell>
  );
}
