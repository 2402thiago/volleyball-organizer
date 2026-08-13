import { getParticipantsWithEvaluations } from '@/lib/actions';
import ParticipantCard from '@/components/ParticipantCard';
import { Evaluation, Participant } from '@/types/index';

export default async function EvaluatorPage({ params }: { params: Promise<{ name: string }> }) {
  const paramsResolved = await params;
  // Convert the param to match the evaluator name format (e.g., 'thiago' -> 'Thiago')
  const evaluatorName = paramsResolved.name.charAt(0).toUpperCase() + paramsResolved.name.slice(1).toLowerCase() as Evaluation['evaluatorName'];

  // Fetch participants with their existing evaluation by this evaluator
  const participants = await getParticipantsWithEvaluations(evaluatorName);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Participant Evaluations</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {participants.map((participant: Participant & { existingEvaluation: Evaluation | null }) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            evaluatorName={evaluatorName}
            existingEvaluation={participant.existingEvaluation}
            onSubmit={async (evaluationData: Omit<Evaluation, 'id' | 'createdAt'>) => {
              // Call the server action to submit the evaluation
              const result = await (await import('@/lib/actions')).submitEvaluation(evaluationData);
              if (!result.success) {
                throw new Error(result.error);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}