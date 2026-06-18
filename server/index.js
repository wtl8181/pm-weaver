import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const vaultRoot = path.join(projectRoot, 'vault', 'PM Weaver');
const tasksRoot = path.join(vaultRoot, 'Tasks');
const workflowsRoot = path.join(vaultRoot, 'Workflows');
const artifactsRoot = path.join(vaultRoot, 'Artifacts');
const port = Number(process.env.PM_WEAVER_API_PORT ?? 8787);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(payload));
}

function slugify(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'task'
  );
}

function taskMarkdown(task) {
  return `---\npm_weaver_type: task\ntask_id: ${task.id}\ntask_name: ${JSON.stringify(task.name)}\ncreated_at: ${task.createdAt}\nupdated_at: ${task.updatedAt}\n---\n\n# ${task.name}\n\n`;
}

function nodeMarkdown({ content, label, nodeId, nodeType, taskId }) {
  return `---\npm_weaver_type: ${nodeType}\ntask_id: ${taskId}\nnode_id: ${nodeId}\nnode_label: ${JSON.stringify(label)}\nupdated_at: ${new Date().toISOString()}\n---\n\n${content ?? ''}\n`;
}

function dingMeetingMarkdown(body, result) {
  const created = result ? 'created' : 'draft';
  return `# Ding Meeting - ${body.title}

## Status

${created}

## Time

- Start: ${body.start}
- End: ${body.end}

## Attendees

${body.attendees || 'N/A'}

## Open DingTalk IDs

${body.openDingTalkIds || 'N/A'}

## Location

${body.location || 'N/A'}

## Description

${body.description || 'N/A'}

## Upstream Context

${body.upstream || 'N/A'}

${result ? `## DingTalk Result\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n` : ''}
`;
}

function teamupMarkdown(body, result) {
  const status = result ? 'created-via-hermes' : 'draft';
  return `# TEAMUP - ${body.title}

## Status

${status}

## Issue Type

${body.template || 'N/A'}

## Product Line

${body.productLine || '微牛OMNI'}

## Version

${body.version || '产品待规划版本'}

## Owner

${body.owner || 'TBD'}

## Priority

${body.priority || 'TBD'}

## Description

${body.description || 'TBD'}

## Upstream Context

${body.upstream || 'N/A'}

${body.url ? `## Omni Link\n\n${body.url}\n\n` : ''}
${result ? `## Hermes Result\n\n${result}\n` : ''}
`;
}

function extractFirstUrl(text) {
  const match = String(text ?? '').match(/https?:\/\/[^\s)\]}>'"]+/);
  return match?.[0] ?? '';
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith('---\n')) return {};
  const end = markdown.indexOf('\n---', 4);
  if (end === -1) return {};

  return markdown
    .slice(4, end)
    .split('\n')
    .reduce((accumulator, line) => {
      const separator = line.indexOf(':');
      if (separator === -1) return accumulator;
      const key = line.slice(0, separator).trim();
      const rawValue = line.slice(separator + 1).trim();
      try {
        accumulator[key] = JSON.parse(rawValue);
      } catch {
        accumulator[key] = rawValue;
      }
      return accumulator;
    }, {});
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function callLocalAI(body) {
  if (body.provider === 'hermesCli') {
    return callHermesCli(body);
  }

  const endpoint = String(body.endpoint ?? '').trim();
  const model = String(body.model ?? '').trim();

  if (!endpoint) {
    throw new Error('Local Hermes endpoint is required.');
  }

  const temperature = Number(body.temperature ?? 0.2);
  const prompt = `${body.systemPrompt ?? ''}\n\n${body.userPrompt ?? ''}`.trim();
  const isOpenAICompatible = endpoint.includes('/v1/chat/completions');
  const isLlamaCppCompletion = endpoint.endsWith('/completion');
  const requestBody = isOpenAICompatible
    ? {
        model,
        temperature,
        messages: [
          { role: 'system', content: body.systemPrompt ?? '' },
          { role: 'user', content: body.userPrompt ?? '' },
        ],
      }
    : isLlamaCppCompletion
      ? {
          prompt,
          temperature,
          stream: false,
        }
      : {
          model,
          prompt,
          stream: false,
          options: {
            temperature,
          },
        };

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  } catch {
    throw new Error(
      `Local Hermes endpoint is not reachable: ${endpoint}. Start your local model server or update the endpoint in Settings.`,
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : data?.error?.message;
    throw new Error(message ?? `Local Hermes request failed with ${response.status} at ${endpoint}`);
  }

  return (
    data.response ??
    data.output ??
    data.text ??
    data.content ??
    data.message?.content ??
    data.choices?.[0]?.message?.content ??
    data.choices?.[0]?.text ??
    ''
  );
}

function callHermesCli(body) {
  const prompt = `${body.systemPrompt ?? ''}\n\n${body.userPrompt ?? ''}`.trim();
  const args = ['-z', prompt, '--ignore-rules', '--toolsets', ''];
  const model = String(body.model ?? '').trim();

  if (model) {
    args.splice(0, 0, '--model', model);
  }

  return new Promise((resolve, reject) => {
    const child = spawn('hermes', args, {
      cwd: projectRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Hermes CLI timed out after 120 seconds.'));
    }, 120000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', () => {
      clearTimeout(timeout);
      reject(new Error('Hermes CLI is not available on PATH. Install Hermes or choose another provider in Settings.'));
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      reject(new Error(stderr.trim() || `Hermes CLI exited with code ${code}.`));
    });
  });
}

function callHermesAgent(prompt) {
  const args = ['-z', prompt, '--ignore-rules'];

  return new Promise((resolve, reject) => {
    const child = spawn('hermes', args, {
      cwd: projectRoot,
      env: { ...process.env, HERMES_ACCEPT_HOOKS: '1', NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      const details = [stdout.trim() ? `stdout:\n${stdout.trim()}` : '', stderr.trim() ? `stderr:\n${stderr.trim()}` : '']
        .filter(Boolean)
        .join('\n\n');
      reject(new Error(`Hermes Agent timed out after 180 seconds.${details ? `\n\n${details}` : ''}`));
    }, 180000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', () => {
      clearTimeout(timeout);
      reject(new Error('Hermes CLI is not available on PATH.'));
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      reject(new Error(stderr.trim() || `Hermes Agent exited with code ${code}.`));
    });
  });
}

async function createTeamup(body) {
  const title = String(body.title ?? '').trim();
  if (!title) {
    throw new Error('TEAMUP requires title.');
  }

  if (!body.createInTeamup) {
    return { markdown: teamupMarkdown(body) };
  }

  const prompt = `You are acting as an automation agent for PM Weaver.

Goal: create a real Webull Teamup issue/ticket using the available Webull Teamup MCP tools.

Use the Teamup MCP tools that Hermes has available. Do not browse, search broadly, or repeatedly call list tools.
Use these known defaults directly unless the input explicitly overrides them:
- product_id: 3
- product name: 微牛Omni / 微牛OMNI
- project_id_list: [10503]
- project/version name: OMNI-产品待规划版本
- issue_type: 0
- market: [10907]
- broker_review: [11001]
- affiliate_communication: 0
- priority mapping: P0=10001, P1=10002, P2=10003, P3=10004, P4=10005

If assignee or test_owner is missing, call get_user_setting once and use data.userId for both fields. If create_issue fails because a required field is missing, return the exact error and stop. Do not retry the same failing tool call more than once.

Ticket data:
- Title: ${title}
- Product Line: ${body.productLine || '微牛OMNI'}
- Version: ${body.version || '产品待规划版本'}
- Issue Type: ${body.template || 'N/A'}
- Owner: ${body.owner || 'TBD'}
- Priority: ${body.priority || 'TBD'}
- Description: ${body.description || 'TBD'}

Upstream context:
${body.upstream || 'N/A'}

After attempting creation, return Markdown with:
- Creation status
- Teamup issue key/id/url if created. Put the Omni or Teamup URL on its own line.
- Product/component/version/labels used
- Any missing fields or follow-up needed`;

  const result = await callHermesAgent(prompt);
  const url = extractFirstUrl(result);
  return { markdown: teamupMarkdown({ ...body, url }, result), result, url };
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', () => {
      reject(new Error(`${command} is not available on PATH.`));
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(stderr.trim() || `${command} exited with code ${code}.`));
    });
  });
}

async function createDingMeeting(body) {
  const title = String(body.title ?? '').trim();
  const start = String(body.start ?? '').trim();
  const end = String(body.end ?? '').trim();

  if (!title || !start || !end) {
    throw new Error('Ding Meeting requires title, start, and end.');
  }

  if (!body.createInDingTalk) {
    return { markdown: dingMeetingMarkdown(body) };
  }

  const args = ['calendar', 'event', 'create', '--title', title, '--start', start, '--end', end, '--format', 'json'];
  const attendees = String(body.attendees ?? '').trim();
  const openDingTalkIds = String(body.openDingTalkIds ?? '').trim();
  const location = String(body.location ?? '').trim();
  const description = String(body.description ?? '').trim();

  if (attendees) args.push('--attendees', attendees);
  if (openDingTalkIds) args.push('--open-dingtalk-ids', openDingTalkIds);
  if (location) args.push('--location', location);
  if (description) args.push('--desc', description);

  const { stdout } = await runCommand('dws', args);
  const result = JSON.parse(stdout || '{}');
  return { markdown: dingMeetingMarkdown(body, result), result };
}

async function ensureVault() {
  await mkdir(tasksRoot, { recursive: true });
  await mkdir(workflowsRoot, { recursive: true });
  await mkdir(artifactsRoot, { recursive: true });
}

function safeTaskId(taskId) {
  const safe = path.basename(taskId);
  if (!safe || safe !== taskId) {
    throw new Error('Invalid task id.');
  }
  return safe;
}

async function listTasks() {
  await ensureVault();
  const files = await readdir(tasksRoot);
  const tasks = await Promise.all(
    files
      .filter((file) => file.endsWith('.md'))
      .map(async (file) => {
        const fullPath = path.join(tasksRoot, file);
        const markdown = await readFile(fullPath, 'utf8');
        const frontmatter = parseFrontmatter(markdown);
        return {
          id: String(frontmatter.task_id ?? file.replace(/\.md$/, '')),
          name: String(frontmatter.task_name ?? file.replace(/\.md$/, '')),
          createdAt: frontmatter.created_at ? String(frontmatter.created_at) : undefined,
          updatedAt: frontmatter.updated_at ? String(frontmatter.updated_at) : undefined,
          path: fullPath,
        };
      }),
  );

  return tasks.sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'OPTIONS') {
      sendJson(response, 200, { ok: true });
      return;
    }

    const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
    const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { ok: true, vaultRoot });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/ai/local-generate') {
      const body = await readJsonBody(request);
      const text = await callLocalAI(body);
      sendJson(response, 200, { text });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/actions/ding-meeting') {
      const body = await readJsonBody(request);
      const result = await createDingMeeting(body);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/actions/teamup') {
      const body = await readJsonBody(request);
      const result = await createTeamup(body);
      sendJson(response, 200, result);
      return;
    }

    if (parts.join('/') === 'api/vault/tasks') {
      if (request.method === 'GET') {
        sendJson(response, 200, { tasks: await listTasks(), vaultRoot });
        return;
      }

      if (request.method === 'POST') {
        await ensureVault();
        const body = await readJsonBody(request);
        const name = String(body.name ?? '').trim();
        if (!name) {
          sendJson(response, 400, { error: 'Task name is required.' });
          return;
        }

        const now = new Date().toISOString();
        const id = `${Date.now()}-${slugify(name)}`;
        const task = { id, name, createdAt: now, updatedAt: now };
        await writeFile(path.join(tasksRoot, `${id}.md`), taskMarkdown(task), 'utf8');
        sendJson(response, 201, { task: { ...task, path: path.join(tasksRoot, `${id}.md`) } });
        return;
      }
    }

    if (parts[0] === 'api' && parts[1] === 'vault' && parts[2] === 'tasks' && parts[3]) {
      await ensureVault();
      const taskId = safeTaskId(parts[3]);

      if (parts[4] === 'workflow') {
        const workflowPath = path.join(workflowsRoot, `${taskId}.workflow.json`);

        if (request.method === 'GET') {
          try {
            const workflow = JSON.parse(await readFile(workflowPath, 'utf8'));
            sendJson(response, 200, { workflow, path: workflowPath });
          } catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
              sendJson(response, 200, { workflow: null, path: workflowPath });
              return;
            }
            throw error;
          }
          return;
        }

        if (request.method === 'PUT') {
          const workflow = await readJsonBody(request);
          await writeFile(workflowPath, `${JSON.stringify({ ...workflow, taskId }, null, 2)}\n`, 'utf8');
          sendJson(response, 200, { ok: true, path: workflowPath });
          return;
        }
      }

      if (parts[4] === 'nodes' && request.method === 'POST') {
        const node = await readJsonBody(request);
        const nodeId = String(node.nodeId ?? 'node');
        const nodeType = String(node.nodeType ?? 'node');
        const baseName = `${taskId}-${nodeType}-${slugify(node.label ?? nodeId)}`;
        const artifactPath = path.join(artifactsRoot, `${baseName}.md`);
        await writeFile(artifactPath, nodeMarkdown({ ...node, taskId }), 'utf8');
        sendJson(response, 200, { ok: true, path: artifactPath });
        return;
      }
    }

    sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Unknown server error',
    });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`PM Weaver local API listening on http://127.0.0.1:${port}`);
  console.log(`Vault root: ${vaultRoot}`);
});
