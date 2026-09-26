import React, { useState, useEffect } from 'react';
import { toEnglishDigits, parseNumberInput } from '../../utils/dateUtils';
import { Plus, Minus } from 'lucide-react';

interface NumberInputProps {
  id?: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  showStepButtons?: boolean;
  disabled?: boolean;
  /** When true, a value of 0 is displayed as an empty field (no "0" visible). Data stays 0. */
  emptyOnZero?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  id,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  className = '',
  placeholder = '0',
  ariaLabel,
  showStepButtons = false,
  disabled = false,
  emptyOnZero = false,
}) => {
  const toText = (v: number | undefined | null): string => {
    const num = v !== undefined && v !== null ? v : 0;
    return emptyOnZero && num === 0 ? '' : String(num);
  };
  // Local text representation to allow backspacing to empty string without snapping to 0
  const [text, setText] = useState<string>(() => toText(value));

  useEffect(() => {
    // Keep in sync if external value changed
    setText(toText(value));
  }, [value, emptyOnZero]);

  // With emptyOnZero, don't show a faded "0" placeholder either
  const resolvedPlaceholder = emptyOnZero && placeholder === '0' ? '' : placeholder;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    
    // Convert Marathi digits to English digits
    const engDigits = toEnglishDigits(rawVal);
    // Allow digits and optional negative sign if min < 0
    const filtered = min < 0 ? engDigits.replace(/[^0-9-]/g, '') : engDigits.replace(/[^0-9]/g, '');

    setText(filtered);

    if (filtered === '' || filtered === '-') {
      // User is clearing the input to type a new number
      // We do not immediately force a 0 so they can freely type
      return;
    }

    let parsed = parseNumberInput(filtered, min);
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;

    onChange(parsed);
  };

  const handleBlur = () => {
    if (text === '' || text === '-') {
      const fallback = min !== undefined ? min : 0;
      // With emptyOnZero, keep the field visually empty (data is still 0)
      setText(emptyOnZero && fallback === 0 ? '' : String(fallback));
      onChange(fallback);
    } else {
      let parsed = parseNumberInput(text, min);
      if (min !== undefined && parsed < min) parsed = min;
      if (max !== undefined && parsed > max) parsed = max;
      setText(String(parsed));
      onChange(parsed);
    }
  };

  const increment = (delta: number) => {
    let next = (parseNumberInput(text, min) || 0) + delta;
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    setText(String(next));
    onChange(next);
  };

  if (showStepButtons) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => increment(-step)}
          disabled={disabled || (min !== undefined && value <= min)}
          className="p-1 rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={`कमी करा (-${step})`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={text}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={resolvedPlaceholder}
          aria-label={ariaLabel}
          disabled={disabled}
          className={`text-center font-mono ${className}`}
        />
        <button
          type="button"
          onClick={() => increment(step)}
          disabled={disabled || (max !== undefined && value >= max)}
          className="p-1 rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={`वाढवा (+${step})`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={text}
      onChange={handleInputChange}
      onBlur={handleBlur}
      placeholder={resolvedPlaceholder}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`font-mono ${className}`}
    />
  );
};
