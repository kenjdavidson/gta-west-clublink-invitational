/**
 * Score aggregation service.
 *
 * Fetches score history for every league member from the Golf Canada API,
 * matches rounds to the configured league courses, selects the best
 * differentials per course, and assembles YearlyScores objects.
 *
 * Results are cached by year so that multiple Astro pages built in the same
 * process do not trigger redundant API calls.
 */

import { getHistory } from "../service/golf-canada.js";
import type { LeagueConfig, Member, PlayerScore, Round, YearlyScores } from "../types/index.js";
import type { GolfCanadaScoreHistory } from "../service/golf-canada.js";

// ---------------------------------------------------------------------------
// Module-level cache: year → YearlyScores
// ---------------------------------------------------------------------------

const _cache = new Map<number, YearlyScores>();

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Normalises a string for fuzzy course-name comparison: lowercase, collapse
 * whitespace, strip punctuation except hyphens.
 */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns true when the Golf Canada course name is a plausible match for a
 * configured league course name. Both strings are normalised before comparison.
 */
function courseNameMatches(gcName: string, leagueName: string): boolean {
  const gc = normalise(gcName);
  const lg = normalise(leagueName);
  return gc.includes(lg) || lg.includes(gc);
}

/**
 * Filters a Golf Canada history array to scores played in `targetYear`.
 */
function filterByYear(
  scores: GolfCanadaScoreHistory[],
  targetYear: number
): GolfCanadaScoreHistory[] {
  return scores.filter((s) => new Date(s.date).getFullYear() === targetYear);
}

/**
 * Builds a PlayerScore from a member's Golf Canada history for the given year.
 */
function buildPlayerScore(
  member: Member,
  yearScores: GolfCanadaScoreHistory[],
  config: LeagueConfig
): PlayerScore {
  const rounds: Round[] = [];

  for (const score of yearScores) {
    for (const course of config.courses) {
      if (courseNameMatches(score.course, course.name)) {
        rounds.push({
          date: score.date,
          courseId: course.clubId,
          courseName: course.name,
          tee: score.tee ?? course.tee,
          score: score.score,
          differential: score.adjustedDifferential,
        });
        break; // matched — stop checking other courses
      }
    }
  }

  // For each course keep only the N best rounds (lowest differential first)
  const bestRoundsByCourse: Record<string, Round[]> = {};
  for (const course of config.courses) {
    const courseRounds = rounds
      .filter((r) => r.courseId === course.clubId)
      .sort((a, b) => a.differential - b.differential)
      .slice(0, course.roundsCount);

    if (courseRounds.length > 0) {
      bestRoundsByCourse[course.clubId] = courseRounds;
    }
  }

  // Total = sum of all best-round differentials, rounded to one decimal
  const totalScore =
    Math.round(
      Object.values(bestRoundsByCourse)
        .flat()
        .reduce((sum, r) => sum + r.differential, 0) * 10
    ) / 10;

  return { member, rounds, bestRoundsByCourse, totalScore };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the aggregated yearly scores for all league members.
 *
 * Results are cached by year — subsequent calls with the same year return the
 * cached value without making additional Golf Canada API requests.
 *
 * @param year    The season year to fetch scores for
 * @param config  The league configuration (members + courses)
 */
export async function getYearlyScores(
  year: number,
  config: LeagueConfig
): Promise<YearlyScores> {
  if (_cache.has(year)) {
    return _cache.get(year)!;
  }

  const players: PlayerScore[] = [];

  for (const member of config.members) {
    try {
      const history = await getHistory(member.individualId);
      const yearScores = filterByYear(history, year);
      players.push(buildPlayerScore(member, yearScores, config));
    } catch (err) {
      // Member is skipped (no entry in players array) on API failure.
      console.error(`[score-service] Failed to fetch scores for ${member.name} — skipping:`, err);
    }
  }

  players.sort((a, b) => a.totalScore - b.totalScore);

  const result: YearlyScores = {
    year,
    // Timestamp records when the Golf Canada API was first queried for this
    // year; all pages that share the cached result will report the same value.
    generatedAt: new Date().toISOString(),
    players,
  };

  _cache.set(year, result);
  return result;
}
