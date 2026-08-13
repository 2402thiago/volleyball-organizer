import React from "react";

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  className?: string;
}

export const Table = React.forwardRef<
  HTMLTableElement,
  TableProps
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={`table-fixed w-full caption-bottom async ${className}`}
    {...props}
  />
));
Table.displayName = 'Table';

interface TableHeaderProps extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {
  className?: string;
}

export const TableHeader = React.forwardRef<
  HTMLTableHeaderCellElement,
  TableHeaderProps
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={`text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider ${className}`}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

interface TableBodyProps extends React.TBodyHTMLAttributes<HTMLTableBodyElement> {
  className?: string;
}

export const TableBody = React.forwardRef<
  HTMLTableBodyElement,
  TableBodyProps
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={`bg-white divide-y divide-gray-200 ${className}`}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

interface TableFooterProps extends React.TFootHTMLAttributes<HTMLTableFootElement> {
  className?: string;
}

export const TableFooter = React.forwardRef<
  HTMLTableFootElement,
  TableFooterProps
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={`${className}`}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

interface TableRowProps extends React.TrHTMLAttributes<HTMLTableRowElement> {
  className?: string;
}

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  TableRowProps
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={`${className}`}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableDataCellElement> {
  className?: string;
}

export const TableCell = React.forwardRef<
  HTMLTableDataCellElement,
  TableCellProps
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={`px-6 py-4 ${className}`}
    {...props}
  />
));
TableCell.displayName = 'TableCell';