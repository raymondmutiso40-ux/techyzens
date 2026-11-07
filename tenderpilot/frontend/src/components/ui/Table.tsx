import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className="w-full overflow-x-auto border border-slate-200 rounded-md bg-white">
    <table className={`w-full text-left text-xs divide-y divide-slate-200 ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const Thead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <thead className={`bg-slate-50 text-slate-500 font-medium ${className}`} {...props}>
    {children}
  </thead>
);

export const Tbody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <tbody className={`divide-y divide-slate-100 bg-white ${className}`} {...props}>
    {children}
  </tbody>
);

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <tr className={`hover:bg-slate-50/70 transition-colors duration-100 ${className}`} {...props}>
    {children}
  </tr>
);

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <th className={`px-3 py-2.5 font-medium uppercase tracking-wider text-[11px] text-slate-500 ${className}`} {...props}>
    {children}
  </th>
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <td className={`px-3 py-2.5 text-slate-900 align-middle ${className}`} {...props}>
    {children}
  </td>
);
