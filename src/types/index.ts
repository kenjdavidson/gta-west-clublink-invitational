export interface Member {
  name: string;
  memberNumber: string;
  golfCanadaId: string;
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
  score: number;
  differential: number;
  tee?: string;
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
