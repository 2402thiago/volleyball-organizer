// TypeScript interfaces for Volleyball Organizer System

export interface Participant {
  id: string;
  name: string;
  photoUrl: string | null;
  gender: 'M' | 'F';
  createdAt: Date;
}

export interface Evaluation {
  id: string;
  participantId: string;
  evaluatorName: 'Thiago' | 'Ramon' | 'Douglas';
  level: 'Capitao' | 'Levantador M' | 'Levantador F' | 'M1' | 'F1' | 'M2/F2';
  ranking: number;
  createdAt: Date;
}

export interface TeamAssignment {
  id: string;
  participantId: string;
  teamNumber: 1 | 2 | 3 | 4;
  positionInTeam: 'Capitao' | 'Levantador M' | 'Levantador F' | 'M1' | 'F1' | 'M2/F2';
  assignedAt: Date;
}

// Consensus calculation result
export interface Consensus {
  participantId: string;
  level: 'Capitao' | 'Levantador M' | 'Levantador F' | 'M1' | 'F1' | 'M2/F2';
  averageRanking: number;
  rankingCount: number;
}

// Participant with consensus data (for admin override view)
export interface ParticipantWithConsensus extends Participant {
  consensusLevel: string | null;
  averageRanking: number | null;
}

// Team structure for generation/display
export interface Team {
  number: 1 | 2 | 3 | 4;
  players: Array<{
    participant: Participant;
    consensus: Consensus;
    positionInTeam: 'Capitao' | 'Levantador M' | 'Levantador F' | 'M1' | 'F1' | 'M2/F2';
  }>;
}

// Database query result types
export interface ParticipantWithEvaluations extends Participant {
  evaluations: Evaluation[];
}

export interface ParticipantWithConsensus extends Participant {
  consensus: Consensus;
}