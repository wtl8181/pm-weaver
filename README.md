# PM Weaver

PM Weaver is a local-first workflow canvas for product managers. The MVP runs as a local full-stack app: a Vite browser UI plus a tiny Node file API that stores workflow data in a project-local Obsidian-compatible vault.

## Tech Stack

- Vite
- React
- TypeScript
- React Flow
- Tailwind CSS
- Zustand
- OpenAI Responses API via `fetch`
- Project-local Obsidian vault as file storage

## Getting Started

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173
```

The dev command starts:

- Web UI: `http://127.0.0.1:5173`
- Local file API: `http://127.0.0.1:8787`

## Basic Workflow

1. Open **Settings** and enter your OpenAI API key.
2. Keep the default model `gpt-5.1`, or enter another OpenAI model string.
3. Paste raw product context into a **Text Input** node.
4. Connect it to **Requirement Extractor**, **Open Questions**, or **PRD Generator** nodes.
5. Connect the final artifact to **Markdown Export**.
6. Click **Run**.
7. Select any node to inspect its input snapshot, full output, status, or error.
8. Use **Copy** or **Download** on the export node or right-side artifact viewer.

## Implemented Nodes

- **Text Input Node**: stores raw Slack, email, meeting notes, or requirement discussion text.
- **Requirement Extractor Node**: generates structured requirement Markdown.
- **Open Questions Node**: generates a Markdown table of questions, owners, reasons, and priorities.
- **PRD Generator Node**: generates a PRD draft with PM-focused sections.
- **Markdown Export Node**: previews, copies, and downloads generated Markdown.

## Data Storage

The project-local vault lives here:

```text
vault/PM Weaver/
```

You can open that folder directly as an Obsidian vault.

Runtime data is written by the local API:

```text
vault/PM Weaver/
  Workflows/
    default.workflow.json
  Artifacts/
    *.md
```

The browser also keeps a `localStorage` cache:

- Workflow graph: nodes, edges, selected node.
- Settings: OpenAI API key, model, temperature.

Generated workflow JSON and artifacts are ignored by git by default because they may contain private product context or AI-generated business documents. The vault scaffold and README are tracked.

There is no login, cloud sync, external database, or third-party integration in this first version.

## Project Structure

```text
src/
  app/
  components/
    canvas/
    nodes/
    panels/
    ui/
  lib/
    ai/
    export/
    storage/
    workflow/
  store/
  types/
  main.tsx
server/
  index.js
vault/
  PM Weaver/
```

## Notes

The OpenAI API key is stored locally in your browser. For a future Tauri desktop version, move the API key into a secure local secret store and keep the existing AI provider and vault storage boundaries.
