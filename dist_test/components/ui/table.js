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
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
export const Table = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("table", Object.assign({ ref: ref, className: `table-fixed w-full caption-bottom async ${className}` }, props)));
});
Table.displayName = 'Table';
export const TableHeader = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("th", Object.assign({ ref: ref, className: `text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider ${className}` }, props)));
});
TableHeader.displayName = 'TableHeader';
export const TableBody = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("tbody", Object.assign({ ref: ref, className: `bg-white divide-y divide-gray-200 ${className}` }, props)));
});
TableBody.displayName = 'TableBody';
export const TableFooter = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("tfoot", Object.assign({ ref: ref, className: `${className}` }, props)));
});
TableFooter.displayName = 'TableFooter';
export const TableRow = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("tr", Object.assign({ ref: ref, className: `${className}` }, props)));
});
TableRow.displayName = 'TableRow';
export const TableCell = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("td", Object.assign({ ref: ref, className: `px-6 py-4 ${className}` }, props)));
});
TableCell.displayName = 'TableCell';
