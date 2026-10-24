import React, { useState } from 'react';
import { Plus, Minus, ChevronDown, Check, Hash, Sliders } from 'lucide-react';

interface TouchQuantitySelectorProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unitLabel?: string;
  size?: 'sm' | 'md';
}

// 1 through 32 in sequential order as explicitly required
const SEQUENTIAL_1_TO_32 = Array.from({ length: 32 }, (_, i) => i + 1);

// Key truck & fleet presets for quick tap
const COMMON_PRESETS = [0, 1, 2, 5, 10, 12, 15, 20, 24, 25, 30, 32, 50, 55, 100];

export const TouchQuantitySelector: React.FC<TouchQuantitySelectorProps> = ({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  unitLabel = 'units',
  size = 'md',
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [isCustomInputOpen, setIsCustomInputOpen] = useState(false);
  const [customVal, setCustomVal] = useState(String(value));

  const currentVal = Math.max(min, Math.min(max, Number(value) || 0));

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = Math.max(min, currentVal - step);
    onChange(next);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = Math.min(max, currentVal + step);
    onChange(next);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setCustomVal(String(currentVal > 32 ? currentVal : 40));
      setIsCustomInputOpen(true);
      setShowPresets(true);
    } else {
      const num = Number(val);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  const handlePresetSelect = (preset: number) => {
    onChange(preset);
    setShowPresets(false);
    setIsCustomInputOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Math.max(min, Math.min(max, Math.floor(Number(customVal) || 0)));
    onChange(num);
    setIsCustomInputOpen(false);
    setShowPresets(false);
  };

  const isSmall = size === 'sm';

  return (
    <div className="relative inline-block text-left w-full sm:w-auto">
      
      {/* Primary Touch Bar: Minus | Sequential Dropdown & Counter | Plus */}
      <div className="flex items-center bg-gray-50/90 hover:bg-gray-100/70 border border-gray-300 rounded-xl p-1 shadow-2xs transition-all">
        
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={currentVal <= min}
          title="Decrease Quantity (-1)"
          className={`w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-black transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
            isSmall ? 'w-8 h-8' : ''
          }`}
        >
          <Minus className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Counter Display & Sequential Dropdown Selector (1 through 32) */}
        <div className="relative flex-1 min-w-[96px] sm:min-w-[88px] flex items-center justify-center">
          
          {/* Native / Apple-Style Sequential Dropdown (1 through 32 + Custom) */}
          <select
            value={currentVal <= 32 ? currentVal : 'custom'}
            onChange={handleSelectChange}
            aria-label="Select quantity 1 to 32"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          >
            <option value={0}>0 {unitLabel}</option>
            {SEQUENTIAL_1_TO_32.map((num) => (
              <option key={num} value={num}>
                {num} {unitLabel}
              </option>
            ))}
            {currentVal > 32 && (
              <option value={currentVal}>
                {currentVal} {unitLabel} (Custom)
              </option>
            )}
            <option value="custom">Custom (&gt; 32)...</option>
          </select>

          {/* Visual Display Button */}
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            title="Click to select quantity from presets or enter custom"
            className="w-full px-2 py-1 text-center hover:bg-white/90 rounded-lg transition-colors cursor-pointer group flex items-center justify-center space-x-1"
          >
            <span className="font-mono font-black text-sm sm:text-base text-gray-900 tracking-tight">
              {currentVal}
            </span>
            <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
              {unitLabel}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition-transform pointer-events-none" />
          </button>
        </div>

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={currentVal >= max}
          title="Increase Quantity (+1)"
          className={`w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-black transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
            isSmall ? 'w-8 h-8' : ''
          }`}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>

      </div>

      {/* Preset Drawer / Dropdown Popover */}
      {showPresets && (
        <>
          {/* Backdrop click dismiss */}
          <div 
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[0.5px]" 
            onClick={() => setShowPresets(false)} 
          />

          <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-50 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 p-3.5 space-y-3 animate-fade-in">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1">
                <Sliders className="w-3.5 h-3.5 text-[#E53935]" />
                <span>Quantity Selector (1–32)</span>
              </span>
              <span className="text-[10px] text-gray-400">
                Touch-Friendly
              </span>
            </div>

            {/* Quick Presets Grid (Includes 12, 15, 20, 25, 32) */}
            <div className="grid grid-cols-4 gap-1.5">
              {COMMON_PRESETS.map((preset) => {
                const isSelected = preset === currentVal;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                      isSelected
                        ? 'bg-[#E53935] text-white shadow-2xs'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200'
                    }`}
                  >
                    <span>{preset}</span>
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </button>
                );
              })}
            </div>

            {/* Sequential 1 to 32 Dropdown Picker */}
            <div className="pt-2 border-t border-gray-100 space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase block">
                Select Any Exact Quantity (1 through 32):
              </label>
              <select
                value={currentVal <= 32 ? currentVal : 'custom'}
                onChange={handleSelectChange}
                className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-gray-800 focus:outline-none focus:border-[#E53935]"
              >
                <option value={0}>0 units</option>
                {SEQUENTIAL_1_TO_32.map((n) => (
                  <option key={n} value={n}>
                    {n} units
                  </option>
                ))}
                {currentVal > 32 && (
                  <option value={currentVal}>
                    {currentVal} units (Custom)
                  </option>
                )}
                <option value="custom">Custom (&gt; 32)...</option>
              </select>
            </div>

            {/* Custom Quantity Option for values > 32 */}
            <div className="pt-2 border-t border-gray-100">
              {isCustomInputOpen ? (
                <form onSubmit={handleCustomSubmit} className="flex items-center space-x-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={min}
                    max={max}
                    autoFocus
                    placeholder="e.g. 50"
                    value={customVal}
                    onChange={(e) => setCustomVal(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#E53935]"
                  />
                  <button
                    type="submit"
                    className="py-1 px-3 bg-[#E53935] text-white rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    Set
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCustomVal(String(currentVal > 32 ? currentVal : ''));
                    setIsCustomInputOpen(true);
                  }}
                  className="w-full py-1.5 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Hash className="w-3.5 h-3.5 text-gray-500" />
                  <span>Enter Custom Large Quantity (&gt;32)...</span>
                </button>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
};
