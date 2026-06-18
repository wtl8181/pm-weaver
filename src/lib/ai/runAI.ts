import { callOpenAI } from './openaiClient';
import { callLocalHermes } from './localHermesClient';
import { getPromptForNode } from './prompts';
import type { AISettings, PMNodeType } from '../../types/workflow';

export async function runAINode(type: PMNodeType, upstream: string, settings: AISettings, promptHint?: string): Promise<string> {
  const prompt = getPromptForNode(type, upstream, promptHint);

  if (settings.provider === 'hermesCli' || settings.provider === 'localHttp') {
    return callLocalHermes({
      provider: settings.provider,
      endpoint: settings.localEndpoint,
      model: settings.model,
      temperature: settings.temperature,
      ...prompt,
    });
  }

  return callOpenAI({
    apiKey: settings.apiKey,
    model: settings.model,
    temperature: settings.temperature,
    ...prompt,
  });
}
