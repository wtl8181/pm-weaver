import type { DingMeetingConfig, TeamupConfig } from '../../types/workflow';

interface ActionResponse {
  markdown?: string;
  url?: string;
  error?: string;
}

export interface TeamupSource {
  title?: string;
  content?: string;
}

function resolvedTeamupTicket(config: TeamupConfig, upstream: string, source?: TeamupSource) {
  const title = source?.title?.trim() || config.title;
  const description = source?.content?.trim() || config.description;

  return {
    title,
    description,
    upstream: source?.content?.trim() || upstream,
  };
}

export function renderTeamupTicket(config: TeamupConfig, upstream: string, source?: TeamupSource) {
  const ticket = resolvedTeamupTicket(config, upstream, source);

  return `# TEAMUP - ${ticket.title}

## Issue Type

${config.template || 'N/A'}

## Product Line

${config.productLine || '微牛OMNI'}

## Version

${config.version || '产品待规划版本'}

## Owner

${config.owner || 'TBD'}

## Priority

${config.priority || 'TBD'}

## Description

${ticket.description || 'TBD'}

## Upstream Context

${ticket.upstream || 'N/A'}
`;
}

export async function runTeamup(config: TeamupConfig, upstream: string, source?: TeamupSource) {
  if (!source?.content?.trim()) {
    throw new Error('TEAMUP requires upstream PRD.');
  }

  const ticket = resolvedTeamupTicket(config, upstream, source);
  if (!ticket.title.trim()) {
    throw new Error('TEAMUP requires upstream PRD title.');
  }

  const response = await fetch('/api/actions/teamup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...config, ...ticket }),
  });
  const data = (await response.json()) as ActionResponse;

  if (!response.ok || !data.markdown) {
    throw new Error(data.error ?? 'Failed to create TEAMUP artifact.');
  }

  return data.url || data.markdown;
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
