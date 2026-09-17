import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-sm ${
        onClick ? 'cursor-pointer hover:border-brand-500/50 hover:shadow-md transition-all duration-200' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
