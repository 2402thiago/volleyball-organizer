'use client';

import Image from 'next/image';
import { useState } from 'react';
import { LevelRankingSelector } from './LevelRankingSelector';
import { Evaluation, Participant } from '@/types/index';

interface ParticipantCardProps {
  participant: Participant;
  evaluatorName: Evaluation['evaluatorName'];
  existingEvaluation: Evaluation | null;
  onSubmit: (evaluation: Omit<Evaluation, 'id' | 'createdAt'>) => Promise<void>;
}

export default function ParticipantCard({
  participant,
  evaluatorName,
  existingEvaluation,
  onSubmit,
}: ParticipantCardProps) {
  const [level, setLevel] = useState(existingEvaluation?.level ?? '');
  const [ranking, setRanking] = useState(
    existingEvaluation?.ranking ?? 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        participantId: participant.id,
        evaluatorName,
        level: level as Evaluation['level'],
        ranking: ranking as Evaluation['ranking'],
      });
      setSubmitMessage('Evaluation saved!');
      setTimeout(() => {
        setSubmitMessage(null);
      }, 2000);
    } catch (error) {
      setSubmitMessage('Error saving evaluation');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div className="mb-4">
        {participant.photoUrl ? (
          <Image
            src={participant.photoUrl}
            alt={participant.name}
            width={100}
            height={100}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600">{participant.name[0]}</span>
          </div>
        )}
      </div>
      <h2 className="text-lg font-semibold mb-2">{participant.name}</h2>
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <LevelRankingSelector
          level={level}
          setLevel={setLevel}
          ranking={ranking}
          setRanking={setRanking}
        />
        {isSubmitting ? (
          <p className="text-sm text-gray-500">Saving...</p>
        ) : (
          <>
            {submitMessage && (
              <p className={`text-sm ${
                submitMessage.includes('Error') ? 'text-red-500' : 'text-green-500'
              }`}>
                {submitMessage}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Submit Evaluation
            </button>
          </>
        )}
      </form>
    </div>
  );
}