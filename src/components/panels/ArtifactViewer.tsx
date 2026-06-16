import { Copy, Download, PanelRightClose } from 'lucide-react';
import { useMemo } from 'react';
import type { MarkdownExportConfig } from '../../types/workflow';
import { copyMarkdown, downloadMarkdown } from '../../lib/export/markdown';
import { useWorkflowStore } from '../../store/workflowStore';
import { Button } from '../ui/Button';
import { StatusPill } from '../ui/StatusPill';

export function ArtifactViewer() {
  const nodes = useWorkflowStore((state) => state.nodes);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const setArtifactOpen = useWorkflowStore((state) => state.setArtifactOpen);
  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId), [nodes, selectedNodeId]);

  const output = selectedNode?.data.output ?? '';
  const exportConfig = selectedNode?.data.nodeType === 'markdownExport' ? (selectedNode.data.config as MarkdownExportConfig) : undefined;

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-line bg-panel">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-100">
            {selectedNode ? selectedNode.data.label : 'Artifact Viewer'}
          </div>
          <div className="mt-1 text-xs text-slate-500">{selectedNode ? selectedNode.id : 'Select a node to inspect output.'}</div>
        </div>
        <Button className="h-8 w-8 px-0" onClick={() => setArtifactOpen(false)} title="Close output panel">
          <PanelRightClose size={15} />
        </Button>
      </div>

      {selectedNode ? (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <StatusPill status={selectedNode.data.status} />
            <div className="flex gap-2">
              <Button className="h-8 px-2" disabled={!output} onClick={() => void copyMarkdown(output)}>
                <Copy size={14} />
              </Button>
              <Button
                className="h-8 px-2"
                disabled={!output}
                onClick={() => downloadMarkdown(exportConfig?.fileName ?? `${selectedNode.data.label}.md`, output)}
              >
                <Download size={14} />
              </Button>
            </div>
          </div>
          {selectedNode.data.errorMessage && (
            <div className="border-b border-danger/30 bg-danger/10 px-5 py-3 text-sm text-red-200">{selectedNode.data.errorMessage}</div>
          )}
          <div className="border-b border-line px-5 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Input Snapshot</div>
            <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-canvas p-3 text-xs leading-5 text-slate-400">
              {selectedNode.data.inputSnapshot || 'No upstream input captured yet.'}
            </pre>
          </div>
          <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words p-5 text-sm leading-6 text-slate-200">
            {output || 'No output yet.'}
          </pre>
        </>
      ) : (
        <div className="p-5 text-sm leading-6 text-slate-400">Select any node to view its full output, input snapshot, and errors.</div>
      )}
    </aside>
  );
}
