-- Database schema for Volleyball Organizer System

-- Participants table: stores all registered players
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    gender CHAR(1) CHECK (gender IN ('M', 'F')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evaluations table: stores level and ranking assignments by evaluators
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    evaluator_name VARCHAR(50) NOT NULL CHECK (evaluator_name IN ('Thiago', 'Ramon', 'Douglas')),
    level VARCHAR(20) NOT NULL,
    ranking INTEGER NOT NULL CHECK (ranking >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, evaluator_name) -- Prevent duplicate evaluations by same evaluator
);

-- Team assignments table: stores which team each participant is assigned to
CREATE TABLE IF NOT EXISTS team_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    team_number INTEGER NOT NULL CHECK (team_number BETWEEN 1 AND 4),
    position_in_team VARCHAR(20) NOT NULL, -- e.g., 'Capitao', 'Levantador M', etc.
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, team_number) -- Prevent same participant in multiple teams
);

-- Participant consensus table: stores the consensus level and average ranking for each participant
CREATE TABLE IF NOT EXISTS participant_consensus (
    participant_id UUID PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
    consensus_level VARCHAR(20),
    average_ranking DECIMAL(3,1),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_evaluations_participant ON evaluations(participant_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON evaluations(evaluator_name);
CREATE INDEX IF NOT EXISTS idx_team_assignments_team ON team_assignments(team_number);
CREATE INDEX IF NOT EXISTS idx_participants_gender ON participants(gender);