'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function LevelRankingSelector({ level, setLevel, ranking, setRanking, }) {
    const levels = [
        'Capitao',
        'Levantador M',
        'Levantador F',
        'M1',
        'F1',
        'M2/F2',
    ];
    const rankings = Array.from({ length: 10 }, (_, i) => i + 1); // 1 to 10
    return (_jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Level" }), _jsxs("select", { value: level, onChange: (e) => setLevel(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm", children: [_jsx("option", { value: "", children: "Select level" }), levels.map((l) => (_jsx("option", { value: l, children: l }, l)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Ranking (1-10)" }), _jsxs("select", { value: ranking, onChange: (e) => setRanking(parseInt(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm", children: [_jsx("option", { value: "", children: "Select ranking" }), rankings.map((r) => (_jsx("option", { value: r, children: r }, r)))] })] })] }));
}
