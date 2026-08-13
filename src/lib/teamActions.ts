'use server';

const db = require('./db');
import { Participant, Consensus } from '../types/index';

export type TeamGenerationResult = {
  success: boolean;
  teams?: Array<{
    number: 1 | 2 | 3 | 4;
    players: Array<{
      participant: Participant;
      consensus: Consensus;
      positionInTeam: 'Capitao' | 'Levantador M' | 'Levantador F' | 'M1' | 'F1' | 'M2/F2';
    }>;
  }>;
  error?: string;
};

/**
 * Generate teams based on consensus data.
 * Algorithm:
 * 1. Fetch all participants with consensus level and average ranking.
 * 2. Group by consensus level.
 * 3. For each level, select top 4 participants by average ranking (lower is better).
 * 4. This gives us exactly 24 participants (6 levels * 4 = 24).
 * 5. Assign to 4 teams using snake draft: for each level in fixed order,
 *    assign participants to teams in round-robin, alternating direction each level.
 * 6. After assignment, check gender constraint: each team must have at least one female.
 *    If any team lacks a female, attempt to swap participants between teams
 *    (while preserving level constraint) to fix gender imbalance.
 * 7. Store the generated teams in team_assignments table (clearing previous assignments).
 */
export async function generateTeams(): Promise<TeamGenerationResult> {
  try {
    // Step 1: Get participants with consensus data
    const participantsWithConsensus = db.getParticipantsWithConsensus();

    // Filter to only those with consensus level and average ranking (not null)
    const eligibleParticipants = participantsWithConsensus.filter(
      p => p.consensusLevel !== null && p.averageRanking !== null
    );

    // Step 2: Group by consensus level
    const levels = [
      'Capitao',
      'Levantador M',
      'Levantador F',
      'M1',
      'F1',
      'M2/F2'
    ] as const;

    const groupedByLevel: Record<string, typeof eligibleParticipants> = {};
    levels.forEach(level => {
      groupedByLevel[level] = eligibleParticipants.filter(p => p.consensusLevel === level);
    });

    // Check that we have at least 4 participants for each level
    for (const level of levels) {
      if (groupedByLevel[level].length < 4) {
        return {
          success: false,
          error: `Level ${level} does not have enough participants. Need at least 4, but only found ${groupedByLevel[level].length}.`
        };
      }
    }

    // Step 3: For each level, select top 4 by average ranking (lower ranking number is better)
    const selectedByLevel: Record<string, typeof eligibleParticipants> = {};
    levels.forEach(level => {
      const sortedByRanking = [...groupedByLevel[level]].sort(
        (a, b) => (a.averageRanking ?? 0) - (b.averageRanking ?? 0)
      );
      selectedByLevel[level] = sortedByRanking.slice(0, 4);
    });

    // Step 4: Sort each level's participants by average ranking (ascending)
    // Already sorted in step 3, but we'll ensure it's sorted
    levels.forEach(level => {
      selectedByLevel[level].sort(
        (a, b) => (a.averageRanking ?? 0) - (b.averageRanking ?? 0)
      );
    });

    // Step 5: Snake draft assignment
    // We'll create 4 teams, each with 6 positions (one per level)
    const teams: Array<{
      number: 1 | 2 | 3 | 4;
      players: Array<{
        participant: Participant;
        consensus: Consensus;
        positionInTeam: typeof levels[number];
      }>;
    }> = [
      { number: 1, players: [] },
      { number: 2, players: [] },
      { number: 3, players: [] },
      { number: 4, players: [] }
    ];

    // For each level in order, assign to teams
    // We'll go left-to-right for even-indexed levels (0,2,4) and right-to-left for odd-indexed levels (1,3,5)
    levels.forEach((level, levelIndex) => {
      const participants = selectedByLevel[level];
      const isEvenIndex = levelIndex % 2 === 0;

      // Determine order of teams for this level
      const teamOrder = isEvenIndex
        ? [1, 2, 3, 4] as const
        : [4, 3, 2, 1] as const;

      teamOrder.forEach((teamNumber, playerIndex) => {
        const participant = participants[playerIndex];
        if (!participant) {
          // This should not happen if we have exactly 4 per level
          throw new Error(`Not enough participants for level ${level} at index ${playerIndex}`);
        }

        // Find the team object
        const team = teams.find(t => t.number === teamNumber);
        if (!team) {
          throw new Error(`Team ${teamNumber} not found`);
        }

        // Add player to team
        team.players.push({
          participant: {
            id: participant.id,
            name: participant.name,
            photoUrl: participant.photoUrl,
            gender: participant.gender,
            createdAt: participant.createdAt
          },
          consensus: {
            participantId: participant.id,
            level: participant.consensusLevel as Consensus['level'],
            averageRanking: participant.averageRanking as Consensus['averageRanking'],
            rankingCount: 0 // We don't have this in the query, but we can set to 0 or compute if needed
          },
          positionInTeam: level as any // Type assertion since level matches the positionInTeam union
        });
      });
    });

    // Step 6: Check gender constraint and fix if needed
    // Each team must have at least one female
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop
    let hasValidGender = false;

    while (!hasValidGender && attempts < maxAttempts) {
      hasValidGender = true;
      attempts++;

      // Check each team for at least one female
      for (const team of teams) {
        const hasFemale = team.players.some(p => p.participant.gender === 'F');
        if (!hasFemale) {
          hasValidGender = false;
          // Try to fix by swapping with another team that has at least two females
          // We'll look for a team with at least two females and swap a male of the same level
          const donorTeamIndex = teams.findIndex(t => {
            const femaleCount = t.players.filter(p => p.participant.gender === 'F').length;
            return femaleCount >= 2;
          });

          if (donorTeamIndex === -1) {
            // No donor team found, cannot fix
            break;
          }

          const donorTeam = teams[donorTeamIndex];
          // Find a male in the current team and a female in the donor team of the same level
          const maleInTeam = team.players.find(p => p.participant.gender === 'M');
          const femaleInDonor = donorTeam.players.find(
            p => p.participant.gender === 'F' && p.positionInTeam === maleInTeam?.positionInTeam
          );

          if (maleInTeam && femaleInDonor) {
            // Swap their positions (but keep the level constraint by swapping the entire player objects)
            const maleIndexInTeam = team.players.indexOf(maleInTeam);
            const femaleIndexInDonor = donorTeam.players.indexOf(femaleInDonor);

            // Swap
            [team.players[maleIndexInTeam], donorTeam.players[femaleIndexInDonor]] = [
              donorTeam.players[femaleIndexInDonor],
              team.players[maleIndexInTeam]
            ];

            // After swap, break and re-check all teams
            break;
          }
        }
      }
    }

    if (!hasValidGender) {
      return {
        success: false,
        error: `Unable to satisfy gender constraint (at least one female per team) after ${attempts} attempts.`
      };
    }

    // Step 7: Store the generated teams in the database
    // First, clear existing team assignments
    db.prepare(`DELETE FROM team_assignments`).run();

    // Then insert new assignments
    for (const team of teams) {
      for (const player of team.players) {
        db.createTeamAssignment({
          participantId: player.participant.id,
          teamNumber: team.number,
          positionInTeam: player.positionInTeam
        });
      }
    }

    // Return the generated teams
    return { success: true, teams };
  } catch (error) {
    console.error('Error generating teams:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating teams'
    };
  }
}