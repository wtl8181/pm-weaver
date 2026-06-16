import { clsx } from 'clsx';
import type { NodeStatus } from '../../types/workflow';

export function StatusPill({ status }: { status: NodeStatus }) {
  return (
    <span
      className={clsx(
        'rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        status === 'idle' && 'bg-slate-700 text-slate-200',
        status === 'running' && 'bg-amber/15 text-amber',
        status === 'success' && 'bg-accent/15 text-accent',
        status === 'error' && 'bg-danger/15 text-red-200',
      )}
    >
      {status}
    </span>
  );
}
