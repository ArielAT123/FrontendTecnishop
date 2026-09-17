import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  gradient: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description }) => {
  return (
    <Card className="p-5 relative overflow-hidden transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">{title}</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 mt-2 tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-1">
              {description}
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm">
          {icon}
        </div>
      </div>
    </Card>
  );
};
