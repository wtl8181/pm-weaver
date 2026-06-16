import { useEffect, useState } from 'react';
import { ArrowRight, FilePlus2 } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { Button } from '../ui/Button';

export function TaskHome() {
  const [taskName, setTaskName] = useState('');
  const tasks = useWorkflowStore((state) => state.tasks);
  const taskError = useWorkflowStore((state) => state.taskError);
  const loadTasks = useWorkflowStore((state) => state.loadTasks);
  const createTask = useWorkflowStore((state) => state.createTask);
  const openTask = useWorkflowStore((state) => state.openTask);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function handleCreate() {
    if (!taskName.trim()) return;
    await createTask(taskName);
    setTaskName('');
  }

  return (
    <main className="flex h-full bg-canvas text-slate-100">
      <section className="mx-auto flex w-full max-w-5xl flex-col px-8 py-10">
        <div className="mb-8">
          <div className="text-sm font-semibold uppercase tracking-wide text-accent">PM Weaver</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-50">Tasks</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Create a task to start a focused PM workflow. Each task is saved as a Markdown file inside the project-local Obsidian vault.
          </p>
        </div>

        <div className="rounded-lg border border-line bg-panel p-4">
          <div className="flex gap-3">
            <input
              className="h-10 min-w-0 flex-1 rounded-md border border-line bg-canvas px-3 text-sm text-slate-100 outline-none focus:border-accent"
              value={taskName}
              onChange={(event) => setTaskName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleCreate();
                }
              }}
              placeholder="Task name"
            />
            <Button variant="primary" onClick={() => void handleCreate()} disabled={!taskName.trim()}>
              <FilePlus2 size={16} />
              New Task
            </Button>
          </div>
          {taskError && <div className="mt-3 rounded-md border border-danger/30 bg-danger/15 px-3 py-2 text-sm text-red-200">{taskError}</div>}
        </div>

        <div className="mt-8 grid gap-3">
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-panel/50 p-6 text-sm text-slate-400">
              No tasks yet. Create one to enter the canvas.
            </div>
          ) : (
            tasks.map((task) => (
              <button
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-line bg-panel p-4 text-left transition hover:border-accent/70 hover:bg-elevated"
                onClick={() => void openTask(task)}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-100">{task.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{task.path ?? task.id}</div>
                </div>
                <ArrowRight className="text-slate-500" size={17} />
              </button>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
