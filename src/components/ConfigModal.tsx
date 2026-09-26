import React, { useState } from 'react';
import { SubCentreConfig } from '../types';
import { X, Save, Building2, User, Calendar, Users } from 'lucide-react';
import {
  MARATHI_MONTHS,
  AVAILABLE_YEARS,
  parseReportingMonth,
  formatReportingMonth,
} from '../utils/dateUtils';
import { NumberInput } from './common/NumberInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: SubCentreConfig;
  onSave: (updated: SubCentreConfig) => void;
}

export const ConfigModal: React.FC<Props> = ({ isOpen, onClose, config, onSave }) => {
  const [formData, setFormData] = useState<SubCentreConfig>({ ...config });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-scale-in">
        <div className="bg-[#1a4a72] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg">उपकेंद्र व आरोग्य सेवक माहिती बदला</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">विभागाचे नाव</label>
            <input
              type="text"
              value={formData.stateDepartment}
              onChange={(e) => setFormData({ ...formData, stateDepartment: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a4a72] outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">जिल्हा</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a4a72] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">तालुका</label>
              <input
                type="text"
                value={formData.taluka}
                onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a4a72] outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">प्राथमिक आरोग्य केंद्र (PHC)</label>
            <input
              type="text"
              value={formData.phcName}
              onChange={(e) => setFormData({ ...formData, phcName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a4a72] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">उपकेंद्राचे नाव</label>
            <input
              type="text"
              value={formData.subCentreName}
              onChange={(e) => setFormData({ ...formData, subCentreName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a4a72] outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">आरोग्य सेवक नाव</label>
              <input
                type="text"
                value={formData.workerName}
                onChange={(e) => setFormData({ ...formData, workerName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a4a72] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">पद / हुद्दा</label>
              <input
                type="text"
                value={formData.workerDesignation}
                onChange={(e) => setFormData({ ...formData, workerDesignation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a4a72] outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              अहवाल महिना व वर्ष (Month & Year)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                id="modal-month-select"
                aria-label="महिना निवडा"
                value={parseReportingMonth(formData.reportingMonth).monthNum}
                onChange={(e) => {
                  const newM = parseInt(e.target.value, 10);
                  const currentY = parseReportingMonth(formData.reportingMonth).year;
                  setFormData({
                    ...formData,
                    reportingMonth: formatReportingMonth(newM, currentY),
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1a4a72] outline-none bg-white"
              >
                {MARATHI_MONTHS.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.marathiName} ({m.englishName})
                  </option>
                ))}
              </select>

              <select
                id="modal-year-select"
                aria-label="वर्ष निवडा"
                value={parseReportingMonth(formData.reportingMonth).year}
                onChange={(e) => {
                  const newY = parseInt(e.target.value, 10);
                  const currentM = parseReportingMonth(formData.reportingMonth).monthNum;
                  setFormData({
                    ...formData,
                    reportingMonth: formatReportingMonth(currentM, newY),
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1a4a72] outline-none bg-white"
              >
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              निवडलेला अहवाल कालावधी:{' '}
              <span className="font-bold text-[#1a4a72]">{formData.reportingMonth}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">उपकेंद्र लोकसंख्या</label>
              <NumberInput
                value={formData.subCentrePopulation}
                onChange={(val) => setFormData({ ...formData, subCentrePopulation: val })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a4a72] outline-none"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">एकूण कुटुंबे</label>
              <NumberInput
                value={formData.totalHouseholds}
                onChange={(val) => setFormData({ ...formData, totalHouseholds: val })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a4a72] outline-none"
                min={0}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              रद्द करा
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-[#1a4a72] text-white hover:bg-[#133756] rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" /> माहिती जतन करा
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
