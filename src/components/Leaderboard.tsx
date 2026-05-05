import type { Course, PlayerScore, YearlyScores } from "../types/index.js";
import { toSlug } from "../utils/slug.js";

interface LeaderboardProps {
  scores: YearlyScores;
  courses: Course[];
  showNames?: boolean;
}

function formatScore(value: number): string {
  return String(value);
}

/**
 * Computes the effective number of columns to show for each course.
 * At minimum, this is course.roundsCount (required rounds); but if any player
 * has bonus rounds at the course, extra columns are shown for those too.
 */
function buildEffectiveColsMap(
  courses: Course[],
  players: PlayerScore[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const course of courses) {
    let max = course.roundsCount;
    for (const player of players) {
      const rounds = player.bestRoundsByCourse[course.clubId] ?? [];
      max = Math.max(max, rounds.length);
    }
    map.set(course.clubId, max);
  }
  return map;
}

// Fixed pixel widths for the sticky columns (total cell width including padding).
const RANK_COL_W = 44;
const PLAYER_COL_W = 200;
const TOTAL_COL_W = 72;

export function Leaderboard({ scores, courses, showNames = true }: LeaderboardProps) {
  const { players } = scores;

  const effectiveColsMap = buildEffectiveColsMap(courses, players);

  // Only render courses that have at least one column to show.
  const visibleCourses = courses.filter(
    (c) => (effectiveColsMap.get(c.clubId) ?? 0) > 0
  );

  const totalScoreCols = visibleCourses.reduce(
    (sum, c) => sum + (effectiveColsMap.get(c.clubId) ?? 0),
    0
  );

  // Left offset (px) of the Total sticky column.
  const totalColLeft = RANK_COL_W + (showNames ? PLAYER_COL_W : 0);

  return (
    <div>
      {/* ── Mobile card layout (visible on mobile, hidden on md+) ── */}
      <div className="md:hidden space-y-3">
        {players.map((player, index) => (
          <MobilePlayerCard
            key={player.member.individualId}
            rank={index + 1}
            player={player}
            courses={visibleCourses}
            year={scores.year}
          />
        ))}
        {players.length === 0 && (
          <div className="rounded-xl shadow ring-1 ring-gray-200 bg-white">
            <p className="px-4 py-12 text-center text-gray-400">
              No scores available yet for this season.
            </p>
          </div>
        )}
      </div>

      {/* ── Desktop table (hidden on mobile, visible on md+) ── */}
      <div className="hidden md:block overflow-x-auto rounded-xl shadow ring-1 ring-gray-200">
        <table
          className="w-full divide-y divide-gray-200 bg-white"
          style={{ tableLayout: "fixed" }}
        >
          <colgroup>
            <col style={{ width: `${RANK_COL_W}px` }} />
            {showNames && <col style={{ width: `${PLAYER_COL_W}px` }} />}
            <col style={{ width: `${TOTAL_COL_W}px` }} />
            {/* Course score columns share the remaining table width */}
          </colgroup>
          <thead>
            <tr className="bg-green-900 text-white">
              {/* Rank – sticky left */}
              <th
                scope="col"
                className="sticky z-20 bg-green-900 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                style={{ left: 0 }}
              >
                #
              </th>
              {/* Player – sticky left */}
              {showNames && (
                <th
                  scope="col"
                  className="sticky z-20 bg-green-900 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ left: RANK_COL_W }}
                >
                  Player
                </th>
              )}
              {/* Total – sticky left, moved before course columns */}
              <th
                scope="col"
                className="sticky z-20 bg-green-900 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider border-l border-green-700 border-r-2 border-r-green-700"
                style={{ left: totalColLeft }}
              >
                Total
              </th>
              {/* Course score columns (scrollable) */}
              {visibleCourses.map((course) => (
                <th
                  key={course.clubId}
                  scope="col"
                  colSpan={effectiveColsMap.get(course.clubId)}
                  className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider border-l border-green-700"
                >
                  <span className="block truncate" title={course.name}>
                    {course.name}
                  </span>
                </th>
              ))}
            </tr>
            {/* Sub-header: round numbers (required in green, bonus in yellow) */}
            <tr className="bg-green-50 text-green-800 text-xs">
              <th
                className="sticky z-20 bg-green-50 px-2 py-2"
                style={{ left: 0 }}
              />
              {showNames && (
                <th
                  className="sticky z-20 bg-green-50 px-3 py-2"
                  style={{ left: RANK_COL_W }}
                />
              )}
              <th
                className="sticky z-20 bg-green-50 px-3 py-2 border-l border-green-200 border-r-2 border-r-green-200"
                style={{ left: totalColLeft }}
              />
              {visibleCourses.map((course) => {
                const numCols = effectiveColsMap.get(course.clubId) ?? 0;
                return Array.from({ length: numCols }, (_, i) => {
                  const isBonus = i >= course.roundsCount;
                  return (
                    <th
                      key={`${course.clubId}-r${i + 1}`}
                      className={`px-3 py-2 text-center font-medium ${i === 0 ? "border-l border-green-200" : ""} ${isBonus ? "text-yellow-600" : ""}`}
                    >
                      R{i + 1}
                    </th>
                  );
                });
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {players.map((player, index) => (
              <PlayerRow
                key={player.member.individualId}
                rank={index + 1}
                player={player}
                courses={visibleCourses}
                effectiveColsMap={effectiveColsMap}
                year={scores.year}
                showNames={showNames}
                totalColLeft={totalColLeft}
              />
            ))}
            {players.length === 0 && (
              <tr>
                <td
                  colSpan={1 + (showNames ? 1 : 0) + 1 + totalScoreCols}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  No scores available yet for this season.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 px-4 sm:px-6 lg:px-0 text-xs text-gray-400 text-right">
        Last updated: {new Date(scores.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}

interface PlayerRowProps {
  rank: number;
  player: PlayerScore;
  courses: Course[];
  effectiveColsMap: Map<string, number>;
  year: number;
  showNames: boolean;
  totalColLeft: number;
}

function PlayerRow({ rank, player, courses, effectiveColsMap, year, showNames, totalColLeft }: PlayerRowProps) {
  const isLeader = rank === 1;
  // Explicit background for sticky cells — bg-inherit is not reliable across browsers
  // for sticky-positioned table cells. We derive the row background and apply it directly.
  const rowBg = isLeader ? "bg-yellow-50" : rank % 2 === 0 ? "bg-gray-50" : "bg-white";

  return (
    <tr
      className={`group transition-colors ${rowBg} ${
        isLeader ? "font-semibold ring-1 ring-inset ring-yellow-300" : ""
      } hover:bg-green-50`}
    >
      {/* Rank – sticky */}
      <td
        className={`sticky z-10 ${rowBg} group-hover:bg-green-50 px-2 py-3 text-sm text-gray-500 text-center`}
        style={{ left: 0 }}
      >
        {isLeader ? (
          <span title="Leader" aria-label="Leader">
            🏆
          </span>
        ) : (
          rank
        )}
      </td>

      {/* Player name – sticky (only when showNames is true) */}
      {showNames && (
        <td
          className={`sticky z-10 ${rowBg} group-hover:bg-green-50 px-3 py-3 text-sm font-medium text-gray-900`}
          style={{ left: RANK_COL_W }}
        >
          <a
            href={`${import.meta.env.BASE_URL}${year}/${toSlug(player.member.name)}`}
            className="hover:text-green-700 hover:underline"
          >
            {player.member.name}
          </a>
          {!player.member.paid && (
            <span
              className="ml-1.5 text-red-500 font-bold"
              title="Dues not yet paid"
              aria-label="Dues not yet paid"
            >
              $
            </span>
          )}
        </td>
      )}

      {/* Total – sticky, moved before course columns */}
      <td
        className={`sticky z-10 ${rowBg} group-hover:bg-green-50 px-3 py-3 text-sm text-center font-semibold text-yellow-700 border-l border-r-2 border-gray-200 tabular-nums`}
        style={{ left: totalColLeft }}
      >
        {player.totalScore > 0
          ? formatScore(player.totalScore)
          : "–"}
      </td>

      {/* Best rounds per course */}
      {courses.map((course) => {
        const numCols = effectiveColsMap.get(course.clubId) ?? 0;
        const bestRounds = player.bestRoundsByCourse[course.clubId] ?? [];
        return Array.from({ length: numCols }, (_, i) => {
          const round = bestRounds[i];
          return (
            <td
              key={`${course.clubId}-r${i + 1}`}
              className={`px-3 py-3 text-sm text-center tabular-nums ${
                i === 0 ? "border-l border-gray-100" : ""
              } ${round ? "text-gray-700" : "text-gray-300"}`}
              title={round ? `${round.courseName} – ${round.date}` : undefined}
            >
              {round ? round.score : "–"}
            </td>
          );
        });
      })}
    </tr>
  );
}

interface MobilePlayerCardProps {
  rank: number;
  player: PlayerScore;
  courses: Course[];
  year: number;
}

function MobilePlayerCard({ rank, player, courses, year }: MobilePlayerCardProps) {
  const isLeader = rank === 1;
  const hasCourseScores = courses.some(
    (c) => (player.bestRoundsByCourse[c.clubId] ?? []).length > 0
  );

  return (
    <div
      className={`rounded-xl overflow-hidden shadow ring-1 ${
        isLeader ? "ring-yellow-300" : "ring-gray-200"
      } bg-white`}
    >
      {/* Player header: rank, name, total */}
      <div
        className={`flex items-center justify-between px-4 py-3 ${
          isLeader ? "bg-yellow-50" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 w-6 text-center shrink-0 tabular-nums">
            {isLeader ? (
              <span title="Leader" aria-label="Leader">
                🏆
              </span>
            ) : (
              rank
            )}
          </span>
          <div>
            <a
              href={`${import.meta.env.BASE_URL}${year}/${toSlug(player.member.name)}`}
              className="text-sm font-semibold text-gray-900 hover:text-green-700 hover:underline"
            >
              {player.member.name}
            </a>
            {!player.member.paid && (
              <span
                className="ml-1.5 text-red-500 font-bold text-xs"
                title="Dues not yet paid"
                aria-label="Dues not yet paid"
              >
                $
              </span>
            )}
          </div>
        </div>
        <span className="text-sm font-semibold text-yellow-700 tabular-nums">
          {player.totalScore > 0 ? formatScore(player.totalScore) : "–"}
        </span>
      </div>

      {/* Course scores (only shown if the player has any scores) */}
      {hasCourseScores && (
        <div className="border-t border-gray-100 bg-gray-50 divide-y divide-gray-100">
          {courses.map((course) => {
            const bestRounds = player.bestRoundsByCourse[course.clubId] ?? [];
            if (bestRounds.length === 0) return null;
            return (
              <div
                key={course.clubId}
                className="px-4 py-2 flex items-center justify-between gap-4"
              >
                <span
                  className="text-xs text-gray-500 flex-1 min-w-0 truncate"
                  title={course.name}
                >
                  {course.name}
                </span>
                <div className="flex gap-3 text-sm tabular-nums shrink-0">
                  {bestRounds.map((round, i) => (
                    <span
                      key={i}
                      className={
                        i >= course.roundsCount
                          ? "text-yellow-600"
                          : "text-gray-700"
                      }
                      title={`${round.courseName} – ${round.date}`}
                    >
                      R{i + 1}: {round.score}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
