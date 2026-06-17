import type { DingMeetingConfig, TeamupConfig } from '../../types/workflow';

interface ActionResponse {
  markdown?: string;
  error?: string;
}

export function renderTeamupTicket(config: TeamupConfig, upstream: string) {
  return `# TEAMUP - ${config.title}

## Template

${config.template || 'N/A'}

## Owner

${config.owner || 'TBD'}

## Priority

${config.priority || 'TBD'}

## Description

${config.description || 'TBD'}

## Upstream Context

${upstream || 'N/A'}
`;
}

export async function runTeamup(config: TeamupConfig, upstream: string) {
  const response = await fetch('/api/actions/teamup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...config, upstream }),
  });
  const data = (await response.json()) as ActionResponse;

  if (!response.ok || !data.markdown) {
    throw new Error(data.error ?? 'Failed to create TEAMUP artifact.');
  }

  return data.markdown;
}

export async function runDingMeeting(config: DingMeetingConfig, upstream: string) {
  const response = await fetch('/api/actions/ding-meeting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...config, upstream }),
  });
  const data = (await response.json()) as ActionResponse;

  if (!response.ok || !data.markdown) {
    throw new Error(data.error ?? 'Failed to create Ding Meeting artifact.');
  }

  return data.markdown;
}
