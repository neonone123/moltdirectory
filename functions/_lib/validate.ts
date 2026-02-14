import manifestData from '../../data/tools-manifest.json';

interface ManifestTool {
  categoryId: string;
  toolId: string;
}

const MANIFEST_TOOLS = ((manifestData as { tools?: ManifestTool[] }).tools || []) as ManifestTool[];
const TOOL_PAIR_SET = new Set(MANIFEST_TOOLS.map((entry) => `${entry.categoryId}:${entry.toolId}`));

export function isValidSlug(input: string): boolean {
  return /^[a-z0-9-]{1,160}$/.test(input);
}

export function isValidCategoryTool(categoryId: string, toolId: string): boolean {
  if (!isValidSlug(categoryId) || !isValidSlug(toolId)) {
    return false;
  }
  return TOOL_PAIR_SET.has(`${categoryId}:${toolId}`);
}

export function sanitizeToolIds(csv: string | null): string[] {
  if (!csv) return [];
  const unique = new Set<string>();
  for (const raw of csv.split(',')) {
    const value = raw.trim();
    if (!isValidSlug(value)) continue;
    unique.add(value);
    if (unique.size >= 300) break;
  }
  return [...unique];
}
