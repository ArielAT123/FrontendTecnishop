import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface SidebarNavItemProps {
  icon: LucideIcon;
  label: string;
  badge?: string;
  isActive: boolean;
  onClick: () => void;
  isNested?: boolean;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  icon: Icon,
  label,
  badge,
  isActive,
  onClick,
  isNested = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
        isNested ? 'text-xs pl-3.5 py-2' : ''
      } ${
        isActive
          ? 'bg-[#3498db] text-white shadow-lg shadow-[#3498db]/35 font-semibold'
          : 'text-slate-200 hover:bg-white/10 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon
          className={`shrink-0 transition-transform group-hover:scale-110 ${
            isNested ? 'w-4 h-4' : 'w-5 h-5'
          } ${isActive ? 'text-white' : 'text-slate-300'}`}
        />
        <span className="truncate">{label}</span>
      </div>

      {badge && (
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
            isActive
              ? 'bg-white/20 text-white'
              : 'bg-white/10 text-slate-300'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
