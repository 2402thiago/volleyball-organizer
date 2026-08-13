'use server';

const db = require('./db');

export const getParticipantsWithConsensus = async () => {
  return db.getParticipantsWithConsensus();
};

export const getTeamAssignments = async () => {
  return db.getTeamAssignments();
};

export const createTeamAssignment = async (assignment) => {
  return db.createTeamAssignment(assignment);
};

export const deleteTeamAssignment = async (participantId: string, teamNumber: number) => {
  return db.deleteTeamAssignment(participantId, teamNumber);
};