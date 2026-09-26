import React, { useState } from 'react';
import { SubCentreConfig } from '../types';
import { Settings, ShieldCheck, RefreshCw, Calendar, LogOut } from 'lucide-react';
import { LiveHeaderFx } from './LiveHeaderFx';
import { supabase } from '../lib/supabase';
import { ConfigModal } from './ConfigModal';
import {
  MARATHI_MONTHS,
  AVAILABLE_YEARS,
  parseReportingMonth,
  formatReportingMonth,
  toMarathiDigits,
} from '../utils/dateUtils';

interface Props {
  config: SubCentreConfig;
  onUpdateConfig: (newConfig: SubCentreConfig) => void;
  onResetData: () => void;
  onMonthYearChange?: (monthNum: number, year: number) => void;
}

export const Header: React.FC<Props> = ({ config, onUpdateConfig, onResetData, onMonthYearChange }) => {
  const [showConfig, setShowConfig] = useState(false);

  const { monthNum, year } = parseReportingMonth(config.reportingMonth);

  const handleMonthSelect = (newMonthNum: number) => {
    const formatted = formatReportingMonth(newMonthNum, year);
    onUpdateConfig({ ...config, reportingMonth: formatted });
    if (onMonthYearChange) {
      onMonthYearChange(newMonthNum, year);
    }
  };

  const handleYearSelect = (newYear: number) => {
    const formatted = formatReportingMonth(monthNum, newYear);
    onUpdateConfig({ ...config, reportingMonth: formatted });
    if (onMonthYearChange) {
      onMonthYearChange(monthNum, newYear);
    }
  };

  return (
    <>
      <header className="relative overflow-hidden bg-gradient-to-br from-[#1a4a72] via-[#1a4a72] to-[#0f2f4d] text-white shadow-lg rounded-b-2xl mb-4 transition-all">
        <LiveHeaderFx />
        <div className="relative max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 shrink-0">
              <div aria-hidden className="absolute inset-0 rounded-full border-2 border-dashed border-amber-300/40 animate-spin-slow" />
              <div className="animate-pop absolute inset-[5px] rounded-full bg-white/15 flex items-center justify-center border border-white/25 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-[#f39c12]" />
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-wide">
                {config.stateDepartment}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 font-medium">
                आरोग्य सेवक - {config.subCentreName} ({config.phcName})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
            {/* Month & Year Dropdown Controls */}
            <div className="flex items-center bg-white/10 hover:bg-white/15 border border-white/25 rounded-xl px-2.5 py-1.5 gap-2 transition-colors">
              <div className="flex items-center gap-1 text-xs text-amber-300 font-semibold shrink-0">
                <Calendar className="w-3.5 h-3.5" />
                <span>अहवाल कालावधी:</span>
              </div>

              {/* Month Dropdown */}
              <select
                id="header-month-select"
                aria-label="अहवाल महिना निवडा"
                value={monthNum}
                onChange={(e) => handleMonthSelect(parseInt(e.target.value, 10))}
                className="bg-[#123653] text-white font-bold text-xs rounded-lg px-2 py-1 outline-none border border-white/20 cursor-pointer hover:border-amber-400 focus:border-amber-400 transition-colors"
              >
                {MARATHI_MONTHS.map((m) => (
                  <option key={m.num} value={m.num} className="bg-[#1a4a72] text-white">
                    {m.marathiName} ({m.englishName.slice(0, 3)})
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                id="header-year-select"
                aria-label="अहवाल वर्ष निवडा"
                value={year}
                onChange={(e) => handleYearSelect(parseInt(e.target.value, 10))}
                className="bg-[#123653] text-white font-bold text-xs rounded-lg px-2 py-1 outline-none border border-white/20 cursor-pointer hover:border-amber-400 focus:border-amber-400 transition-colors"
              >
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y} className="bg-[#1a4a72] text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5 text-[#f39c12]" />
              Sign out
            </button>

            <button
              id="edit-config-btn"
              type="button"
              onClick={() => setShowConfig(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors cursor-pointer"
              title="उपकेंद्र माहिती बदला"
            >
              <Settings className="w-3.5 h-3.5 text-[#f39c12]" />
              माहिती बदला
            </button>

            <button
              id="reset-data-btn"
              type="button"
              onClick={() => {
                if (window.confirm('तुम्हाला सर्व डेटा पूर्ववत (मूळ स्थितीत) करायचा आहे का?')) {
                  onResetData();
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="सर्व डेटा पूर्ववत करा"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <ConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        config={config}
        onSave={onUpdateConfig}
      />
    </>
  );
};
