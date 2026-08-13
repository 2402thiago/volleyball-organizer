'use client';

import { useState } from 'react';

interface LevelRankingSelectorProps {
  level: string;
  setLevel: (level: string) => void;
  ranking: number;
  setRanking: (ranking: number) => void;
}

export function LevelRankingSelector({
  level,
  setLevel,
  ranking,
  setRanking,
}: LevelRankingSelectorProps) {
  const levels = [
    'Capitao',
    'Levantador M',
    'Levantador F',
    'M1',
    'F1',
    'M2/F2',
  ] as const;

  const rankings = Array.from({ length: 10 }, (_, i) => i + 1); // 1 to 10

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium mb-1">
          Level
        </label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Select level</option>
          {levels.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Ranking (1-10)
        </label>
        <select
          value={ranking}
          onChange={(e) => setRanking(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Select ranking</option>
          {rankings.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}