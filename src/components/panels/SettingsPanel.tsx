import { KeyRound, X } from 'lucide-react';
import { useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { Button } from '../ui/Button';

export function SettingsPanel() {
  const settings = useWorkflowStore((state) => state.settings);
  const updateSettings = useWorkflowStore((state) => state.updateSettings);
  const setSettingsOpen = useWorkflowStore((state) => state.setSettingsOpen);
  const [draft, setDraft] = useState(settings);

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="h-full w-[420px] border-l border-line bg-panel shadow-node">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <KeyRound className="text-accent" size={18} />
            <div>
              <div className="text-sm font-semibold text-slate-100">Settings</div>
              <div className="text-xs text-slate-500">Stored locally in this browser.</div>
            </div>
          </div>
          <Button className="h-8 w-8 px-0" onClick={() => setSettingsOpen(false)}>
            <X size={15} />
          </Button>
        </div>
        <div className="space-y-5 p-5">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI Provider</span>
            <select
              className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm text-slate-100 outline-none focus:border-accent"
              value={draft.provider}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  provider: event.target.value as 'hermesCli' | 'localHttp' | 'openai',
                  model: event.target.value === 'openai' ? draft.model || 'gpt-5.1' : draft.model,
                })
              }
            >
              <option value="hermesCli">Hermes CLI</option>
              <option value="localHttp">Local HTTP</option>
              <option value="openai">OpenAI</option>
            </select>
          </label>

          {draft.provider === 'openai' && (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">OpenAI API Key</span>
              <input
                type="password"
                className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
                value={draft.apiKey}
                onChange={(event) => setDraft({ ...draft, apiKey: event.target.value })}
                placeholder="sk-..."
              />
            </label>
          )}

          {draft.provider === 'hermesCli' && (
            <div className="rounded-md border border-line bg-canvas/70 p-3 text-xs leading-5 text-slate-400">
              Uses your installed Hermes CLI through <code>hermes -z</code>. No API key or local HTTP server is required.
            </div>
          )}

          {draft.provider === 'localHttp' && (
            <div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Local Hermes Endpoint</span>
                <input
                  className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
                  value={draft.localEndpoint}
                  onChange={(event) => setDraft({ ...draft, localEndpoint: event.target.value })}
                  placeholder="http://127.0.0.1:11434/api/generate"
                />
              </label>
              <div className="mt-2 rounded-md border border-line bg-canvas/70 p-3 text-xs leading-5 text-slate-400">
                Supports Ollama `/api/generate`, OpenAI-compatible `/v1/chat/completions`, and llama.cpp `/completion` endpoints.
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {draft.provider === 'openai' ? 'OpenAI Model' : 'Model Override'}
            </span>
            <input
              className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
              value={draft.model}
              onChange={(event) => setDraft({ ...draft, model: event.target.value })}
              placeholder={draft.provider === 'openai' ? 'gpt-5.1' : 'Optional, e.g. openrouter/auto'}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Temperature</span>
            <input
              type="number"
              min={0}
              max={2}
              step={0.1}
              className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
              value={draft.temperature}
              onChange={(event) => setDraft({ ...draft, temperature: Number(event.target.value) })}
            />
          </label>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              updateSettings(draft);
              setSettingsOpen(false);
            }}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
