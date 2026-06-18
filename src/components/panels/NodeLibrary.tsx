import { CalendarPlus, FileText, MessageSquare, Plus, Ticket } from 'lucide-react';
import { nodeDefinitions } from '../../lib/workflow/definitions';
import type { PMNodeType } from '../../types/workflow';

const nodeIcons: Record<PMNodeType, typeof MessageSquare> = {
  context: MessageSquare,
  prd: FileText,
  teamup: Ticket,
  dingMeeting: CalendarPlus,
};

export function NodeLibrary() {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-line bg-panel">
      <div className="border-b border-line px-5 py-4">
        <div className="text-sm font-semibold text-slate-100">Node Library</div>
        <div className="mt-1 text-xs text-slate-500">Add PM workflow blocks to the canvas.</div>
      </div>
      <div className="space-y-3 overflow-y-auto p-4">
        {nodeDefinitions.map((definition) => {
          const Icon = nodeIcons[definition.type];

          return (
            <div
              key={definition.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/pmweaver-node-type', definition.type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              className="group w-full cursor-grab rounded-lg border border-line bg-elevated p-3 text-left transition hover:border-accent/70 hover:bg-slate-800 active:cursor-grabbing"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-canvas text-slate-400 transition group-hover:border-accent/60 group-hover:text-accent">
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-100">{definition.label}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">{definition.description}</div>
                  </div>
                </div>
                <Plus className="mt-2 shrink-0 text-slate-500 group-hover:text-accent" size={16} />
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
