import type { Course, PlayerScore, YearlyScores } from "../types/index.js";
import { toSlug } from "../utils/slug.js";

interface LeaderboardProps {
  scores: YearlyScores;
  courses: Course[];
}

function formatDifferential(value: number): string {
  return value.toFixed(1);
}

export function Leaderboard({ scores, courses }: LeaderboardProps) {
  const { players } = scores;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="overflow-x-auto rounded-xl shadow ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead>
            <tr className="bg-green-900 text-white">
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-8"
              >
                #
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              >
                Player
              </th>
              {courses.map((course) => (
                <th
                  key={course.clubId}
                  scope="col"
                  colSpan={course.roundsCount}
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider border-l border-green-700"
                >
                  <span className="block">{course.name}</span>
                </th>
              ))}
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider border-l border-green-700"
              >
                Total
              </th>
            </tr>
            {/* Sub-header: round numbers */}
            <tr className="bg-green-50 text-green-800 text-xs">
              <th className="px-4 py-2" />
              <th className="px-4 py-2" />
              {courses.map((course) =>
                Array.from({ length: course.roundsCount }, (_, i) => (
                  <th
                    key={`${course.clubId}-r${i + 1}`}
                    className={`px-4 py-2 text-center font-medium ${i === 0 ? "border-l border-green-200" : ""}`}
                  >
                    R{i + 1}
                  </th>
                ))
              )}
              <th className="px-4 py-2 border-l border-green-200" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {players.map((player, index) => (
              <PlayerRow
                key={player.member.cardId}
                rank={index + 1}
                player={player}
                courses={courses}
                year={scores.year}
              />
            ))}
            {players.length === 0 && (
              <tr>
                <td
                  colSpan={
                    2 +
                    courses.reduce((sum, c) => sum + c.roundsCount, 0) +
                    1
                  }
                  className="px-4 py-12 text-center text-gray-400"
                >
                  No scores available yet for this season.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-gray-400 text-right">
        Last updated: {new Date(scores.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}

interface PlayerRowProps {
  rank: number;
  player: PlayerScore;
  courses: Course[];
  year: number;
}

function PlayerRow({ rank, player, courses, year }: PlayerRowProps) {
  const isLeader = rank === 1;

  return (
    <tr
      className={`transition-colors ${
        isLeader
          ? "bg-yellow-50 font-semibold ring-1 ring-inset ring-yellow-300"
          : rank % 2 === 0
            ? "bg-gray-50"
            : "bg-white"
      } hover:bg-green-50`}
    >
      {/* Rank */}
      <td className="px-4 py-3 text-sm text-gray-500 text-center">
        {isLeader ? (
          <span title="Leader" aria-label="Leader">
            🏆
          </span>
        ) : (
          rank
        )}
      </td>

      {/* Player name */}
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        <a
          href={`${import.meta.env.BASE_URL}${year}/${toSlug(player.member.name)}`}
          className="hover:text-green-700 hover:underline"
        >
          {player.member.name}
        </a>
      </td>

      {/* Best rounds per course */}
      {courses.map((course) => {
        const bestRounds = player.bestRoundsByCourse[course.clubId] ?? [];
        return Array.from({ length: course.roundsCount }, (_, i) => {
          const round = bestRounds[i];
          return (
            <td
              key={`${course.clubId}-r${i + 1}`}
              className={`px-4 py-3 text-sm text-center tabular-nums ${
                i === 0 ? "border-l border-gray-100" : ""
              } ${round ? "text-gray-700" : "text-gray-300"}`}
              title={round ? `${round.courseName} – ${round.date}` : undefined}
            >
              {round ? formatDifferential(round.differential) : "–"}
            </td>
          );
        });
      })}

      {/* Total */}
      <td className="px-4 py-3 text-sm text-center font-semibold text-yellow-700 border-l border-gray-100 tabular-nums">
        {player.totalScore > 0
          ? formatDifferential(player.totalScore)
          : "–"}
      </td>
    </tr>
  );
}

