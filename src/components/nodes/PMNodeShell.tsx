import { Handle, Position } from 'reactflow';
import { AlertTriangle, CalendarPlus, FileText, MessageSquare, Ticket } from 'lucide-react';
import { clsx } from 'clsx';
import type { PropsWithChildren } from 'react';
import type { PMNodeData, PMNodeType } from '../../types/workflow';
import { StatusPill } from '../ui/StatusPill';

const icons: Record<PMNodeType, typeof MessageSquare> = {
  context: MessageSquare,
  prd: FileText,
  teamup: Ticket,
  dingMeeting: CalendarPlus,
};

function previewText(data: PMNodeData) {
  if (data.errorMessage) return data.errorMessage;
  if (data.nodeType === 'context' && 'content' in data.config && data.config.content) {
    return data.config.content.slice(0, 220);
  }
  if (data.output) return data.output.slice(0, 220);
  if (data.nodeType === 'context') return 'Provide context here.';
  return 'No output yet. Run the workflow to generate an artifact.';
}

export function PMNodeShell({ data, selected = false, children }: PropsWithChildren<{ data: PMNodeData; selected?: boolean }>) {
  const Icon = icons[data.nodeType];

  return (
    <div
      className={clsx(
        'relative w-[280px] rounded-lg border bg-panel shadow-node transition',
        selected ? 'border-accent ring-2 ring-accent/35 shadow-[0_0_0_1px_rgba(61,214,166,0.35),0_18px_45px_rgba(0,0,0,0.42)]' : 'border-line',
      )}
    >
      {selected && <div className="absolute left-3 right-3 top-0 h-0.5 rounded-full bg-accent" />}
      {data.nodeType !== 'context' && <Handle type="target" position={Position.Left} />}
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-800 text-accent">
              <Icon size={17} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-100">{data.label}</div>
              <div className="text-[11px] text-slate-500">{data.nodeType}</div>
            </div>
          </div>
          {data.nodeType !== 'context' && <StatusPill status={data.status} />}
        </div>
      </div>
      <div className="space-y-3 p-4">
        {children}
        {data.nodeType !== 'context' && data.nodeType !== 'prd' && (
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Output</span>
            <div className="max-h-24 overflow-hidden rounded-md border border-line bg-canvas/70 p-3 text-xs leading-5 text-slate-300">
              {data.status === 'error' && <AlertTriangle className="mb-1 inline text-danger" size={14} />}
              <pre className="whitespace-pre-wrap break-words font-sans">{previewText(data)}</pre>
            </div>
          </label>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
