import type { Env } from './types';

const IP_LIMIT = 20;
const IP_WINDOW_SECONDS = 600;
const ANON_LIMIT = 40;
const ANON_WINDOW_SECONDS = 3600;
const FLIP_LIMIT = 3;
const CHALLENGE_TTL_SECONDS = 1800;

function minuteBucket(nowMs: number): number {
  return Math.floor(nowMs / 60000);
}

function hourBucket(nowMs: number): number {
  return Math.floor(nowMs / 3600000);
}

function dayBucket(nowMs: number): number {
  return Math.floor(nowMs / 86400000);
}

async function incrementWindow(kv: KVNamespace, key: string, ttlSeconds: number): Promise<number> {
  const current = Number((await kv.get(key)) || '0');
  const next = current + 1;
  await kv.put(key, String(next), { expirationTtl: ttlSeconds });
  return next;
}

export async function checkWriteLimits(env: Env, ipHash: string, anonHash: string): Promise<{ ok: boolean; requireChallenge: boolean; reason?: string }> {
  const now = Date.now();
  const ipKey = `rl:ip:${ipHash}:${minuteBucket(now)}`;
  const anonKey = `rl:anon:${anonHash}:${hourBucket(now)}`;

  const ipCount = await incrementWindow(env.RATE_LIMIT_KV, ipKey, IP_WINDOW_SECONDS);
  if (ipCount > IP_LIMIT) {
    return { ok: false, requireChallenge: true, reason: 'Too many vote requests from IP' };
  }

  const anonCount = await incrementWindow(env.RATE_LIMIT_KV, anonKey, ANON_WINDOW_SECONDS);
  if (anonCount > ANON_LIMIT) {
    return { ok: false, requireChallenge: true, reason: 'Too many vote requests from this browser' };
  }

  const requireChallenge = ipCount > Math.floor(IP_LIMIT * 0.5) || anonCount > Math.floor(ANON_LIMIT * 0.5);
  return { ok: true, requireChallenge };
}

export async function checkFlipLimit(env: Env, anonHash: string, toolId: string): Promise<boolean> {
  const key = `rl:flip:${anonHash}:${toolId}:${dayBucket(Date.now())}`;
  const count = await incrementWindow(env.RATE_LIMIT_KV, key, 86400);
  return count <= FLIP_LIMIT;
}

export async function markChallengeRequired(env: Env, anonHash: string): Promise<void> {
  await env.RATE_LIMIT_KV.put(`challenge:anon:${anonHash}`, '1', { expirationTtl: CHALLENGE_TTL_SECONDS });
}

export async function clearChallengeRequired(env: Env, anonHash: string): Promise<void> {
  await env.RATE_LIMIT_KV.delete(`challenge:anon:${anonHash}`);
}

export async function isChallengeRequired(env: Env, anonHash: string): Promise<boolean> {
  const value = await env.RATE_LIMIT_KV.get(`challenge:anon:${anonHash}`);
  return value === '1';
}
