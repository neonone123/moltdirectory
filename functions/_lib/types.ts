export interface Env {
  DB: D1Database;
  RATE_LIMIT_KV: KVNamespace;
  VOTE_PEPPER: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

export interface IdentityContext {
  anonId: string;
  anonHash: string;
  ipHash: string;
  setCookieHeader?: string;
}

export interface VoteRow {
  toolId: string;
  vote: 1 | -1;
  updatedAt: number;
}
