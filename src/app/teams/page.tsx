'use client';

import { useState, useCallback } from 'react';
import { generateTeams } from '@/lib/teamActions';
import { getParticipantsWithConsensus, getTeamAssignments, createTeamAssignment, deleteTeamAssignment } from '@/lib/serverActions';
import { Participant, Consensus, Team } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToastToaster } from '@/components/ui/toast-toaster';
import { AlertTriangle, CheckCircle2, Loader2, MessageCircleWarning, Plus, Trash2, UserPlus } from 'lucide-react';

const TEAM_COUNT = 4;
const TEAM_SIZE = 6;
const POSITIONS = ['Capitao', 'Levantador M', 'Levantador F', 'M1', 'F1', 'M2/F2'] as const;

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [participantsWithConsensus, setParticipantsWithConsensus] = useState<(Participant & { consensus: Consensus })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toastId, setToastId] = useState<string>('');

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load participants with consensus
      const participants = await getParticipantsWithConsensus();
      const eligible = participants.filter(p => p.consensusLevel !== null && p.averageRanking !== null)
        .map(p => ({
          ...p,
          consensus: {
            participantId: p.id,
            level: p.consensusLevel as Consensus['level'],
            averageRanking: p.averageRanking as Consensus['averageRanking'],
            rankingCount: 0 // We don't have this in the query, but we can set to 0
          }
        }));
      setParticipantsWithConsensus(eligible);
      
      // Load existing team assignments
      const assignments = await getTeamAssignments();
      if (assignments.length > 0) {
        // Convert assignments to team structure
        const teamMap: Record<number, Team['players']> = {};
        for (let i = 1; i <= TEAM_COUNT; i++) {
          teamMap[i] = [];
        }
        
        assignments.forEach(assignment => {
          const participant = participantsWithConsensus.find(p => p.id === assignment.participantId);
          if (participant) {
            teamMap[assignment.teamNumber].push({
              participant,
              consensus: {
                participantId: participant.id,
                level: participant.consensusLevel as Consensus['level'],
                averageRanking: participant.averageRanking as Consensus['averageRanking'],
                rankingCount: 0
              },
              positionInTeam: assignment.positionInTeam as Team['players'][number]['positionInTeam']
            });
          }
        });
        
        const teamsArray: Team[] = [];
        for (let i = 1; i <= TEAM_COUNT; i++) {
          teamsArray.push({
            number: i,
            players: teamMap[i]
          });
        }
        setTeams(teamsArray);
      } else {
        setTeams(null);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate teams
  const handleGenerateTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await generateTeams();
      if (result.success && result.teams) {
        setTeams(result.teams);
        setSuccess('Teams generated successfully!');
        setToastId(Date.now().toString());
      } else {
        setError(result.error || 'Failed to generate teams');
      }
    } catch (err) {
      console.error('Error generating teams:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle player swap between teams
  const handleSwapPlayers = useCallback(async (
    team1Number: number, 
    player1Index: number,
    team2Number: number, 
    player2Index: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      // Get current teams state
      const currentTeams = teams;
      if (!currentTeams) return;
      
      // Get the players to swap
      const team1 = currentTeams.find(t => t.number === team1Number);
      const team2 = currentTeams.find(t => t.number === team2Number);
      if (!team1 || !team2) return;
      
      const player1 = team1.players[player1Index];
      const player2 = team2.players[player2Index];
      if (!player1 || !player2) return;
      
      // Check if swap would violate level constraint (each team must have exactly one of each level)
      // Since we're swapping players between teams, we need to check if after swap:
      // - Team 1 would still have exactly one of each level
      // - Team 2 would still have exactly one of each level
      
      // For team 1: remove player1, add player2
      const team1LevelsAfterSwap = team1.players
        .filter((_, index) => index !== player1Index)
        .map(p => p.positionInTeam)
        .concat([player2.positionInTeam]);
      
      // For team 2: remove player2, add player1
      const team2LevelsAfterSwap = team2.players
        .filter((_, index) => index !== player2Index)
        .map(p => p.positionInTeam)
        .concat([player1.positionInTeam]);
      
      // Check if both teams still have exactly one of each position
      const hasAllPositions = (positions: string[]) => 
        POSITIONS.every(pos => positions.filter(p => p === pos).length === 1);
      
      if (!hasAllPositions(team1LevelsAfterSwap) || !hasAllPositions(team2LevelsAfterSwap)) {
        setError('Swap would violate position constraints (each team must have exactly one of each position)');
        setLoading(false);
        return;
      }
      
      // Perform the swap in state
      const newTeams = [...currentTeams];
      const team1Index = newTeams.findIndex(t => t.number === team1Number);
      const team2Index = newTeams.findIndex(t => t.number === team2Number);
      
      // Swap the players
      [newTeams[team1Index].players[player1Index], newTeams[team2Index].players[player2Index]] = [
        newTeams[team2Index].players[player2Index],
        newTeams[team1Index].players[player1Index]
      ];
      
      setTeams(newTeams);
      
      // Update database: delete old assignments and create new ones
      // First delete the old assignments for these two players
      deleteTeamAssignment(player1.participant.id, team1Number);
      deleteTeamAssignment(player2.participant.id, team2Number);
      
      // Then create the new assignments
      createTeamAssignment({
        participantId: player1.participant.id,
        teamNumber: team2Number,
        positionInTeam: player2.positionInTeam
      });
      
      createTeamAssignment({
        participantId: player2.participant.id,
        teamNumber: team1Number,
        positionInTeam: player1.positionInTeam
      });
      
      setSuccess('Players swapped successfully!');
      setToastId(Date.now().toString());
    } catch (err) {
      console.error('Error swapping players:', err);
      setError('Failed to swap players');
    } finally {
      setLoading(false);
    }
  }, [teams]);

  // Handle removing a player from a team (put them back in pool)
  const handleRemovePlayer = useCallback(async (
    teamNumber: number, 
    playerIndex: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const currentTeams = teams;
      if (!currentTeams) return;
      
      const team = currentTeams.find(t => t.number === teamNumber);
      if (!team) return;
      
      const player = team.players[playerIndex];
      if (!player) return;
      
      // Remove from team
      const newTeams = [...currentTeams];
      const teamIndex = newTeams.findIndex(t => t.number === teamNumber);
      newTeams[teamIndex].players.splice(playerIndex, 1);
      
      setTeams(newTeams);
      
      // Delete from database
      deleteTeamAssignment(player.participant.id, teamNumber);
      
      setSuccess('Player removed from team!');
      setToastId(Date.now().toString());
    } catch (err) {
      console.error('Error removing player:', err);
      setError('Failed to remove player');
    } finally {
      setLoading(false);
    }
  }, [teams]);

  // Handle adding a player to a team (from available pool)
  const handleAddPlayerToTeam = useCallback(async (
    teamNumber: number,
    participantId: string,
    positionInTeam: Team['players'][number]['positionInTeam']
  ) => {
    setLoading(true);
    setError(null);
    try {
      const currentTeams = teams;
      if (!currentTeams) return;
      
      const team = currentTeams.find(t => t.number === teamNumber);
      if (!team) return;
      
      // Check if team already has this position
      const hasPosition = team.players.some(p => p.positionInTeam === positionInTeam);
      if (hasPosition) {
        setError(`Team ${teamNumber} already has a ${positionInTeam}`);
        setLoading(false);
        return;
      }
      
      // Check if participant is already in any team
      const isParticipantInAnyTeam = currentTeams.some(t => 
        t.players.some(p => p.participant.id === participantId)
      );
      if (isParticipantInAnyTeam) {
        setError('Participant is already assigned to a team');
        setLoading(false);
        return;
      }
      
      // Get participant data
      const participant = participantsWithConsensus.find(p => p.id === participantId);
      if (!participant) {
        setError('Participant not found');
        setLoading(false);
        return;
      }
      
      // Add to team
      const newTeams = [...currentTeams];
      const teamIndex = newTeams.findIndex(t => t.number === teamNumber);
      newTeams[teamIndex].players.push({
        participant,
        consensus: {
          participantId: participant.id,
          level: participant.consensusLevel as Consensus['level'],
          averageRanking: participant.averageRanking as Consensus['averageRanking'],
          rankingCount: 0
        },
        positionInTeam
      });
      
      setTeams(newTeams);
      
      // Add to database
      createTeamAssignment({
        participantId,
        teamNumber,
        positionInTeam
      });
      
      setSuccess('Player added to team!');
      setToastId(Date.now().toString());
    } catch (err) {
      console.error('Error adding player to team:', err);
      setError('Failed to add player to team');
    } finally {
      setLoading(false);
    }
  }, [teams, participantsWithConsensus]);

  // Validate current teams
  const validateTeams = useCallback((teamsToValidate: Team[] | null): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!teamsToValidate || teamsToValidate.length === 0) {
      errors.push('No teams to validate');
      return { isValid: false, errors };
    }
    
    // Check each team
    teamsToValidate.forEach(team => {
      // Check team has exactly 6 players
      if (team.players.length !== TEAM_SIZE) {
        errors.push(`Team ${team.number} has ${team.players.length} players, expected ${TEAM_SIZE}`);
      }
      
      // Check each team has exactly one of each position
      const positionCounts: Record<string, number> = {};
      team.players.forEach(player => {
        positionCounts[player.positionInTeam] = (positionCounts[player.positionInTeam] || 0) + 1;
      });
      
      POSITIONS.forEach(position => {
        const count = positionCounts[position] || 0;
        if (count !== 1) {
          errors.push(`Team ${team.number} has ${count} ${position}(s), expected exactly 1`);
        }
      });
      
      // Check team has at least one female
      const hasFemale = team.players.some(player => player.participant.gender === 'F');
      if (!hasFemale) {
        errors.push(`Team ${team.number} has no female players`);
      }
      
      // Check for duplicate participants within team
      const participantIds = team.players.map(p => p.participant.id);
      const uniqueIds = new Set(participantIds);
      if (participantIds.length !== uniqueIds.size) {
        errors.push(`Team ${team.number} has duplicate participants`);
      }
    });
    
    // Check for duplicate participants across teams
    const allParticipantIds: string[] = [];
    teamsToValidate.forEach(team => {
      team.players.forEach(player => {
        allParticipantIds.push(player.participant.id);
      });
    });
    const uniqueIds = new Set(allParticipantIds);
    if (allParticipantIds.length !== uniqueIds.size) {
      errors.push('Duplicate participants found across teams');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Handle saving manual edits
  const handleSaveTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const currentTeams = teams;
      if (!currentTeams) {
        setError('No teams to save');
        setLoading(false);
        return;
      }
      
      // Validate teams before saving
      const validation = validateTeams(currentTeams);
      if (!validation.isValid) {
        setError('Validation failed: ' + validation.errors.join('; '));
        setLoading(false);
        return;
      }
      
      // Clear existing assignments
      db.prepare(`DELETE FROM team_assignments`).run();
      
      // Save new assignments
      for (const team of currentTeams) {
        for (const player of team.players) {
          createTeamAssignment({
            participantId: player.participant.id,
            teamNumber: team.number,
            positionInTeam: player.positionInTeam
          });
        }
      }
      
      setSuccess('Teams saved successfully!');
      setToastId(Date.now().toString());
    } catch (err) {
      console.error('Error saving teams:', err);
      setError('Failed to save teams');
    } finally {
      setLoading(false);
    }
  }, [teams]);

  // Initial data load
  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !(teams || participantsWithConsensus.length > 0)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-500">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast container */}
      <ToastToaster />
      
      {/* Header with actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Generate, view, and edit volleyball teams based on consensus data
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-x-3">
          {!teams && (
            <Button onClick={handleGenerateTeams} variant="default" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Teams'}
            </Button>
          )}
          {teams && (
            <>
              <Button onClick={handleSaveTeams} variant="default" disabled={loading}>
                {loading ? 'Saving...' : 'Save Teams'}
              </Button>
              <Button onClick={handleGenerateTeams} variant="outline" disabled={loading}>
                {loading ? 'Generating...' : 'Regenerate'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <span className="ml-3 text-sm text-red-700">{error}</span>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
          <span className="ml-3 text-sm text-green-700">{success}</span>
        </div>
      )}

      {/* Teams display or generation interface */}
      {!teams ? (
        // Show participant pool for generation
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Participant Pool</h2>
            <p className="mt-1 text-sm text-gray-600">
              {participantsWithConsensus.length} participants with consensus data available
            </p>
          </div>
          
          {/* Group by level */}
          <div className="space-y-4">
            {POSITIONS.map(position => {
              const levelParticipants = participantsWithConsensus
                .filter(p => p.consensus.level === position)
                .sort((a, b) => a.consensus.averageRanking - b.consensus.averageRanking);
              
              return levelParticipants.length > 0 && (
                <div key={position} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">{position}</h3>
                  <div className="space-y-2">
                    {levelParticipants.map(participant => (
                      <div key={participant.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          {participant.photoUrl && (
                            <img 
                              src={participant.photoUrl} 
                              alt={participant.name} 
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                            <p className="text-xs text-gray-500">
                              {participant.gender === 'M' ? 'Male' : 'Female'} • 
                              Rank: {participant.consensus.averageRanking}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost"
                          size="icon"
                          aria-label={`Add ${participant.name} to team`}
                        >
                          <UserPlus className="h-4 w-4 text-gray-400 hover:text-gray-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {levelParticipants.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No participants at this level
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Show teams interface
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teams.map(team => (
              <Card key={team.number} className="h-full">
                <CardHeader className="pb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    Team {team.number}
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {team.players.some(p => p.participant.gender === 'F') ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                          Female Present
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="mr-1 h-3 w-3 text-red-500" />
                          No Female
                        </>
                      )}
                    </span>
                  </h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Table>
                    <TableBody>
                      {POSITIONS.map(position => {
                        const player = team.players.find(p => p.positionInTeam === position);
                        return (
                          <TableRow key={position} className="hover:bg-gray-50">
                            <TableCell className="w-1/3 font-medium text-gray-900">
                              {position}
                            </TableCell>
                            <TableCell className="w-2/3 flex items-center space-x-3">
                              {player ? (
                                <>
                                  {player.participant.photoUrl && (
                                    <img 
                                      src={player.participant.photoUrl} 
                                      alt={player.participant.name} 
                                      className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {player.participant.name}
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center">
                                      {player.participant.gender === 'M' ? '•' : '•'} 
                                      <span className="ml-1 mr-1">{player.participant.gender === 'M' ? 'M' : 'F'}</span>
                                      • Rank: {player.consensus.averageRanking}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm">
                                    <Button 
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemovePlayer(team.number, team.players.indexOf(player))}
                                      aria-label={`Remove ${player.participant.name} from team`}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // In a real implementation, this would open a modal to select a player
                                    // For now, we'll just show an alert
                                    alert('Player selection modal would open here');
                                  }}
                                >
                                  Add Player
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Validation and controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <Button 
                onClick={() => {
                  const validation = validateTeams(teams);
                  if (validation.isValid) {
                    alert('All teams are valid!');
                  } else {
                    alert('Validation errors:\\n' + validation.errors.join('\\n'));
                  }
                }}
                variant="outline"
              >
                Validate Teams
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}