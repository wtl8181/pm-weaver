import { Plus } from 'lucide-react';
import { nodeDefinitions } from '../../lib/workflow/definitions';
import { useWorkflowStore } from '../../store/workflowStore';

export function NodeLibrary() {
  const addNode = useWorkflowStore((state) => state.addNode);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-line bg-panel">
      <div className="border-b border-line px-5 py-4">
        <div className="text-sm font-semibold text-slate-100">Node Library</div>
        <div className="mt-1 text-xs text-slate-500">Add PM workflow blocks to the canvas.</div>
      </div>
      <div className="space-y-3 overflow-y-auto p-4">
        {nodeDefinitions.map((definition) => (
          <button
            key={definition.type}
            className="group w-full rounded-lg border border-line bg-elevated p-3 text-left transition hover:border-accent/70 hover:bg-slate-800"
            onClick={() => addNode(definition.type)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-100">{definition.label}</div>
              <Plus className="text-slate-500 group-hover:text-accent" size={16} />
            </div>
            <div className="mt-2 text-xs leading-5 text-slate-400">{definition.description}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}
