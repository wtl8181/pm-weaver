import type { NodeDefinition, PMNode, PMNodeType } from '../../types/workflow';

export const nodeDefinitions: NodeDefinition[] = [
  {
    type: 'textInput',
    label: 'Text Input',
    description: 'Paste Slack, email, meeting notes, or raw requirement context.',
  },
  {
    type: 'requirementExtractor',
    label: 'Requirement Extractor',
    description: 'Extract structured product requirements from upstream context.',
  },
  {
    type: 'openQuestions',
    label: 'Open Questions',
    description: 'Identify unresolved questions, owners, reasons, and priorities.',
  },
  {
    type: 'prdGenerator',
    label: 'PRD Generator',
    description: 'Draft a complete PM-style PRD from upstream artifacts.',
  },
  {
    type: 'markdownExport',
    label: 'Markdown Export',
    description: 'Preview, copy, and download generated Markdown.',
  },
];

export function createNode(type: PMNodeType, position = { x: 120, y: 120 }): PMNode {
  const definition = nodeDefinitions.find((item) => item.type === type);
  const id = `${type}-${crypto.randomUUID()}`;

  return {
    id,
    type,
    position,
    data: {
      label: definition?.label ?? type,
      nodeType: type,
      status: 'idle',
      config:
        type === 'textInput'
          ? { title: 'Source Context', rawText: '' }
          : type === 'markdownExport'
            ? { fileName: 'prd-draft.md' }
            : {},
    },
  };
}
