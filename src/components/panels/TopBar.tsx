import { ArrowLeft, PanelRightOpen, Play, Save, Settings, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { Button } from '../ui/Button';

export function TopBar() {
  const currentTask = useWorkflowStore((state) => state.currentTask);
  const setSettingsOpen = useWorkflowStore((state) => state.setSettingsOpen);
  const setArtifactOpen = useWorkflowStore((state) => state.setArtifactOpen);
  const deleteSelectedNode = useWorkflowStore((state) => state.deleteSelectedNode);
  const closeTask = useWorkflowStore((state) => state.closeTask);
  const save = useWorkflowStore((state) => state.save);
  const runSelectedNode = useWorkflowStore((state) => state.runSelectedNode);
  const lastRunError = useWorkflowStore((state) => state.lastRunError);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const nodes = useWorkflowStore((state) => state.nodes);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const isContext = selectedNode?.data.nodeType === 'context';
  const canRun = selectedNode && !isContext && selectedNodeId;

  return (
    <header className="absolute left-4 right-4 top-4 z-10 flex items-start justify-between gap-4">
      <div>
        <div className="rounded-lg border border-line bg-panel/95 px-4 py-3 shadow-node backdrop-blur">
          <div className="text-sm font-semibold text-slate-100">{currentTask?.name ?? 'PM Weaver'}</div>
          <div className="text-xs text-slate-500">Task canvas: context to PRD</div>
        </div>
        {lastRunError && <div className="mt-2 rounded-md border border-danger/30 bg-danger/15 px-4 py-2 text-sm text-red-200">{lastRunError}</div>}
      </div>
      <div className="flex gap-2 rounded-lg border border-line bg-panel/95 p-2 shadow-node backdrop-blur">
        <Button onClick={closeTask} title="Back to tasks">
          <ArrowLeft size={15} />
        </Button>
        <Button onClick={deleteSelectedNode} title="Delete selected node">
          <Trash2 size={15} />
        </Button>
        <Button onClick={save} title="Save workflow">
          <Save size={15} />
        </Button>
        <Button onClick={() => setArtifactOpen(true)} title="Show output panel">
          <PanelRightOpen size={15} />
        </Button>
        <Button onClick={() => setSettingsOpen(true)}>
          <Settings size={15} />
          Settings
        </Button>
        {canRun && (
          <Button variant="primary" onClick={() => void runSelectedNode()}>
            <Play size={15} />
            Run
          </Button>
        )}
      </div>
    </header>
  );
}
