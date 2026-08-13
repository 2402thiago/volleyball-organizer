"use strict";
// Database client - using SQLite for development, to be replaced with Vercel Postgres in production
// For production on Vercel, we use the @vercel/postgres version
const { Pool } = require('@vercel/postgres');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
// Determine environment: if we are in production (Vercel) use Postgres, otherwise use SQLite
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
// Initialize database connection
let db;
if (isProduction) {
    // Use Vercel Postgres
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
        throw new Error('POSTGRES_URL environment variable is required for production');
    }
    db = new Pool({ connectionString });
    console.log('Connected to Vercel Postgres database');
}
else {
    // Use SQLite for development
    const dbPath = path.join(process.cwd(), 'volleyball.db');
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    console.log('Connected to SQLite database');
}
// Function to execute SQL query with proper parameter handling
async function query(text, params = []) {
    if (isProduction) {
        // For Postgres, we need to convert ? placeholders to $1, $2, etc.
        let queryText = text;
        const values = [...params];
        // Replace ? with $1, $2, etc.
        for (let i = 0; i < values.length; i++) {
            queryText = queryText.replace('?', `$${i + 1}`);
        }
        const result = await db.query(queryText, values);
        return result.rows;
    }
    else {
        // For SQLite
        try {
            const stmt = db.prepare(text);
            return stmt.all(params);
        }
        catch (error) {
            console.error('Database query error:', error, { text, params });
            throw error;
        }
    }
}
// Function to execute SQL update/insert and return last insert ID or affected rows
async function run(text, params = []) {
    if (isProduction) {
        // For Postgres, we need to convert ? placeholders to $1, $2, etc.
        let queryText = text;
        const values = [...params];
        // Replace ? with $1, $2, etc.
        for (let i = 0; i < values.length; i++) {
            queryText = queryText.replace('?', `$${i + 1}`);
        }
        const result = await db.query(queryText, values);
        // For INSERT, we can return the row count or the inserted id if we use RETURNING
        // We'll handle RETURNING in the specific functions if needed
        return result;
    }
    else {
        // For SQLite
        try {
            const stmt = db.prepare(text);
            const info = stmt.run(params);
            return info;
        }
        catch (error) {
            console.error('Database run error:', error, { text, params });
            throw error;
        }
    }
}
// Initialize database schema
async function initializeDatabase() {
    try {
        let schemaPath;
        if (isProduction) {
            schemaPath = path.join(process.cwd(), 'lib', 'db.postgres.sql');
        }
        else {
            schemaPath = path.join(process.cwd(), 'lib', 'db.sqlite.sql');
        }
        // Check if schema file exists
        if (!fs.existsSync(schemaPath)) {
            console.error(`Schema file not found: ${schemaPath}`);
            // Fallback to the original db.sql for backward compatibility
            schemaPath = path.join(process.cwd(), 'lib', 'db.sql');
            if (!fs.existsSync(schemaPath)) {
                throw new Error('No schema file found');
            }
        }
        const schema = fs.readFileSync(schemaPath, 'utf8');
        // Split by statements and execute each
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        for (const statement of statements) {
            if (isProduction) {
                await db.query(statement);
            }
            else {
                db.prepare(statement).run();
            }
        }
        console.log('Database initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}
// Initialize on module load
if (isProduction) {
    initializeDatabase().catch(err => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
}
else {
    initializeDatabase();
}
// Participant queries
async function getParticipants() {
    return query(`
    SELECT id, name, photo_url as "photoUrl", gender, created_at as "createdAt"
    FROM participants
    ORDER BY name
  `);
}
async function getParticipantById(id) {
    const results = await query(`
    SELECT id, name, photo_url as "photoUrl", gender, created_at as "createdAt"
    FROM participants
    WHERE id = ?
  `, [id]);
    return results[0] || null;
}
async function createParticipant(participant) {
    if (isProduction) {
        // For Postgres, we use RETURNING id
        const result = await db.query(`
      INSERT INTO participants (name, photo_url, gender)
      VALUES ($1, $2, $3)
      RETURNING id, name, photo_url, gender, created_at
    `, [participant.name, participant.photoUrl, participant.gender]);
        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            photoUrl: row.photo_url,
            gender: row.gender,
            createdAt: row.created_at
        };
    }
    else {
        // For SQLite
        const info = db.prepare(`
      INSERT INTO participants (name, photo_url, gender)
      VALUES (?, ?, ?)
    `).run(participant.name, participant.photoUrl, participant.gender);
        const id = info.lastInsertRowid;
        return {
            id: id.toString(),
            name: participant.name,
            photoUrl: participant.photoUrl,
            gender: participant.gender,
            createdAt: new Date() // We don't have the timestamp from INSERT, but we can query it
        };
    }
}
// Evaluation queries
async function getEvaluationsByParticipantId(participantId) {
    return query(`
    SELECT id, participant_id as "participantId", evaluator_name as "evaluatorName", level, ranking, created_at as "createdAt"
    FROM evaluations
    WHERE participant_id = ?
    ORDER BY evaluator_name
  `, [participantId]);
}
async function createEvaluation(evaluation) {
    if (isProduction) {
        // For Postgres, we use RETURNING id
        const result = await db.query(`
      INSERT INTO evaluations (participant_id, evaluator_name, level, ranking)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT(participant_id, evaluator_name)
      DO UPDATE SET
        level = EXCLUDED.level,
        ranking = EXCLUDED.ranking,
        created_at = CURRENT_TIMESTAMP
      RETURNING id, participant_id, evaluator_name, level, ranking, created_at
    `, [evaluation.participantId, evaluation.evaluatorName, evaluation.level, evaluation.ranking]);
        const row = result.rows[0];
        return {
            id: row.id,
            participantId: row.participant_id,
            evaluatorName: row.evaluator_name,
            level: row.level,
            ranking: row.ranking,
            createdAt: row.created_at
        };
    }
    else {
        // For SQLite
        const info = db.prepare(`
      INSERT INTO evaluations (participant_id, evaluator_name, level, ranking)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(participant_id, evaluator_name)
      DO UPDATE SET
        level = excluded.level,
        ranking = excluded.ranking,
        created_at = CURRENT_TIMESTAMP
    `).run(evaluation.participantId, evaluation.evaluatorName, evaluation.level, evaluation.ranking);
        // If it was an update, we don't get a new rowid, so we need to fetch the record
        let id = info.lastInsertRowid;
        if (id === 0) {
            // It was an update, get the existing id
            const existing = await query(`
        SELECT id FROM evaluations 
        WHERE participant_id = ? AND evaluator_name = ?
      `, [evaluation.participantId, evaluation.evaluatorName]);
            id = existing[0].id;
        }
        return {
            id: id.toString(),
            participantId: evaluation.participantId,
            evaluatorName: evaluation.evaluatorName,
            level: evaluation.level,
            ranking: evaluation.ranking,
            createdAt: new Date() // Approximate - in a real app we'd return the actual timestamp
        };
    }
}
async function deleteEvaluation(participantId, evaluatorName) {
    if (isProduction) {
        await db.query(`
      DELETE FROM evaluations
      WHERE participant_id = $1 AND evaluator_name = $2
    `, [participantId, evaluatorName]);
    }
    else {
        db.prepare(`
      DELETE FROM evaluations
      WHERE participant_id = ? AND evaluator_name = ?
    `).run(participantId, evaluatorName);
    }
}
// Team assignment queries
async function getTeamAssignments() {
    return query(`
    SELECT id, participant_id as "participantId", team_number as "teamNumber", position_in_team as "positionInTeam", assigned_at as "assignedAt"
    FROM team_assignments
    ORDER BY team_number, position_in_team
  `);
}
async function createTeamAssignment(assignment) {
    if (isProduction) {
        // For Postgres, we use RETURNING id
        const result = await db.query(`
      INSERT INTO team_assignments (participant_id, team_number, position_in_team)
      VALUES ($1, $2, $3)
      ON CONFLICT(participant_id, team_number)
      DO UPDATE SET
        position_in_team = EXCLUDED.position_in_team,
        assigned_at = CURRENT_TIMESTAMP
      RETURNING id, participant_id, team_number, position_in_team, assigned_at
    `, [assignment.participantId, assignment.teamNumber, assignment.positionInTeam]);
        const row = result.rows[0];
        return {
            id: row.id,
            participantId: row.participant_id,
            teamNumber: row.team_number,
            positionInTeam: row.position_in_team,
            assignedAt: row.assigned_at
        };
    }
    else {
        // For SQLite
        const info = db.prepare(`
      INSERT INTO team_assignments (participant_id, team_number, position_in_team)
      VALUES (?, ?, ?)
      ON CONFLICT(participant_id, team_number)
      DO UPDATE SET
        position_in_team = excluded.position_in_team,
        assigned_at = CURRENT_TIMESTAMP
    `).run(assignment.participantId, assignment.teamNumber, assignment.positionInTeam);
        let id = info.lastInsertRowid;
        if (id === 0) {
            const existing = await query(`
        SELECT id FROM team_assignments 
        WHERE participant_id = ? AND team_number = ?
      `, [assignment.participantId, assignment.teamNumber]);
            id = existing[0].id;
        }
        return {
            id: id.toString(),
            participantId: assignment.participantId,
            teamNumber: assignment.teamNumber,
            positionInTeam: assignment.positionInTeam,
            assignedAt: new Date() // Approximate
        };
    }
}
async function deleteTeamAssignment(participantId, teamNumber) {
    if (isProduction) {
        await db.query(`
      DELETE FROM team_assignments
      WHERE participant_id = $1 AND team_number = $2
    `, [participantId, teamNumber]);
    }
    else {
        db.prepare(`
      DELETE FROM team_assignments
      WHERE participant_id = ? AND team_number = ?
    `).run(participantId, teamNumber);
    }
}
// Helper to get evaluations for consensus calculation (moved to service layer)
async function getEvaluationsForConsensus() {
    return query(`
    SELECT id, participant_id as "participantId", evaluator_name as "evaluatorName", level, ranking, created_at as "createdAt"
    FROM evaluations
    ORDER BY participant_id, evaluator_name
  `);
}
// Consensus queries
async function getConsensusForParticipant(participantId) {
    const results = await query(`
    SELECT participant_id as "participantId", consensus_level as "consensusLevel", average_ranking as "averageRanking", updated_at as "updatedAt"
    FROM participant_consensus
    WHERE participant_id = ?
  `, [participantId]);
    return results[0] || null;
}
async function updateConsensus(participantId, consensusLevel, averageRanking) {
    if (isProduction) {
        // For Postgres, we use RETURNING
        const result = await db.query(`
      INSERT INTO participant_consensus (participant_id, consensus_level, average_ranking, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT(participant_id)
      DO UPDATE SET
        consensus_level = EXCLUDED.consensus_level,
        average_ranking = EXCLUDED.average_ranking,
        updated_at = CURRENT_TIMESTAMP
      RETURNING participant_id, consensus_level, average_ranking, updated_at
    `, [participantId, consensusLevel, averageRanking]);
        const row = result.rows[0];
        return {
            participantId: row.participant_id,
            consensusLevel: row.consensus_level,
            averageRanking: row.average_ranking,
            updatedAt: row.updated_at
        };
    }
    else {
        // For SQLite
        const info = db.prepare(`
      INSERT INTO participant_consensus (participant_id, consensus_level, average_ranking, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(participant_id)
      DO UPDATE SET
        consensus_level = excluded.consensus_level,
        average_ranking = excluded.average_ranking,
        updated_at = CURRENT_TIMESTAMP
    `).run(participantId, consensusLevel, averageRanking);
        // Return the updated record
        return getConsensusForParticipant(participantId);
    }
}
async function recalculateConsensusFromEvaluations() {
    // Get all evaluations
    const evaluations = await getEvaluationsForConsensus();
    // Group by participant
    const participantEvals = {};
    evaluations.forEach(evaluation => {
        const pid = evaluation.participantId;
        if (!participantEvals[pid]) {
            participantEvals[pid] = { levels: [], rankings: [] };
        }
        participantEvals[pid].levels.push(evaluation.level);
        participantEvals[pid].rankings.push(evaluation.ranking);
    });
    // For each participant, calculate mode of levels and average of rankings
    const results = [];
    for (const [participantId, data] of Object.entries(participantEvals)) {
        // Calculate mode (most frequent level)
        const levelCounts = {};
        let maxCount = 0;
        let modeLevel = null;
        data.levels.forEach(level => {
            levelCounts[level] = (levelCounts[level] || 0) + 1;
            if (levelCounts[level] > maxCount) {
                maxCount = levelCounts[level];
                modeLevel = level;
            }
        });
        // Calculate average ranking
        const avgRanking = data.rankings.reduce((sum, rank) => sum + rank, 0) / data.rankings.length;
        // Update or insert consensus
        await updateConsensus(participantId, modeLevel, parseFloat(avgRanking.toFixed(1)));
        results.push({
            participantId,
            consensusLevel: modeLevel,
            averageRanking: parseFloat(avgRanking.toFixed(1))
        });
    }
    return results;
}
// Get all participants with their consensus data (if exists)
async function getParticipantsWithConsensus() {
    return query(`
    SELECT 
      p.id, 
      p.name, 
      p.photo_url as "photoUrl", 
      p.gender, 
      p.created_at as "createdAt",
      pc.consensus_level as "consensusLevel",
      pc.average_ranking as "averageRanking"
    FROM participants p
    LEFT JOIN participant_consensus pc ON p.id = pc.participant_id
    ORDER BY p.name
  `);
}
module.exports = {
    getParticipants,
    getParticipantById,
    createParticipant,
    getEvaluationsByParticipantId,
    createEvaluation,
    deleteEvaluation,
    getTeamAssignments,
    createTeamAssignment,
    deleteTeamAssignment,
    getEvaluationsForConsensus,
    // Consensus functions
    getConsensusForParticipant,
    updateConsensus,
    recalculateConsensusFromEvaluations,
    getParticipantsWithConsensus
};
