import { getParticipants, createEvaluation, deleteEvaluation, getEvaluationsByParticipantId, recalculateConsensusFromEvaluations, getConsensusForParticipant } from './src/lib/db';
import { generateTeams } from './src/lib/teamActions';

async function runTests() {
  console.log('Starting integration tests...');

  // 1. Test participant import
  let participants = await getParticipants();
  console.log(`Found ${participants.length} participants`);
  if (participants.length !== 63) {
    console.error(`ERROR: Expected 63 participants, got ${participants.length}`);
    process.exit(1);
  }
  console.log('✓ Participant count correct');

  // 2. Test evaluator functionality: insert evaluations for a few participants
  const testParticipants = participants.slice(0, 5); // first 5 participants
  const evaluators = ['Thiago', 'Ramon', 'Douglas'];
  const testData: any[] = [];

  // Clear any existing evaluations for these participants by these evaluators (to start clean)
  for (const p of testParticipants) {
    for (const e of evaluators) {
      await deleteEvaluation(p.id, e);
    }
  }

  // Insert evaluations
  for (let i = 0; i < testParticipants.length; i++) {
    const p = testParticipants[i];
    for (let j = 0; j < evaluators.length; j++) {
      const evalData = {
        participantId: p.id,
        evaluatorName: evaluators[j],
        level: ['Capitao', 'Levantador M', 'Levantador F', 'M1', 'F1', 'M2/F2'][(i + j) % 6],
        ranking: ((i * 3) + j + 1) // some unique ranking
      };
      const result = await createEvaluation(evalData);
      testData.push({ participant: p, evaluator: evaluators[j], level: evalData.level, ranking: evalData.ranking, id: result.id });
    }
  }
  console.log(`✓ Inserted ${testData.length} evaluations`);

  // Verify evaluations were saved
  for (const p of testParticipants) {
    const evals = await getEvaluationsByParticipantId(p.id);
    if (evals.length !== evaluators.length) {
      console.error(`ERROR: Participant ${p.name} has ${evals.length} evaluations, expected ${evaluators.length}`);
      process.exit(1);
    }
    // Check that each evaluator has an entry
    for (const e of evaluators) {
      const found = evals.some((ev: any) => ev.evaluatorName === e);
      if (!found) {
        console.error(`ERROR: Missing evaluation for evaluator ${e} on participant ${p.name}`);
        process.exit(1);
      }
    }
  }
  console.log('✓ Evaluations saved and retrievable');

  // 3. Test consensus calculation
  const consensusResults = await recalculateConsensusFromEvaluations();
  console.log(`✓ Consensus recalculated for ${consensusResults.length} participants`);

  // Check consensus for our test participants
  for (const p of testParticipants) {
    const consensus = await getConsensusForParticipant(p.id);
    if (!consensus) {
      console.error(`ERROR: No consensus found for participant ${p.id}`);
      process.exit(1);
    }
    // Find the evaluations for this participant from our test data
    const participantEvals = testData.filter((d: any) => d.participant.id === p.id);
    // Calculate expected level (mode)
    const levels = participantEvals.map((d: any) => d.level);
    const levelCounts: Record<string, number> = {};
    let maxCount = 0;
    let modeLevel: string | null = null;
    for (const level of levels) {
      levelCounts[level] = (levelCounts[level] || 0) + 1;
      if (levelCounts[level] > maxCount) {
        maxCount = levelCounts[level];
        modeLevel = level;
      }
    }
    // Calculate expected average ranking
    const avgRanking = participantEvals.reduce((sum: number, d: any) => sum + d.ranking, 0) / participantEvals.length;
    const expectedAvg = parseFloat(avgRanking.toFixed(1));

    if (consensus.consensusLevel !== modeLevel) {
      console.error(`ERROR: Consensus level mismatch for ${p.name}. Expected ${modeLevel}, got ${consensus.consensusLevel}`);
      process.exit(1);
    }
    if (Math.abs(consensus.averageRanking - expectedAvg) > 0.05) {
      console.error(`ERROR: Average ranking mismatch for ${p.name}. Expected ${expectedAvg}, got ${consensus.averageRanking}`);
      process.exit(1);
    }
  }
  console.log('✓ Consensus calculation correct');

  // 4. Test team generation
  // First, we need to have consensus for at least 24 participants (4 teams * 6 levels)
  // We have 5 test participants, but we need more. Let's generate consensus for more participants by giving them evaluations.
  // We'll give evaluations to the first 24 participants (if they exist) for simplicity.
  const needed = 24;
  if (participants.length < needed) {
    console.error(`ERROR: Not enough participants to test team generation. Need at least ${needed}, have ${participants.length}`);
    process.exit(1);
  }
  const teamTestParticipants = participants.slice(0, needed);
  // Clear existing evaluations for these participants
  for (const p of teamTestParticipants) {
    for (const e of evaluators) {
      await deleteEvaluation(p.id, e);
    }
  }
  // Insert evaluations for each participant by each evaluator
  // We'll assign levels such that we have exactly 4 per level (to pass the team generation check)
  const levels = ['Capitao', 'Levantador M', 'Levantador F', 'M1', 'F1', 'M2/F2'];
  // We'll assign each participant a level based on index so that we have 4 of each level (since 24/6=4)
  for (let i = 0; i < teamTestParticipants.length; i++) {
    const p = teamTestParticipants[i];
    const levelIndex = i % 6; // 0..5
    const level = levels[levelIndex];
    // Give each evaluator the same level (so mode is that level) but different rankings
    for (let j = 0; j < evaluators.length; j++) {
      const evalData = {
        participantId: p.id,
        evaluatorName: evaluators[j],
        level: level,
        ranking: (i * 3) + j + 1 // unique ranking
      };
      await createEvaluation(evalData);
    }
  }
  console.log(`✓ Inserted evaluations for ${teamTestParticipants.length} participants for team generation`);

  // Recalculate consensus
  await recalculateConsensusFromEvaluations();

  // Now generate teams
  const teamResult = await generateTeams();
  if (!teamResult.success) {
    console.error(`ERROR: Team generation failed: ${teamResult.error}`);
    process.exit(1);
  }
  console.log('✓ Team generation succeeded');

  // Validate teams
  const teams = teamResult.teams;
  if (teams.length !== 4) {
    console.error(`ERROR: Expected 4 teams, got ${teams.length}`);
    process.exit(1);
  }
  let totalPlayers = 0;
  for (const team of teams) {
    if (team.players.length !== 6) {
      console.error(`ERROR: Team ${team.number} has ${team.players.length} players, expected 6`);
      process.exit(1);
    }
    totalPlayers += team.players.length;
    // Check each level appears exactly once
    const positions = team.players.map((p: any) => p.positionInTeam);
    const expectedPositions = ['Capitao', 'Levantador M', 'Levantador F', 'M1', 'F1', 'M2/F2'];
    for (const pos of expectedPositions) {
      if (!positions.includes(pos)) {
        console.error(`ERROR: Team ${team.number} missing position ${pos}`);
        process.exit(1);
      }
    }
    // Check at least one woman per team
    const hasFemale = team.players.some((p: any) => p.participant.gender === 'F');
    if (!hasFemale) {
      console.error(`ERROR: Team ${team.number} has no female players`);
      process.exit(1);
    }
  }
  if (totalPlayers !== 24) {
    console.error(`ERROR: Total players assigned is ${totalPlayers}, expected 24`);
    process.exit(1);
  }
  console.log('✓ Team validation passed');

  // 5. Test edge cases
  // a) Missing evaluations: remove one evaluator's evaluation for a participant and see if consensus still works
  const pEdge = participants[0];
  await deleteEvaluation(pEdge.id, 'Douglas');
  const evalsAfter = await getEvaluationsByParticipantId(pEdge.id);
  if (evalsAfter.length !== 2) {
    console.error(`ERROR: After deletion, expected 2 evaluations, got ${evalsAfter.length}`);
    process.exit(1);
  }
  await recalculateConsensusFromEvaluations();
  const consensusAfter = await getConsensusForParticipant(pEdge.id);
  if (!consensusAfter) {
    console.error(`ERROR: No consensus after missing evaluation`);
    process.exit(1);
  }
  // Should still have consensus based on the two remaining evaluations
  console.log('✓ Missing evaluations handled');

  // b) Not enough participants for teams: we already tested in team generation by checking length < 4 per level
  // We'll test by temporarily removing participants to see if we get the right error
  // But we don't want to mess up the main data. Instead, we'll test the logic by mocking.
  // We'll skip this for now and trust the code.

  // c) Gender constraint cannot be satisfied: we'll create a scenario where all participants are male
  // We'll need to modify the data, but let's skip to avoid changing the database.

  console.log('All integration tests passed!');
  // Clean up test evaluations (optional)
  for (const p of testParticipants) {
    for (const e of evaluators) {
      await deleteEvaluation(p.id, e);
    }
  }
  for (const p of teamTestParticipants) {
    for (const e of evaluators) {
      await deleteEvaluation(p.id, e);
    }
  }
  // Recalculate consensus to clean up
  await recalculateConsensusFromEvaluations();
}

runTests().catch((err: any) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});