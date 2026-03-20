/**
 * Fetches score history for every league member from the Golf Canada API,
 * matches rounds to the configured league courses, selects the best
 * differentials per course, and writes the aggregated results to
 * src/data/{year}.json.
 *
 * Usage:
 *   npx tsx scripts/fetch-scores.ts
 *
 * Environment variables required:
 *   GOLFCANADA_USERNAME
 *   GOLFCANADA_PASSWORD
 */

import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import {
  getHistory,
} from "../src/service/golf-canada.js";
import type {
  LeagueConfig,
  PlayerScore,
  Round,
  YearlyScores,
} from "../src/types/index.js";
import type { GolfCanadaScoreHistory } from "../src/service/golf-canada.js";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const configPath = path.join(ROOT, "config", "league.json");
const config: LeagueConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const { currentYear: year } = config.league;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalises a string for comparison: lowercase, collapse whitespace,
 * strip punctuation except hyphens.
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
 * configured league course name. Both are normalised before comparison.
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

// ---------------------------------------------------------------------------
// Per-player processing
// ---------------------------------------------------------------------------

async function processPlayer(member: LeagueConfig["members"][number]): Promise<PlayerScore> {
  console.log(`  → Fetching history for ${member.name} (id: ${member.individualId}) …`);
  const history = await getHistory(member.individualId);

  const yearScores = filterByYear(history, year);
  console.log(`     Found ${yearScores.length} round(s) in ${year}.`);

  // Match each score entry to a configured league course
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
        break; // stop checking other courses once matched
      }
    }
  }

  // For each course, keep only the N best rounds (lowest differential)
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

  // Total score = sum of all best-round differentials
  const totalScore =
    Math.round(
      Object.values(bestRoundsByCourse)
        .flat()
        .reduce((sum, r) => sum + r.differential, 0) * 10
    ) / 10;

  return {
    member,
    rounds,
    bestRoundsByCourse,
    totalScore,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`\nFetching scores for "${config.league.name}" – ${year}\n`);

  const players: PlayerScore[] = [];

  for (const member of config.members) {
    try {
      players.push(await processPlayer(member));
    } catch (err) {
      console.error(`  ✗ Failed to fetch scores for ${member.name}:`, err);
    }
  }

  const yearlyScores: YearlyScores = {
    year,
    generatedAt: new Date().toISOString(),
    players,
  };

  const dataDir = path.join(ROOT, "src", "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const outputPath = path.join(dataDir, `${year}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(yearlyScores, null, 2));

  console.log(`\n✓ Scores for ${players.length} player(s) saved to ${outputPath}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
