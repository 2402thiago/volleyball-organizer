'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import Image from 'next/image';
import { useState } from 'react';
import { LevelRankingSelector } from './LevelRankingSelector';
export default function ParticipantCard({ participant, evaluatorName, existingEvaluation, onSubmit, }) {
    var _a, _b;
    const [level, setLevel] = useState((_a = existingEvaluation === null || existingEvaluation === void 0 ? void 0 : existingEvaluation.level) !== null && _a !== void 0 ? _a : '');
    const [ranking, setRanking] = useState((_b = existingEvaluation === null || existingEvaluation === void 0 ? void 0 : existingEvaluation.ranking) !== null && _b !== void 0 ? _b : 0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({
                participantId: participant.id,
                evaluatorName,
                level: level,
                ranking: ranking,
            });
            setSubmitMessage('Evaluation saved!');
            setTimeout(() => {
                setSubmitMessage(null);
            }, 2000);
        }
        catch (error) {
            setSubmitMessage('Error saving evaluation');
            console.error(error);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "flex flex-col items-center p-4 bg-white rounded-lg shadow-md dark:bg-gray-800", children: [_jsx("div", { className: "mb-4", children: participant.photoUrl ? (_jsx(Image, { src: participant.photoUrl, alt: participant.name, width: 100, height: 100, className: "rounded-full object-cover" })) : (_jsx("div", { className: "w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center", children: _jsx("span", { className: "text-gray-600", children: participant.name[0] }) })) }), _jsx("h2", { className: "text-lg font-semibold mb-2", children: participant.name }), _jsxs("form", { onSubmit: handleSubmit, className: "w-full space-y-4", children: [_jsx(LevelRankingSelector, { level: level, setLevel: setLevel, ranking: ranking, setRanking: setRanking }), isSubmitting ? (_jsx("p", { className: "text-sm text-gray-500", children: "Saving..." })) : (_jsxs(_Fragment, { children: [submitMessage && (_jsx("p", { className: `text-sm ${submitMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`, children: submitMessage })), _jsx("button", { type: "submit", className: "w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50", disabled: isSubmitting, children: "Submit Evaluation" })] }))] })] }));
}
