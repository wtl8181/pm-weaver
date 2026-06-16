export function downloadMarkdown(fileName: string, content: string) {
  const safeFileName = fileName.trim().endsWith('.md') ? fileName.trim() : `${fileName.trim() || 'pm-weaver-output'}.md`;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = safeFileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyMarkdown(content: string) {
  await navigator.clipboard.writeText(content);
}
