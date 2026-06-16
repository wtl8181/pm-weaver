import type { LocalAIRequest } from '../../types/workflow';

interface LocalAIResult {
  text?: string;
  error?: string;
}

export async function callLocalHermes(request: LocalAIRequest): Promise<string> {
  if (!request.endpoint.trim()) {
    throw new Error('Local Hermes endpoint is missing. Add it in Settings.');
  }

  const response = await fetch('/api/ai/local-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const data = (await response.json()) as LocalAIResult;

  if (!response.ok) {
    throw new Error(data.error ?? `Local Hermes request failed with ${response.status}`);
  }

  if (!data.text?.trim()) {
    throw new Error('Local Hermes returned an empty response.');
  }

  return data.text.trim();
}
