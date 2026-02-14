import { clearChallengeRequired, checkFlipLimit, checkWriteLimits, isChallengeRequired, markChallengeRequired } from '../../_lib/rate-limit';
import { computeRankScore, formatDisplayCount } from '../../_lib/ranking';
import { getIdentityContext, withIdentityCookie } from '../../_lib/identity';
import { isValidCategoryTool, isValidSlug } from '../../_lib/validate';
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

async function verifyTurnstile(secretKey: string | undefined, token: string | undefined, ip: string): Promise<boolean> {
  if (!secretKey || !token) return false;
  const form = new URLSearchParams();
  form.set('secret', secretKey);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form
  });
  if (!response.ok) return false;
  const payload = await response.json<Record<string, unknown>>();
  return payload.success === true;
}

async function computeSingleToolStats(env: Env, categoryId: string, toolId: string, anonHash: string) {
  const votesRes = await env.DB.prepare('SELECT vote, updated_at as updatedAt FROM votes WHERE category_id = ? AND tool_id = ?')
    .bind(categoryId, toolId)
    .all<Record<string, unknown>>();
  const rows = (votesRes.results || []).map((row) => ({
    vote: Number(row.vote) === -1 ? -1 : 1,
    updatedAt: Number(row.updatedAt)
  }));

  const viewer = await env.DB.prepare('SELECT vote FROM votes WHERE category_id = ? AND tool_id = ? AND anon_hash = ?')
    .bind(categoryId, toolId, anonHash)
    .first<Record<string, unknown>>();

  const upvotes = rows.filter((row) => row.vote === 1).length;
  const downvotes = rows.filter((row) => row.vote === -1).length;
  const totalVotes = rows.length;

  return {
    toolId,
    upvotes,
    downvotes,
    totalVotes,
    rankScore: computeRankScore(rows.map((row) => ({ toolId, vote: row.vote, updatedAt: row.updatedAt }))),
    displayCount: formatDisplayCount(totalVotes),
    viewerVote: viewer ? Number(viewer.vote) : 0
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const identity = await getIdentityContext(request, env);

  const body = await request.json<Record<string, unknown>>().catch(() => ({}));
  const categoryId = String(body.categoryId || '');
  const toolId = String(body.toolId || '');
  const vote = Number(body.vote);
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : undefined;

  if (!isValidSlug(categoryId) || !isValidSlug(toolId) || !isValidCategoryTool(categoryId, toolId) || (vote !== 1 && vote !== -1)) {
    return withIdentityCookie(jsonResponse({ error: 'Invalid vote request payload' }, 400), identity);
  }

  const writeLimits = await checkWriteLimits(env, identity.ipHash, identity.anonHash);
  if (!writeLimits.ok) {
    await markChallengeRequired(env, identity.anonHash);
    return withIdentityCookie(jsonResponse({ error: writeLimits.reason || 'Rate limited' }, 429), identity);
  }

  const challengeRequired = writeLimits.requireChallenge || await isChallengeRequired(env, identity.anonHash);
  if (challengeRequired) {
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const turnstileValid = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, turnstileToken, ip);
    if (!turnstileValid) {
      await markChallengeRequired(env, identity.anonHash);
      return withIdentityCookie(jsonResponse({ error: 'Challenge required', requiresChallenge: true, siteKey: env.TURNSTILE_SITE_KEY || '' }, 403), identity);
    }
    await clearChallengeRequired(env, identity.anonHash);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const existing = await env.DB.prepare('SELECT vote FROM votes WHERE category_id = ? AND tool_id = ? AND anon_hash = ?')
    .bind(categoryId, toolId, identity.anonHash)
    .first<Record<string, unknown>>();

  if (!existing) {
    await env.DB.prepare('INSERT INTO votes (category_id, tool_id, anon_hash, vote, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(categoryId, toolId, identity.anonHash, vote, nowSec, nowSec)
      .run();
  } else {
    const currentVote = Number(existing.vote);
    if (!(await checkFlipLimit(env, identity.anonHash, toolId))) {
      await markChallengeRequired(env, identity.anonHash);
      return withIdentityCookie(jsonResponse({ error: 'Too many vote changes for this tool today' }, 429), identity);
    }

    if (currentVote === vote) {
      await env.DB.prepare('DELETE FROM votes WHERE category_id = ? AND tool_id = ? AND anon_hash = ?')
        .bind(categoryId, toolId, identity.anonHash)
        .run();
    } else {
      await env.DB.prepare('UPDATE votes SET vote = ?, updated_at = ? WHERE category_id = ? AND tool_id = ? AND anon_hash = ?')
        .bind(vote, nowSec, categoryId, toolId, identity.anonHash)
        .run();
    }
  }

  await env.DB.prepare('INSERT INTO vote_events (category_id, tool_id, anon_hash, requested_vote, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(categoryId, toolId, identity.anonHash, vote, nowSec)
    .run();

  const tool = await computeSingleToolStats(env, categoryId, toolId, identity.anonHash);
  const response = jsonResponse({ ok: true, tool });
  return withIdentityCookie(response, identity);
};
