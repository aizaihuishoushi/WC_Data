export interface Team {
  code: string;
  name: string;       // 中文名称
  nameEn?: string;    // 英文名称（可选）
  logo: string;
  founded: number;
}

export interface Match {
  id: string;
  date: string;
  time: string;
  stage: 'group' | 'knockout' | 'round16' | 'quarter' | 'semi' | 'final';
  rawStage?: string;
  group?: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'upcoming' | 'finished';
  venue: string;
}

export interface MatchRecord {
  opponent: string;
  score: string;
  result: 'win' | 'draw' | 'loss';
  goalsFor: number;
  goalsAgainst: number;
}

export interface Participation {
  year: number;
  stage: string;
  matches: MatchRecord[];
}

export interface TeamStats {
  totalParticipations: number;
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  totalGoals: number;
}

export interface TeamHistory {
  teamCode: string;
  participations: Participation[];
  stats: TeamStats;
}
