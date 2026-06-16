import { Handle, Position } from 'reactflow';
import { AlertTriangle, FileText, MessageSquare } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import type { PMNodeData, PMNodeType } from '../../types/workflow';
import { StatusPill } from '../ui/StatusPill';

const icons: Record<PMNodeType, typeof MessageSquare> = {
  message: MessageSquare,
  prd: FileText,
};

function previewText(data: PMNodeData) {
  if (data.errorMessage) return data.errorMessage;
  if (data.output) return data.output.slice(0, 220);
  if (data.nodeType === 'message' && 'rawText' in data.config && data.config.rawText) {
    return data.config.rawText.slice(0, 220);
  }
  return 'No output yet. Run the workflow to generate an artifact.';
}

export function PMNodeShell({ data, children }: PropsWithChildren<{ data: PMNodeData }>) {
  const Icon = icons[data.nodeType];

  return (
    <div className="w-[280px] rounded-lg border border-line bg-panel shadow-node">
      {data.nodeType !== 'message' && <Handle type="target" position={Position.Left} />}
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
          <StatusPill status={data.status} />
        </div>
      </div>
      <div className="space-y-3 p-4">
        {children}
        <div className="max-h-24 overflow-hidden rounded-md border border-line bg-canvas/70 p-3 text-xs leading-5 text-slate-300">
          {data.status === 'error' && <AlertTriangle className="mb-1 inline text-danger" size={14} />}
          <pre className="whitespace-pre-wrap break-words font-sans">{previewText(data)}</pre>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
