import type { AISettings, WorkflowDocument } from '../../types/workflow';

const WORKFLOW_KEY = 'pm-weaver.workflow.v1';
const SETTINGS_KEY = 'pm-weaver.settings.v1';

export const defaultSettings: AISettings = {
  apiKey: '',
  model: 'gpt-5.1',
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
    return raw ? { ...defaultSettings, ...(JSON.parse(raw) as Partial<AISettings>) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AISettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
