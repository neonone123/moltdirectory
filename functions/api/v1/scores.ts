import { computeRankScore, formatDisplayCount } from '../../_lib/ranking';
import { getIdentityContext, withIdentityCookie } from '../../_lib/identity';
import { isValidCategoryTool, isValidSlug, sanitizeToolIds } from '../../_lib/validate';
import type { Env, VoteRow } from '../../_lib/types';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

async function fetchVotesByTools(env: Env, categoryId: string, toolIds: string[]): Promise<VoteRow[]> {
  if (toolIds.length === 0) return [];
  const placeholders = toolIds.map(() => '?').join(',');
  const sql = `SELECT tool_id as toolId, vote, updated_at as updatedAt FROM votes WHERE category_id = ? AND tool_id IN (${placeholders})`;
  const rows = await env.DB.prepare(sql).bind(categoryId, ...toolIds).all<Record<string, unknown>>();
  return (rows.results || []).map((row) => ({
    toolId: String(row.toolId),
    vote: Number(row.vote) === -1 ? -1 : 1,
    updatedAt: Number(row.updatedAt)
  }));
}

async function fetchViewerVotes(env: Env, anonHash: string, categoryId: string, toolIds: string[]): Promise<Map<string, number>> {
  if (toolIds.length === 0) return new Map();
  const placeholders = toolIds.map(() => '?').join(',');
  const sql = `SELECT tool_id as toolId, vote FROM votes WHERE category_id = ? AND anon_hash = ? AND tool_id IN (${placeholders})`;
  const rows = await env.DB.prepare(sql).bind(categoryId, anonHash, ...toolIds).all<Record<string, unknown>>();
  const map = new Map<string, number>();
  for (const row of rows.results || []) {
    map.set(String(row.toolId), Number(row.vote));
  }
  return map;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const categoryId = url.searchParams.get('categoryId') || '';
  const toolIds = sanitizeToolIds(url.searchParams.get('toolIds'));

  if (!isValidSlug(categoryId) || toolIds.length === 0) {
    return jsonResponse({ error: 'Invalid categoryId or toolIds' }, 400);
  }

  const validToolIds = toolIds.filter((toolId) => isValidCategoryTool(categoryId, toolId));
  if (validToolIds.length === 0) {
    return jsonResponse({ error: 'No valid tools for category' }, 400);
  }

  const identity = await getIdentityContext(request, env);
  const allVotes = await fetchVotesByTools(env, categoryId, validToolIds);
  const viewerVotes = await fetchViewerVotes(env, identity.anonHash, categoryId, validToolIds);

  const votesByTool = new Map<string, VoteRow[]>();
  for (const row of allVotes) {
    if (!votesByTool.has(row.toolId)) votesByTool.set(row.toolId, []);
    votesByTool.get(row.toolId)!.push(row);
  }

  const tools = validToolIds.map((toolId) => {
    const rows = votesByTool.get(toolId) || [];
    const upvotes = rows.filter((row) => row.vote === 1).length;
    const downvotes = rows.filter((row) => row.vote === -1).length;
    const totalVotes = rows.length;
    const rankScore = computeRankScore(rows);
    return {
      toolId,
      upvotes,
      downvotes,
      totalVotes,
      rankScore,
      displayCount: formatDisplayCount(totalVotes),
      viewerVote: viewerVotes.get(toolId) || 0
    };
  });

  const response = jsonResponse({
    categoryId,
    tools,
    rankingVersion: 'wilson_decay_v1',
    generatedAt: new Date().toISOString()
  });
  return withIdentityCookie(response, identity);
};
