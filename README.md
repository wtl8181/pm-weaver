# PM Weaver / 产品经理工作流工作台

PM Weaver is a local-first workflow canvas for product managers. It helps transform messy product context, such as Slack discussions, emails, meeting notes, requirement drafts, and screenshots, into structured PM artifacts.

PM Weaver 是一个本地优先的产品经理工作流画布工具，用于把 Slack 讨论、邮件、会议纪要、需求草稿、截图说明等零散上下文，转换成结构化的产品文档和交付物。

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

1. Open **Settings** and enter your OpenAI API key.
2. Keep the default model `gpt-5.1`, or enter another OpenAI model string.
3. Paste raw product context into a **Text Input** node.
4. Connect it to **Requirement Extractor**, **Open Questions**, or **PRD Generator** nodes.
5. Connect the final artifact to **Markdown Export**.
6. Click **Run**.
7. Select any node to inspect its input snapshot, full output, status, or error.
8. Use **Copy** or **Download** on the export node or right-side artifact viewer.

中文流程：

1. 打开 **Settings**，输入 OpenAI API Key。
2. 保留默认模型 `gpt-5.1`，或填写其他 OpenAI 模型名称。
3. 在 **Text Input** 节点中粘贴原始产品上下文。
4. 将输入节点连接到 **Requirement Extractor**、**Open Questions** 或 **PRD Generator** 节点。
5. 将最终产物连接到 **Markdown Export** 节点。
6. 点击 **Run** 运行工作流。
7. 点击任意节点，在右侧面板查看输入快照、完整输出、运行状态或错误信息。
8. 在导出节点或右侧 Artifact Viewer 中复制或下载 Markdown。

## Implemented Nodes / 已实现节点

- **Text Input Node / 文本输入节点**：stores raw Slack, email, meeting notes, or requirement discussion text. 存放 Slack、邮件、会议纪要、需求讨论等原始文本。
- **Requirement Extractor Node / 需求提取节点**：generates structured requirement Markdown. 生成结构化需求 Markdown。
- **Open Questions Node / 待确认问题节点**：generates a Markdown table of questions, owners, reasons, and priorities. 生成待确认问题、建议负责人、原因和优先级表格。
- **PRD Generator Node / PRD 生成节点**：generates a PRD draft with PM-focused sections. 生成面向产品经理的 PRD 初稿。
- **Markdown Export Node / Markdown 导出节点**：previews, copies, and downloads generated Markdown. 预览、复制并下载生成的 Markdown。

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
  Workflows/
    default.workflow.json
  Artifacts/
    *.md
```

The browser also keeps a `localStorage` cache:

浏览器也会保留一份 `localStorage` 缓存：

- Workflow graph: nodes, edges, selected node. / 工作流画布：节点、连线、选中节点。
- Settings: OpenAI API key, model, temperature. / 设置项：OpenAI API Key、模型、temperature。

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

The OpenAI API key is stored locally in your browser. For a future Tauri desktop version, move the API key into a secure local secret store and keep the existing AI provider and vault storage boundaries.

OpenAI API Key 当前存储在浏览器本地。未来如果升级为 Tauri 桌面应用，建议把 API Key 移到安全的本地密钥存储中，并继续保留当前的 AI Provider 与 Vault Storage 边界。
