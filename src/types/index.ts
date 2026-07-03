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
  rules: RulesConfig;
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
 * Contains members, courses, and season-specific rules content for a single season.
 */
export interface YearConfig {
  members: Member[];
  courses: Course[];
  bonusRoundsCount?: number;
  rules: RulesConfig;
}

export interface TeamSeeding {
  team: string;
  seeds: number[];
}

export interface ChampionshipFormat {
  round: string;
  format: string;
}

export interface RulesConfig {
  introduction: string[];
  scoreSubmissionEmail: string;
  scoreSubmissionDeadline: string;
  championship: {
    dateLabel: string;
    location: string;
    teamSeedings: TeamSeeding[];
    formats: ChampionshipFormat[];
  };
  entry: {
    fee: string;
    feeNote: string;
    firstPrize: string;
    firstPrizeNote: string;
    secondPrize: string;
    additionalPrizes: string;
    paymentMethod: string;
    paymentEmail: string;
    paymentDeadline: string;
  };
}

export interface Round {
  date: string;
  courseId: string;
  courseName: string;
  tee?: string;
  score: number;
  differential: number;
  holes: string;
  scaledHolesPlayed?: number | null;
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
