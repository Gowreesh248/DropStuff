import React from 'react';
import { ExpirationOption } from '../types/index.js';
import { Clock } from 'lucide-react';

interface ExpirationPickerProps {
  selected: ExpirationOption;
  onChange: (value: ExpirationOption) => void;
  disabled?: boolean;
}

const options: { value: ExpirationOption; label: string }[] = [
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '24h', label: '24 hours' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
];

export const ExpirationPicker: React.FC<ExpirationPickerProps> = ({
  selected,
  onChange,
  disabled,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        Drop expires
      </label>

      <div className="grid grid-cols-5 gap-2">
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all text-center select-none ${
                isSelected
                  ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
