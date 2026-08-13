import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getParticipantsWithEvaluations } from '@/lib/actions';
import ParticipantCard from '@/components/ParticipantCard';
export default async function EvaluatorPage({ params }) {
    const paramsResolved = await params;
    // Convert the param to match the evaluator name format (e.g., 'thiago' -> 'Thiago')
    const evaluatorName = paramsResolved.name.charAt(0).toUpperCase() + paramsResolved.name.slice(1).toLowerCase();
    // Fetch participants with their existing evaluation by this evaluator
    const participants = await getParticipantsWithEvaluations(evaluatorName);
    return (_jsxs("div", { className: "p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Participant Evaluations" }), _jsx("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: participants.map((participant) => (_jsx(ParticipantCard, { participant: participant, evaluatorName: evaluatorName, existingEvaluation: participant.existingEvaluation, onSubmit: async (evaluationData) => {
                        // Call the server action to submit the evaluation
                        const result = await (await import('@/lib/actions')).submitEvaluation(evaluationData);
                        if (!result.success) {
                            throw new Error(result.error);
                        }
                    } }, participant.id))) })] }));
}
