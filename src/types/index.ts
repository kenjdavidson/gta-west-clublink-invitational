export interface Member {
  name: string;
  individualId: number;
  cardId?: string;
  paid?: boolean;
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

/**
 * Site-level configuration stored in `config/site.json`.
 * Contains information that applies across all seasons.
 */
export interface SiteConfig {
  league: {
    name: string;
    currentYear: number;
    githubRepo?: string;
  };
}

/**
 * Year-specific configuration stored in `config/{year}/config.json`.
 * Contains members, courses, and scoring rules for a single season.
 */
export interface YearConfig {
  members: Member[];
  courses: Course[];
  bonusRoundsCount?: number;
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
