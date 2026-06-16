# PM Weaver

PM Weaver is a local-first workflow canvas for product managers. The MVP runs fully in the browser, stores workflow state and OpenAI settings in `localStorage`, and exports generated artifacts as Markdown files.

## Tech Stack

- Vite
- React
- TypeScript
- React Flow
- Tailwind CSS
- Zustand
- OpenAI Responses API via `fetch`

## Getting Started

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

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

The MVP stores data in browser `localStorage`:

- Workflow graph: nodes, edges, selected node.
- Settings: OpenAI API key, model, temperature.

There is no login, cloud sync, server database, or third-party integration in this first version.

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
```

## Notes

The OpenAI API key is stored locally in your browser. For a future Tauri desktop version, move the API key into a secure local secret store and keep the existing AI provider boundary.
