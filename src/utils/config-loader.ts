/**
 * Configuration loader.
 *
 * Reads the split config layout:
 *
 *   config/site.json           – site-level config (name, currentYear, githubRepo)
 *   config/{year}/config.json  – year-specific config (members, courses, bonusRoundsCount)
 *   config/{year}/results.json – (optional) cached results for completed seasons
 *
 * The `loadConfig(year)` helper merges site + year configs into a `LeagueConfig`
 * for backward-compatible use across all Astro pages.
 */

import * as fs from "fs";
import * as path from "path";
import type { SiteConfig, YearConfig, LeagueConfig, YearlyScores } from "../types/index.js";

const CONFIG_DIR = path.join(process.cwd(), "config");

/**
 * Loads the site-level configuration from `config/site.json`.
 */
export function loadSiteConfig(): SiteConfig {
  const sitePath = path.join(CONFIG_DIR, "site.json");
  return JSON.parse(fs.readFileSync(sitePath, "utf-8")) as SiteConfig;
}

/**
 * Loads the year-specific configuration from `config/{year}/config.json`.
 */
export function loadYearConfig(year: number): YearConfig {
  const yearConfigPath = path.join(CONFIG_DIR, String(year), "config.json");
  return JSON.parse(fs.readFileSync(yearConfigPath, "utf-8")) as YearConfig;
}

/**
 * Returns the pre-computed static results for a completed season from
 * `config/{year}/results.json`, or `null` if no results file exists.
 *
 * When this returns a non-null value the score service skips all Golf Canada
 * API calls and uses the cached data instead.
 */
export function loadYearlyResults(year: number): YearlyScores | null {
  const resultsPath = path.join(CONFIG_DIR, String(year), "results.json");
  if (!fs.existsSync(resultsPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(resultsPath, "utf-8")) as YearlyScores;
}

/**
 * Returns a sorted list of all years that have a `config/{year}/config.json`
 * file, oldest first.
 */
export function getConfiguredYears(): number[] {
  const entries = fs.readdirSync(CONFIG_DIR, { withFileTypes: true });
  return entries
    .filter(
      (e: fs.Dirent) =>
        e.isDirectory() &&
        /^\d{4}$/.test(e.name) &&
        fs.existsSync(path.join(CONFIG_DIR, e.name, "config.json"))
    )
    .map((e: fs.Dirent) => Number(e.name))
    .sort((a: number, b: number) => a - b);
}

/**
 * Merges the site config and the given year's config into a single
 * `LeagueConfig` object for use by Astro pages and the score service.
 *
 * If `year` is omitted the site config's `currentYear` is used.
 */
export function loadConfig(year?: number): LeagueConfig {
  const site = loadSiteConfig();
  const resolvedYear = year ?? site.league.currentYear;
  const yearCfg = loadYearConfig(resolvedYear);

  return {
    league: {
      name: site.league.name,
      currentYear: resolvedYear,
      githubRepo: site.league.githubRepo,
      bonusRoundsCount: yearCfg.bonusRoundsCount,
    },
    members: yearCfg.members,
    courses: yearCfg.courses,
  };
}
