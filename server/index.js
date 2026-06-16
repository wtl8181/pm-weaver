import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const vaultRoot = path.join(projectRoot, 'vault', 'PM Weaver');
const workflowPath = path.join(vaultRoot, 'Workflows', 'default.workflow.json');
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
      .slice(0, 80) || 'artifact'
  );
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function ensureVault() {
  await mkdir(path.dirname(workflowPath), { recursive: true });
  await mkdir(artifactsRoot, { recursive: true });
}

function artifactMarkdown({ content, label, nodeId, nodeType, workflowId }) {
  return `---\npm_weaver_type: ${nodeType ?? 'artifact'}\nworkflow_id: ${workflowId ?? 'default'}\nnode_id: ${nodeId ?? ''}\nnode_label: ${JSON.stringify(label ?? 'Artifact')}\ncreated_at: ${new Date().toISOString()}\n---\n\n${content ?? ''}\n`;
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'OPTIONS') {
      sendJson(response, 200, { ok: true });
      return;
    }

    const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { ok: true, vaultRoot });
      return;
    }

    if (url.pathname === '/api/vault/workflow') {
      await ensureVault();

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
        await writeFile(workflowPath, `${JSON.stringify(workflow, null, 2)}\n`, 'utf8');
        sendJson(response, 200, { ok: true, path: workflowPath });
        return;
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/vault/artifacts') {
      await ensureVault();
      const artifact = await readJsonBody(request);
      const baseName = slugify(artifact.fileName ?? artifact.label ?? artifact.nodeId ?? 'artifact').replace(/-md$/, '');
      const filePath = path.join(artifactsRoot, `${baseName}.md`);
      await writeFile(filePath, artifactMarkdown(artifact), 'utf8');
      sendJson(response, 200, { ok: true, path: filePath });
      return;
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
