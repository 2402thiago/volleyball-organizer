import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const metadata = {
    title: "Team Management",
    description: "View, generate, and edit volleyball teams",
};
export default function TeamsLayout({ children, }) {
    return (_jsxs("div", { className: "min-h-flex flex-col", children: [_jsx("header", { className: "bg-white shadow-sm", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4", children: _jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Team Management" }) }) }), _jsx("main", { className: "flex-1 flex-col", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1", children: children }) })] }));
}
