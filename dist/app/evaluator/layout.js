import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { cookies } from 'next/headers';
export const metadata = {
    title: 'Volleyball Organizer - Evaluator',
    description: 'Evaluate participants for volleyball teams',
};
export default async function EvaluatorLayout({ children, params }) {
    var _a;
    const paramsResolved = await params;
    const evaluatorNameFromUrl = paramsResolved.name.charAt(0).toUpperCase() + paramsResolved.name.slice(1).toLowerCase();
    // Get user from cookie
    const cookieStore = await cookies();
    const userCookie = (_a = cookieStore.get('user')) === null || _a === void 0 ? void 0 : _a.value;
    let user = null;
    if (userCookie) {
        try {
            user = JSON.parse(userCookie);
        }
        catch (e) {
            user = null;
        }
    }
    // For security, we should use the name from the cookie to display
    // The middleware already ensures that the URL name matches the cookie name for evaluators
    const evaluatorName = user && user.role === 'evaluator' ? user.name : evaluatorNameFromUrl;
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: [_jsx("header", { className: "bg-white dark:bg-gray-800 shadow-md", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between h-16", children: [_jsx("div", { className: "flex", children: _jsx("div", { className: "flex-shrink-0 flex items-center", children: _jsxs("h1", { className: "text-xl font-semibold text-gray-900 dark:text-gray-100", children: ["Evaluator: ", evaluatorName] }) }) }), _jsx("div", { className: "hidden md:flex", children: _jsx("div", { className: "ml-10 flex items-baseline space-x-4" }) })] }) }) }), _jsx("main", { className: "flex-1", children: _jsx("div", { className: "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8", children: _jsx("div", { className: "px-4 py-6 sm:px-0", children: children }) }) })] }));
}
