'use client';
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000; // 1 million seconds essentially means they don't auto-remove
const actionTypes = {
    ADD_TOAST: 'ADD_TOAST',
    UPDATE_TOAST: 'UPDATE_TOAST',
    DISMISS_TOAST: 'DISMISS_TOAST',
    REMOVE_TOAST: 'REMOVE_TOAST',
};
let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}
const toastTimeouts = new Map();
const addToRemoveQueue = (toastId) => {
    if (toastTimeouts.has(toastId)) {
        return;
    }
    const timeout = setTimeout(() => {
        store.dispatch({
            type: actionTypes.REMOVE_TOAST,
            payload: { id: toastId },
        });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action) => {
    switch (action.type) {
        case actionTypes.ADD_TOAST:
            return Object.assign(Object.assign({}, state), { toasts: [action.payload, ...state.toasts].slice(0, TOAST_LIMIT) });
        case actionTypes.UPDATE_TOAST:
            return Object.assign(Object.assign({}, state), { toasts: state.toasts.map(t => t.id === action.payload.id ? Object.assign(Object.assign({}, t), action.payload) : t) });
        case actionTypes.DISMISS_TOAST: {
            const { id } = action.payload;
            // Clear the timeout for this toast
            if (toastTimeouts.has(id)) {
                clearTimeout(toastTimeouts.get(id));
                toastTimeouts.delete(id);
            }
            return Object.assign(Object.assign({}, state), { toasts: state.toasts.map(t => t.id === id ? Object.assign(Object.assign({}, t), { open: false }) : t) });
        }
        case actionTypes.REMOVE_TOAST:
            if (action.payload.id === undefined) {
                return Object.assign(Object.assign({}, state), { toasts: [] });
            }
            return Object.assign(Object.assign({}, state), { toasts: state.toasts.filter(t => t.id !== action.payload.id) });
    }
};
const initState = () => {
    return {
        toasts: [],
    };
};
const [{ Provider: ToastProvider, useState: useToastState }, dispatch,] = (() => {
    const [dispatch, state] = React.useReducer(reducer, initState());
    return [{ Provider: ToastProvider, useState: useToastState }, dispatch];
})();
function Toast(_a) {
    var { title, description, action, variant = 'default' } = _a, props = __rest(_a, ["title", "description", "action", "variant"]);
    const getVariantClasses = () => {
        switch (variant) {
            case 'destructive':
                return 'bg-destructive text-destructive-foreground';
            case 'success':
                return 'bg-success text-success-foreground';
            default:
                return 'bg-primary text-primary-foreground';
        }
    };
    return (_jsx("div", Object.assign({ role: "alert", "aria-live": "assertive", "aria-atomic": "true", className: `
        flex w-full items-center space-x-4 rounded-border border p-4
        ${getVariantClasses()}
        ` }, props, { children: action ? (_jsxs(_Fragment, { children: [action, _jsxs("div", { className: "flex flex-col space-y-2", children: [title && (_jsx("h3", { className: "text-sm font-semibold", children: title })), description && (_jsx("p", { className: "text-xs", children: description }))] })] })) : (_jsxs("div", { className: "flex flex-col space-y-2", children: [title && (_jsx("h3", { className: "text-sm font-semibold", children: title })), description && (_jsx("p", { className: "text-xs", children: description }))] })) })));
}
export const useToast = () => {
    const { toasts } = useToastState();
    const toast = ({ title, description, action, variant = 'default', }) => {
        const id = genId();
        const update = (props) => dispatch({
            type: actionTypes.UPDATE_TOAST,
            payload: Object.assign(Object.assign({}, props), { id }),
        });
        const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, payload: { id } });
        dispatch({
            type: actionTypes.ADD_TOAST,
            payload: {
                id,
                title,
                description,
                action,
                variant,
            },
        });
        return {
            id: id,
            dismiss,
            update,
        };
    };
    return {
        toast,
        toasts: toasts.map(t => (Object.assign(Object.assign({}, t), { 
            // @ts-ignore
            onOpenChange: (open) => {
                if (!open)
                    dispatch({ type: actionTypes.DISMISS_TOAST, payload: { id: t.id } });
            } }))),
    };
};
export const ToastProvider;
export { toast };
