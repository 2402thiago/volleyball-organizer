import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { loginAction } from "./action";
export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await loginAction({ username, password });
            // Redirect to appropriate page based on role will be handled by middleware or we can redirect here
            // For simplicity, we'll redirect to the evaluator page if evaluator, or consensus if admin
            // But we don't have the role here, so we'll rely on middleware to redirect after login
            // Alternatively, we can return the role from the action and redirect accordingly.
            // Let's adjust the action to return the role and redirect.
        }
        catch (err) {
            setError(err.message || "An error occurred");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex flex-col items-center justify-center bg-background p-6", children: _jsxs("div", { className: "w-full max-w-md space-y-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Volleyball Organizer Login" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "username", children: "Username" }), _jsx(Input, { id: "username", value: username, onChange: (e) => setUsername(e.target.value), required: true, disabled: loading })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "password", children: "Password" }), _jsx(Input, { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, disabled: loading })] }), error && _jsx("p", { className: "text-destructive", children: error }), _jsx(Button, { type: "submit", disabled: loading, className: "w-full", children: loading ? "Logging in..." : "Login" })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Evaluators: Thiago, Ramon, Douglas (use your name as password for simplicity)" })] }) }));
}
