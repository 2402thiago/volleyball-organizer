'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { generateTeams, getTeamAssignments, createTeamAssignment, deleteTeamAssignment } from '@/lib/teamActions';
import { getParticipantsWithConsensus } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Toast } from '@/components/ui/toast-toaster';
import { AlertTriangle, CheckCircle2, Loader2, Trash2, UserPlus } from 'lucide-react';
const TEAM_COUNT = 4;
const TEAM_SIZE = 6;
const POSITIONS = ['Capitao', 'Levantador M', 'Levantador F', 'M1', 'F1', 'M2/F2'];
export default function TeamsPage() {
    const [teams, setTeams] = useState(null);
    const [participantsWithConsensus, setParticipantsWithConsensus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [toastId, setToastId] = useState('');
    // Load initial data
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Load participants with consensus
            const participants = getParticipantsWithConsensus();
            const eligible = participants.filter(p => p.consensusLevel !== null && p.averageRanking !== null)
                .map(p => (Object.assign(Object.assign({}, p), { consensus: {
                    participantId: p.id,
                    level: p.consensusLevel,
                    averageRanking: p.averageRanking,
                    rankingCount: 0 // We don't have this in the query, but we can set to 0
                } })));
            setParticipantsWithConsensus(eligible);
            // Load existing team assignments
            const assignments = getTeamAssignments();
            if (assignments.length > 0) {
                // Convert assignments to team structure
                const teamMap = {};
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
                                level: participant.consensusLevel,
                                averageRanking: participant.averageRanking,
                                rankingCount: 0
                            },
                            positionInTeam: assignment.positionInTeam
                        });
                    }
                });
                const teamsArray = [];
                for (let i = 1; i <= TEAM_COUNT; i++) {
                    teamsArray.push({
                        number: i,
                        players: teamMap[i]
                    });
                }
                setTeams(teamsArray);
            }
            else {
                setTeams(null);
            }
        }
        catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to load data');
        }
        finally {
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
            }
            else {
                setError(result.error || 'Failed to generate teams');
            }
        }
        catch (err) {
            console.error('Error generating teams:', err);
            setError('An unexpected error occurred');
        }
        finally {
            setLoading(false);
        }
    }, []);
    // Handle player swap between teams
    const handleSwapPlayers = useCallback(async (team1Number, player1Index, team2Number, player2Index) => {
        setLoading(true);
        setError(null);
        try {
            // Get current teams state
            const currentTeams = teams;
            if (!currentTeams)
                return;
            // Get the players to swap
            const team1 = currentTeams.find(t => t.number === team1Number);
            const team2 = currentTeams.find(t => t.number === team2Number);
            if (!team1 || !team2)
                return;
            const player1 = team1.players[player1Index];
            const player2 = team2.players[player2Index];
            if (!player1 || !player2)
                return;
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
            const hasAllPositions = (positions) => POSITIONS.every(pos => positions.filter(p => p === pos).length === 1);
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
        }
        catch (err) {
            console.error('Error swapping players:', err);
            setError('Failed to swap players');
        }
        finally {
            setLoading(false);
        }
    }, [teams]);
    // Handle removing a player from a team (put them back in pool)
    const handleRemovePlayer = useCallback(async (teamNumber, playerIndex) => {
        setLoading(true);
        setError(null);
        try {
            const currentTeams = teams;
            if (!currentTeams)
                return;
            const team = currentTeams.find(t => t.number === teamNumber);
            if (!team)
                return;
            const player = team.players[playerIndex];
            if (!player)
                return;
            // Remove from team
            const newTeams = [...currentTeams];
            const teamIndex = newTeams.findIndex(t => t.number === teamNumber);
            newTeams[teamIndex].players.splice(playerIndex, 1);
            setTeams(newTeams);
            // Delete from database
            deleteTeamAssignment(player.participant.id, teamNumber);
            setSuccess('Player removed from team!');
            setToastId(Date.now().toString());
        }
        catch (err) {
            console.error('Error removing player:', err);
            setError('Failed to remove player');
        }
        finally {
            setLoading(false);
        }
    }, [teams]);
    // Handle adding a player to a team (from available pool)
    const handleAddPlayerToTeam = useCallback(async (teamNumber, participantId, positionInTeam) => {
        setLoading(true);
        setError(null);
        try {
            const currentTeams = teams;
            if (!currentTeams)
                return;
            const team = currentTeams.find(t => t.number === teamNumber);
            if (!team)
                return;
            // Check if team already has this position
            const hasPosition = team.players.some(p => p.positionInTeam === positionInTeam);
            if (hasPosition) {
                setError(`Team ${teamNumber} already has a ${positionInTeam}`);
                setLoading(false);
                return;
            }
            // Check if participant is already in any team
            const isParticipantInAnyTeam = currentTeams.some(t => t.players.some(p => p.participant.id === participantId));
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
                    level: participant.consensusLevel,
                    averageRanking: participant.averageRanking,
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
        }
        catch (err) {
            console.error('Error adding player to team:', err);
            setError('Failed to add player to team');
        }
        finally {
            setLoading(false);
        }
    }, [teams, participantsWithConsensus]);
    // Validate current teams
    const validateTeams = useCallback((teamsToValidate) => {
        const errors = [];
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
            const positionCounts = {};
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
        const allParticipantIds = [];
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
        }
        catch (err) {
            console.error('Error saving teams:', err);
            setError('Failed to save teams');
        }
        finally {
            setLoading(false);
        }
    }, [teams]);
    // Initial data load
    React.useEffect(() => {
        loadData();
    }, [loadData]);
    if (loading && !(teams || participantsWithConsensus.length > 0)) {
        return (_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: _jsxs("div", { className: "flex flex-col items-center justify-center py-12", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin text-gray-400" }), _jsx("p", { className: "mt-4 text-gray-500", children: "Loading data..." })] }) }));
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: [_jsx(Toast, {}), _jsxs("div", { className: "mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Team Management" }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: "Generate, view, and edit volleyball teams based on consensus data" })] }), _jsxs("div", { className: "mt-4 sm:mt-0 space-x-3", children: [!teams && (_jsx(Button, { onClick: handleGenerateTeams, variant: "default", disabled: loading, children: loading ? 'Generating...' : 'Generate Teams' })), teams && (_jsxs(_Fragment, { children: [_jsx(Button, { onClick: handleSaveTeams, variant: "default", disabled: loading, children: loading ? 'Saving...' : 'Save Teams' }), _jsx(Button, { onClick: handleGenerateTeams, variant: "outline", disabled: loading, children: loading ? 'Generating...' : 'Regenerate' })] }))] })] }), error && (_jsxs("div", { className: "mb-4 p-4 bg-red-50 border border-red-200 rounded-md", children: [_jsx(AlertTriangle, { className: "h-4 w-4 text-red-400 shrink-0" }), _jsx("span", { className: "ml-3 text-sm text-red-700", children: error })] })), success && (_jsxs("div", { className: "mb-4 p-4 bg-green-50 border border-green-200 rounded-md", children: [_jsx(CheckCircle2, { className: "h-4 w-4 text-green-400 shrink-0" }), _jsx("span", { className: "ml-3 text-sm text-green-700", children: success })] })), !teams ? (
            // Show participant pool for generation
            _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Participant Pool" }), _jsxs("p", { className: "mt-1 text-sm text-gray-600", children: [participantsWithConsensus.length, " participants with consensus data available"] })] }), _jsx("div", { className: "space-y-4", children: POSITIONS.map(position => {
                            const levelParticipants = participantsWithConsensus
                                .filter(p => p.consensus.level === position)
                                .sort((a, b) => a.consensus.averageRanking - b.consensus.averageRanking);
                            return levelParticipants.length > 0 && (_jsxs("div", { className: "border border-gray-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-3", children: position }), _jsx("div", { className: "space-y-2", children: levelParticipants.map(participant => (_jsxs("div", { className: "flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [participant.photoUrl && (_jsx("img", { src: participant.photoUrl, alt: participant.name, className: "h-8 w-8 rounded-full object-cover" })), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: participant.name }), _jsxs("p", { className: "text-xs text-gray-500", children: [participant.gender === 'M' ? 'Male' : 'Female', " \u2022 Rank: ", participant.consensus.averageRanking] })] })] }), _jsx(Button, { variant: "ghost", size: "icon", "aria-label": `Add ${participant.name} to team`, children: _jsx(UserPlus, { className: "h-4 w-4 text-gray-400 hover:text-gray-500" }) })] }, participant.id))) }), levelParticipants.length === 0 && (_jsx("p", { className: "text-sm text-gray-500 text-center py-4", children: "No participants at this level" }))] }, position));
                        }) })] })) : (
            // Show teams interface
            _jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: teams.map(team => (_jsxs(Card, { className: "h-full", children: [_jsx(CardHeader, { className: "pb-4", children: _jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: ["Team ", team.number, _jsx("span", { className: "ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", children: team.players.some(p => p.participant.gender === 'F') ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle2, { className: "mr-1 h-3 w-3 text-green-500" }), "Female Present"] })) : (_jsxs(_Fragment, { children: [_jsx(AlertTriangle, { className: "mr-1 h-3 w-3 text-red-500" }), "No Female"] })) })] }) }), _jsx(CardContent, { className: "space-y-3", children: _jsx(Table, { children: _jsx(TableBody, { children: POSITIONS.map(position => {
                                                const player = team.players.find(p => p.positionInTeam === position);
                                                return (_jsxs(TableRow, { className: "hover:bg-gray-50", children: [_jsx(TableCell, { className: "w-1/3 font-medium text-gray-900", children: position }), _jsx(TableCell, { className: "w-2/3 flex items-center space-x-3", children: player ? (_jsxs(_Fragment, { children: [player.participant.photoUrl && (_jsx("img", { src: player.participant.photoUrl, alt: player.participant.name, className: "h-10 w-10 rounded-full object-cover border-2 border-gray-200" })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: player.participant.name }), _jsxs("p", { className: "text-xs text-gray-500 flex items-center", children: [player.participant.gender === 'M' ? '•' : '•', _jsx("span", { className: "ml-1 mr-1", children: player.participant.gender === 'M' ? 'M' : 'F' }), "\u2022 Rank: ", player.consensus.averageRanking] })] }), _jsx("div", { className: "flex items-center space-x-2 text-sm", children: _jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleRemovePlayer(team.number, team.players.indexOf(player)), "aria-label": `Remove ${player.participant.name} from team`, children: _jsx(Trash2, { className: "h-4 w-4 text-red-500 hover:text-red-600" }) }) })] })) : (_jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                                                    // In a real implementation, this would open a modal to select a player
                                                                    // For now, we'll just show an alert
                                                                    alert('Player selection modal would open here');
                                                                }, children: "Add Player" })) })] }, position));
                                            }) }) }) })] }, team.number))) }), _jsx("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between", children: _jsx("div", { className: "mb-4 sm:mb-0", children: _jsx(Button, { onClick: () => {
                                    const validation = validateTeams(teams);
                                    if (validation.isValid) {
                                        alert('All teams are valid!');
                                    }
                                    else {
                                        alert('Validation errors:\\n' + validation.errors.join('\\n'));
                                    }
                                }, variant: "outline", children: "Validate Teams" }) }) })] }))] }));
}
