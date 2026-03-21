import { useState } from "react";
import type { Course, PlayerScore, Round } from "../types/index.js";

interface PlayerRoundsProps {
  player: PlayerScore;
  courses: Course[];
}

type SortField = "course" | "date" | "score" | "differential";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return <span className="ml-1 text-green-300 opacity-60">⇅</span>;
  }
  return (
    <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>
  );
}

export function PlayerRounds({ player, courses }: PlayerRoundsProps) {
  const [sortField, setSortField] = useState<SortField>("course");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sorted = [...player.rounds].sort((a, b) => {
    let cmp = 0;
    if (sortField === "course") {
      cmp = a.courseName.localeCompare(b.courseName);
    } else if (sortField === "date") {
      cmp = a.date.localeCompare(b.date);
    } else if (sortField === "score") {
      cmp = a.score - b.score;
    } else if (sortField === "differential") {
      cmp = a.differential - b.differential;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  function thClass(field: SortField) {
    return `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none hover:bg-green-700 transition-colors ${sortField === field ? "bg-green-700" : ""}`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {player.member.name}
      </h1>

      {player.rounds.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">
          No rounds recorded yet for this season.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0 lg:rounded-xl lg:shadow lg:ring-1 lg:ring-gray-200">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead>
              <tr className="bg-green-900 text-white">
                <th
                  scope="col"
                  className={thClass("course")}
                  onClick={() => handleSort("course")}
                >
                  Course
                  <SortIcon active={sortField === "course"} dir={sortDir} />
                </th>
                <th
                  scope="col"
                  className={thClass("date")}
                  onClick={() => handleSort("date")}
                >
                  Date
                  <SortIcon active={sortField === "date"} dir={sortDir} />
                </th>
                <th
                  scope="col"
                  className={`${thClass("score")} text-center`}
                  onClick={() => handleSort("score")}
                >
                  Score
                  <SortIcon active={sortField === "score"} dir={sortDir} />
                </th>
                <th
                  scope="col"
                  className={`${thClass("differential")} text-center`}
                  onClick={() => handleSort("differential")}
                >
                  Differential
                  <SortIcon active={sortField === "differential"} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((round, i) => (
                <RoundRow key={`${round.courseId}-${round.date}`} round={round} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Best rounds summary */}
      {Object.keys(player.bestRoundsByCourse).length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Best Rounds (used in total)
          </h2>
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0 lg:rounded-xl lg:shadow lg:ring-1 lg:ring-gray-200">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
              <thead>
                <tr className="bg-green-50 text-green-800 text-xs">
                  <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-center font-semibold uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-2 text-center font-semibold uppercase tracking-wider">
                    Differential
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.flatMap((course) =>
                  (player.bestRoundsByCourse[course.clubId] ?? []).map(
                    (round, i) => (
                      <RoundRow
                        key={`best-${round.courseId}-${round.date}`}
                        round={round}
                        index={i}
                        highlight
                      />
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm font-semibold text-green-800 text-right">
            Total: {player.totalScore > 0 ? player.totalScore.toFixed(1) : "–"}
          </p>
        </div>
      )}
    </div>
  );
}

interface RoundRowProps {
  round: Round;
  index: number;
  highlight?: boolean;
}

function RoundRow({ round, index, highlight }: RoundRowProps) {
  const bg = highlight
    ? "bg-yellow-50"
    : index % 2 === 0
      ? "bg-white"
      : "bg-gray-50";

  return (
    <tr className={`${bg} hover:bg-green-50 transition-colors`}>
      <td className="px-4 py-3 text-sm text-gray-800">{round.courseName}</td>
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {new Date(round.date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td className="px-4 py-3 text-sm text-center tabular-nums text-gray-700">
        {round.score}
      </td>
      <td className="px-4 py-3 text-sm text-center tabular-nums font-medium text-green-800">
        {round.differential.toFixed(1)}
      </td>
    </tr>
  );
}
