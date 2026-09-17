import React from 'react';

interface BadgeProps {
  status?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, children, className = '' }) => {
  let resolvedVariant = variant || 'default';

  if (status) {
    const s = status.toUpperCase().trim();
    if (s === 'COMPLETADO' || s === 'COBRADO' || s === 'LISTO') resolvedVariant = 'success';
    else if (s === 'PENDIENTE') resolvedVariant = 'warning';
    else if (s === 'EN_PROCESO' || s === 'EN PROCESO') resolvedVariant = 'info';
    else if (s === 'CANCELADO' || s === 'RECHAZADO') resolvedVariant = 'danger';
    else resolvedVariant = 'purple';
  }

  const styles = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/50',
    info: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800/50',
    purple: 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border-brand-200 dark:border-brand-800/50',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[resolvedVariant]} ${className}`}>
      {children}
    </span>
  );
};
