import { getIdentityContext, withIdentityCookie } from '../../_lib/identity';
import { isValidCategoryTool, isValidSlug, sanitizeToolIds } from '../../_lib/validate';
import type { Env } from '../../_lib/types';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const categoryId = url.searchParams.get('categoryId') || '';
  const toolIds = sanitizeToolIds(url.searchParams.get('toolIds'));

  if (!isValidSlug(categoryId)) {
    return jsonResponse({ error: 'Invalid categoryId' }, 400);
  }

  const validToolIds = toolIds.filter((toolId) => isValidCategoryTool(categoryId, toolId));
  if (validToolIds.length === 0) {
    return jsonResponse({ categoryId, votes: {} });
  }

  const identity = await getIdentityContext(request, env);
  const placeholders = validToolIds.map(() => '?').join(',');
  const sql = `SELECT tool_id as toolId, vote FROM votes WHERE category_id = ? AND anon_hash = ? AND tool_id IN (${placeholders})`;
  const rows = await env.DB.prepare(sql).bind(categoryId, identity.anonHash, ...validToolIds).all<Record<string, unknown>>();

  const votes: Record<string, number> = {};
  for (const row of rows.results || []) {
    votes[String(row.toolId)] = Number(row.vote);
  }

  const response = jsonResponse({ categoryId, votes });
  return withIdentityCookie(response, identity);
};
