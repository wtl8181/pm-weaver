import type { AIRequest } from '../../types/workflow';

interface ResponsesAPIResult {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
}

export async function callOpenAI(request: AIRequest): Promise<string> {
  if (!request.apiKey.trim()) {
    throw new Error('OpenAI API Key is missing. Add it in Settings before running AI nodes.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${request.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model,
      temperature: request.temperature,
      input: [
        {
          role: 'system',
          content: request.systemPrompt,
        },
        {
          role: 'user',
          content: request.userPrompt,
        },
      ],
    }),
  });

  const data = (await response.json()) as ResponsesAPIResult;

  if (!response.ok) {
    throw new Error(data.error?.message ?? `OpenAI request failed with ${response.status}`);
  }

  if (data.output_text) {
    return data.output_text.trim();
  }

  const text = data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join('\n');

  if (!text) {
    throw new Error('OpenAI returned an empty response.');
  }

  return text.trim();
}
