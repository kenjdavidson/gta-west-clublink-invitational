export interface Member {
  name: string;
  individualId: number;
  cardId?: string;
  paid?: boolean;
  /**
   * Optional Golf Canada club ID for the member's home course.
   * Used as a fallback when the Golf Canada API returns `course: null` for
   * a score that has `type === "H"` (home-club score). This allows home-club
   * rounds to be matched to the correct league course even when the API omits
   * the course name.
   */
  homeClubId?: string;
}

export interface Course {
  name: string;
  clubId: string;
  roundsCount: number;
  tee?: string;
}

export interface League {
  name: string;
  currentYear: number;
  bonusRoundsCount?: number;
  githubRepo?: string;
}

export interface LeagueConfig {
  league: League;
  members: Member[];
  courses: Course[];
}

export interface Round {
  date: string;
  courseId: string;
  courseName: string;
  tee?: string;
  score: number;
  differential: number;
  holes: string;
}

export interface PlayerScore {
  member: Member;
  rounds: Round[];
  bestRoundsByCourse: Record<string, Round[]>;
  totalScore: number;
}

export interface YearlyScores {
  year: number;
  generatedAt: string;
  players: PlayerScore[];
}
