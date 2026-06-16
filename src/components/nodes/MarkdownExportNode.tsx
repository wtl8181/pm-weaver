import { Copy, Download } from 'lucide-react';
import type { NodeProps } from 'reactflow';
import type { MarkdownExportConfig, PMNodeData } from '../../types/workflow';
import { downloadMarkdown, copyMarkdown } from '../../lib/export/markdown';
import { useWorkflowStore } from '../../store/workflowStore';
import { Button } from '../ui/Button';
import { PMNodeShell } from './PMNodeShell';

export function MarkdownExportNode({ id, data }: NodeProps<PMNodeData>) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const config = data.config as MarkdownExportConfig;

  return (
    <PMNodeShell data={data}>
      <input
        className="nodrag w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
        value={config.fileName}
        onChange={(event) => updateNodeData(id, { config: { ...config, fileName: event.target.value } })}
        placeholder="file-name.md"
      />
      <div className="nodrag grid grid-cols-2 gap-2">
        <Button disabled={!data.output} onClick={() => void copyMarkdown(data.output ?? '')}>
          <Copy size={15} />
          Copy
        </Button>
        <Button disabled={!data.output} onClick={() => downloadMarkdown(config.fileName, data.output ?? '')}>
          <Download size={15} />
          Download
        </Button>
      </div>
    </PMNodeShell>
  );
}
