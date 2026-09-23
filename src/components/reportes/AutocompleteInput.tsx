import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/Input';
export interface AutocompleteItem {
  id?: string;
  texto: string;
  subtexto?: string;
  precio?: number;
  categoria?: string;
  codigo?: string;
  frecuencia?: number;
}

export interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: AutocompleteItem) => void;
  fetchSuggestions: (query: string) => Promise<AutocompleteItem[]>;
  placeholder?: string;
  className?: string;
}

/**
 * Autocomplete Input with floating Trie-based suggestion panel
 */
export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  onSelect,
  fetchSuggestions,
  placeholder,
  className,
}) => {
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchSuggestions(value);
        if (active) {
          setSuggestions(results);
        }
      } catch (err) {
        if (active) setSuggestions([]);
      } finally {
        if (active) setIsLoading(false);
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
    <div ref={containerRef} className={`relative flex-1 ${className || ''}`}>
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
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelect(item);
                setIsOpen(false);
              }}
              className="w-full text-left px-3.5 py-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-between group transition-colors"
            >
              <div className="truncate pr-2">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-100 group-hover:text-[#3498db] transition-colors">
                  {item.texto}
                </span>
                {item.frecuencia && item.frecuencia > 1 ? (
                  <span className="ml-2 text-[10px] text-slate-400">
                    ({item.frecuencia} usos)
                  </span>
                ) : null}
              </div>
              <span className="text-xs font-bold font-mono text-[#3498db] bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded shrink-0">
                ${Number(item.precio).toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
