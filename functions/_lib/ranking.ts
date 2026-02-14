import type { VoteRow } from './types';

const HALF_LIFE_DAYS = 45;
const Z_SCORE = 1.28;

export function wilsonLowerBound(weightedUp: number, weightedTotal: number, z = Z_SCORE): number {
  if (weightedTotal <= 0) return 0;
  const phat = weightedUp / weightedTotal;
  const z2 = z * z;
  const denominator = 1 + z2 / weightedTotal;
  const center = phat + z2 / (2 * weightedTotal);
  const margin = z * Math.sqrt((phat * (1 - phat) + z2 / (4 * weightedTotal)) / weightedTotal);
  return Math.max(0, (center - margin) / denominator);
}

export function voteWeight(updatedAtSeconds: number, nowMs: number): number {
  const ageMs = Math.max(0, nowMs - updatedAtSeconds * 1000);
  const ageDays = ageMs / 86400000;
  return Math.exp((-Math.log(2) * ageDays) / HALF_LIFE_DAYS);
}

export function computeRankScore(votes: VoteRow[], nowMs = Date.now()): number {
  let weightedUp = 0;
  let weightedTotal = 0;

  for (const row of votes) {
    const weight = voteWeight(row.updatedAt, nowMs);
    weightedTotal += weight;
    if (row.vote === 1) weightedUp += weight;
  }

  const confidence = wilsonLowerBound(weightedUp, weightedTotal);
  const coldStartBoost = 0.03 * Math.exp(-votes.length / 20);
  return confidence + coldStartBoost;
}

export function formatDisplayCount(totalVotes: number): string {
  if (totalVotes < 10) return 'New';
  if (totalVotes < 25) return '10+';
  if (totalVotes < 50) return '25+';
  if (totalVotes < 100) return '50+';
  if (totalVotes < 250) return '100+';
  return '250+';
}
