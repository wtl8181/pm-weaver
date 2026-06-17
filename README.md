# PM Weaver / 产品经理工作流工作台

PM Weaver is a local-first workflow canvas for product managers. The current MVP focuses on a minimal loop: create a task, enter its canvas, paste raw messages, and generate a PRD draft with an LLM.

PM Weaver 是一个本地优先的产品经理工作流画布工具。当前 MVP 聚焦最小闭环：新建任务、进入任务画布、粘贴原始消息，并通过 LLM 生成 PRD 初稿。

The MVP runs as a local full-stack app: a Vite browser UI plus a tiny Node file API that stores workflow data in a project-local Obsidian-compatible vault.

当前 MVP 是一个本地前后端一体应用：前端使用 Vite 浏览器界面，后端是一个很薄的 Node 本地文件 API，数据存储在项目内的 Obsidian 兼容 Vault 中。

## Tech Stack / 技术栈

- Vite
- React
- TypeScript
- React Flow
- Tailwind CSS
- Zustand
- OpenAI Responses API via `fetch`
- Project-local Obsidian vault as file storage / 使用项目内 Obsidian Vault 作为文件型数据库

## Getting Started / 快速开始

```bash
npm install
npm run dev
```

Open the local URL printed by Vite:

打开 Vite 输出的本地地址：

```text
http://127.0.0.1:5173
```

The dev command starts two local processes:

`dev` 命令会同时启动两个本地进程：

- Web UI / 前端页面：`http://127.0.0.1:5173`
- Local file API / 本地文件 API：`http://127.0.0.1:8787`

## Basic Workflow / 基础使用流程

1. Create a task from the task home page.
2. PM Weaver creates a task Markdown file inside the project-local Obsidian vault.
3. Enter the task canvas.
4. Paste raw product context into a **Message** node.
5. Connect the **Message** node to a **PRD** node.
6. Open **Settings** and choose an AI provider. Use **Local Hermes** for a local Ollama-compatible Hermes model, or **OpenAI** with an API key.
7. Click **Run**.
8. Select the **PRD** node to inspect, copy, or download the generated Markdown.

中文流程：

1. 在任务首页新建一个 Task。
2. PM Weaver 会在项目内 Obsidian Vault 中创建一个 Task Markdown 文件。
3. 点击新建后进入该 Task 的画布。
4. 在 **Message** 节点中粘贴原始产品上下文。
5. 将 **Message** 节点连接到 **PRD**、**TEAMUP** 或 **Ding Meeting** 节点。
6. 打开 **Settings** 选择 AI Provider。使用本地 Ollama 兼容的 Hermes 模型时选择 **Local Hermes**；使用 OpenAI 时再填写 API Key。
7. 点击 **Run** 运行工作流。
8. 点击 **PRD** 节点，在右侧面板查看、复制或下载生成的 Markdown。

## Implemented Nodes / 已实现节点

- **Message Node / 消息节点**：stores raw Slack, email, meeting notes, or requirement discussion text. 存放 Slack、邮件、会议纪要、需求讨论等原始消息。
- **PRD Node / PRD 节点**：uses upstream message context to generate a PRD draft with the selected AI provider. 基于上游消息上下文调用当前选择的 AI Provider 生成 PRD 初稿。
- **TEAMUP Node / TEAMUP 节点**：creates a TeamUP ticket request from a local template and saves it to the vault. 通过本地模板生成 TEAMUP 单据请求，并保存到 Vault。
- **Ding Meeting Node / 钉钉会议节点**：creates a DingTalk meeting draft from a template; when enabled, calls `dws calendar event create` to create the real meeting. 通过模板生成钉钉会议草稿；打开创建开关后会调用 `dws calendar event create` 创建真实会议。

## Data Storage / 数据存储

The project-local vault lives here:

项目内 Vault 目录位于：

```text
vault/PM Weaver/
```

You can open that folder directly as an Obsidian vault.

你可以直接用 Obsidian 打开这个目录，把它当作一个 Vault 使用。

Runtime data is written by the local API:

运行时数据会由本地 API 写入：

```text
vault/PM Weaver/
  Tasks/
    *.md
  Workflows/
    {taskId}.workflow.json
  Artifacts/
    *.md
```

The browser also keeps a `localStorage` cache:

浏览器也会保留一份 `localStorage` 缓存：

- Workflow graph: current task, nodes, edges, selected node. / 工作流画布：当前任务、节点、连线、选中节点。
- Settings: AI provider, OpenAI API key, local Hermes endpoint, model, temperature. / 设置项：AI Provider、OpenAI API Key、本地 Hermes endpoint、模型、temperature。

Generated workflow JSON and artifacts are ignored by git by default because they may contain private product context or AI-generated business documents. The vault scaffold and README are tracked.

运行时生成的 workflow JSON 和 artifacts 默认会被 git 忽略，因为它们可能包含私有业务上下文或 AI 生成的业务文档。Vault 目录骨架和 README 会被提交。

There is no login, cloud sync, external database, or third-party integration in this first version.

第一版没有用户登录、云同步、外部数据库，也没有接入 Jira、Slack、Google Drive 等第三方系统。

## Project Structure / 项目结构

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

## Notes / 注意事项

The OpenAI API key is stored locally in your browser only when you choose the OpenAI provider. Local Hermes does not require an API key. For a future Tauri desktop version, move secrets into a secure local secret store and keep the existing AI provider and vault storage boundaries.

只有选择 OpenAI Provider 时才需要 OpenAI API Key，并且当前 Key 存储在浏览器本地。Local Hermes 不需要 API Key。未来如果升级为 Tauri 桌面应用，建议把密钥移到安全的本地密钥存储中，并继续保留当前的 AI Provider 与 Vault Storage 边界。
