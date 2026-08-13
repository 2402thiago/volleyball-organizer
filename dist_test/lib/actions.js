'use server';
const db = require('./db');
export async function getParticipantsWithEvaluations(evaluatorName) {
    const participants = db.getParticipants();
    const participantsWithEvaluations = participants.map((participant) => {
        const evaluations = db.getEvaluationsByParticipantId(participant.id);
        const existingEvaluation = evaluations.find((ev) => ev.evaluatorName === evaluatorName);
        return Object.assign(Object.assign({}, participant), { existingEvaluation: existingEvaluation || null });
    });
    return participantsWithEvaluations;
}
export async function submitEvaluation(evaluationData) {
    try {
        const result = db.createEvaluation(evaluationData);
        return { success: true, data: result };
    }
    catch (error) {
        console.error('Error submitting evaluation:', error);
        return { success: false, error: 'Failed to submit evaluation' };
    }
}
