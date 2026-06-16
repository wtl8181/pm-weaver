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
