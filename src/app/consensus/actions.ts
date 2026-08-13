'use server';

const { updateConsensus, recalculateConsensusFromEvaluations } = require('../../lib/db');

export async function saveConsensusOverride(
  participantId,
  consensusLevel,
  averageRanking
) {
  try {
    // Validate inputs
    if (!participantId) {
      throw new Error('Participant ID is required');
    }
    
    // Update consensus in database
    const result = updateConsensus(participantId, consensusLevel, averageRanking);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error saving consensus override:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function recalculateConsensus() {
  try {
    // Recalculate consensus from evaluations
    const results = recalculateConsensusFromEvaluations();
    
    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error('Error recalculating consensus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}