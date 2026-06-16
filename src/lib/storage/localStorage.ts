import type { AISettings, WorkflowDocument } from '../../types/workflow';

const WORKFLOW_KEY = 'pm-weaver.workflow.v1';
const SETTINGS_KEY = 'pm-weaver.settings.v1';

export const defaultSettings: AISettings = {
  provider: 'hermesCli',
  apiKey: '',
  model: '',
  localEndpoint: 'http://127.0.0.1:11434/api/generate',
  temperature: 0.2,
};

export function loadWorkflow(): WorkflowDocument | null {
  try {
    const raw = localStorage.getItem(WORKFLOW_KEY);
    return raw ? (JSON.parse(raw) as WorkflowDocument) : null;
  } catch {
    return null;
  }
}

export function saveWorkflow(workflow: WorkflowDocument) {
  localStorage.setItem(WORKFLOW_KEY, JSON.stringify(workflow));
}

export function loadSettings(): AISettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;

    const parsed = JSON.parse(raw) as Partial<AISettings>;
    const provider = parsed.provider as string | undefined;
    if (!provider || provider === 'hermes') {
      return {
        ...defaultSettings,
        apiKey: parsed.apiKey ?? '',
        temperature: parsed.temperature ?? defaultSettings.temperature,
      };
    }

    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AISettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
