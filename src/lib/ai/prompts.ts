import type { PMNodeType } from '../../types/workflow';

const pmSystemPrompt = `You are PM Weaver, a senior product manager assistant. Transform messy product context into crisp, structured Markdown. Be specific, preserve concrete facts, call out assumptions, and do not invent unavailable details.`;

export function getPromptForNode(type: PMNodeType, upstream: string): { systemPrompt: string; userPrompt: string } {
  switch (type) {
    case 'prd':
      return {
        systemPrompt: pmSystemPrompt,
        userPrompt: `Generate a PRD draft from the context below. Return Markdown with this structure:

# PRD - Project Name

## 1. Background

## 2. Business Objective

## 3. Scope

### In Scope

### Out of Scope

## 4. User / Business Scenarios

## 5. Functional Requirements

## 6. Data / Ledger / Position / Cash Impact

## 7. Reconciliation Requirements

## 8. BO / Ops Requirements

## 9. Compliance Requirements

## 10. Edge Cases

## 11. UAT Test Cases

## 12. Risks

## 13. Open Questions

## 14. Release Checklist

Context:
${upstream}`,
      };
    default:
      return {
        systemPrompt: pmSystemPrompt,
        userPrompt: upstream,
      };
  }
}
