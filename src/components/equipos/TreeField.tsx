import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Input } from '../ui/Input';

export interface SuggestionItem {
  texto: string;
  frecuencia?: number;
  tipo?: string;
  marca?: string;
}

export interface TreeFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  onSelect: (val: string) => void;
  fetchSuggestions: (query: string) => Promise<SuggestionItem[]>;
  placeholder?: string;
  helperBadge?: string;
}

/**
 * Autocomplete Input driven by the in-memory Hierarchical Device Tree
 */
export const TreeField: React.FC<TreeFieldProps> = ({
  label,
  required,
  value,
  onChange,
  onSelect,
  fetchSuggestions,
  placeholder,
  helperBadge,
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(value);
        if (active) setSuggestions(results);
      } catch {
        if (active) setSuggestions([]);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {helperBadge && (
          <span className="text-[10px] text-slate-400 font-medium">{helperBadge}</span>
        )}
      </div>

      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 text-xs">
          {suggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => {
                onSelect(item.texto);
                setIsOpen(false);
              }}
              className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-slate-800 dark:text-slate-200 transition-colors"
            >
              <span className="font-medium">{item.texto}</span>
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                {item.frecuencia && item.frecuencia > 1 && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[9px]">
                    {item.frecuencia}x
                  </span>
                )}
                <Sparkles className="w-3 h-3 text-[#3498db]" />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
