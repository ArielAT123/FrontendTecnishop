import React, { useState, useEffect } from 'react';

export interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  value: number | string | undefined | null;
  onChange: (value: number) => void;
  allowDecimals?: boolean;
  min?: number;
  max?: number;
}

export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      value,
      onChange,
      allowDecimals = true,
      min = 0,
      max,
      placeholder,
      className = '',
      id,
      onBlur,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);
    const defaultPlaceholder = placeholder !== undefined ? placeholder : allowDecimals ? '0.00' : '0';

    const formatInitial = (val: number | string | undefined | null): string => {
      if (val === undefined || val === null || val === '' || val === 0 || val === '0') {
        return '';
      }
      const n = Number(val);
      if (isNaN(n) || n === 0) {
        return '';
      }
      return String(val);
    };

    const [text, setText] = useState<string>(() => formatInitial(value));

    // Sincronizar si el valor cambia externamente (ej: selección de chequeo en dropdown o reset)
    useEffect(() => {
      const currentNumeric = text === '' || text === '.' ? 0 : parseFloat(text);
      const incomingNumeric = value === undefined || value === null || value === '' ? 0 : Number(value);

      if (!isNaN(incomingNumeric) && incomingNumeric !== currentNumeric) {
        setText(formatInitial(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;

      // Si el usuario borra todo, dejar visualmente vacío pero emitir 0
      if (raw === '') {
        setText('');
        onChange(0);
        return;
      }

      // Reemplazar coma por punto para compatibilidad con teclados en español
      raw = raw.replace(/,/g, '.');

      if (!allowDecimals) {
        // Solo dígitos enteros
        raw = raw.replace(/[^0-9]/g, '');
      } else {
        // Solo dígitos y máximo un punto decimal
        raw = raw.replace(/[^0-9.]/g, '');
        const parts = raw.split('.');
        if (parts.length > 2) {
          raw = parts[0] + '.' + parts.slice(1).join('');
        }
      }

      // Si empieza con cero seguido de otro dígito (ej: "01", "04", "06"), eliminar el cero inicial
      // Pero preservar "0." para números decimales válidos como 0.50
      if (/^0+[0-9]/.test(raw)) {
        raw = raw.replace(/^0+/, '');
      }

      // Si el usuario escribe únicamente "." convertir a "0."
      if (raw === '.') {
        raw = '0.';
      }

      setText(raw);

      const parsed = parseFloat(raw);
      if (isNaN(parsed)) {
        onChange(0);
      } else {
        if (max !== undefined && parsed > max) {
          setText(String(max));
          onChange(max);
        } else {
          onChange(parsed);
        }
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (text === '.' || text === '0.') {
        setText('');
        onChange(0);
      } else if (min !== undefined && min > 0 && (text === '' || (Number(text) < min && !isNaN(Number(text))))) {
        setText(String(min));
        onChange(min);
      }
      if (onBlur) {
        onBlur(e);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode={allowDecimals ? 'decimal' : 'numeric'}
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={defaultPlaceholder}
            disabled={disabled}
            className={`block w-full rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 focus:border-[#3498db] disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-9' : 'pl-3'
            } ${rightIcon ? 'pr-9' : 'pr-3'} py-2 ${
              error
                ? 'border-rose-500 focus:ring-rose-500/50 focus:border-rose-500'
                : 'border-slate-300 dark:border-slate-700'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

NumericInput.displayName = 'NumericInput';
