import React, { useState, useEffect } from 'react';
import { ContainerSurveyData } from '../types';
import { calculateIndices } from '../utils/exportUtils';
import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Eye,
  Activity,
  HeartPulse,
  Edit3,
  Save,
  Check,
  PlusCircle,
  FileCheck2,
} from 'lucide-react';
import { NumberInput } from './common/NumberInput';

interface Props {
  survey: ContainerSurveyData;
  onUpdateSurvey: (updated: ContainerSurveyData) => void;
}

export const SurveyProgramsTab: React.FC<Props> = ({ survey, onUpdateSurvey }) => {
  const [isEditingBulk, setIsEditingBulk] = useState(false);
  const [bulkData, setBulkData] = useState<ContainerSurveyData>({ ...survey });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // महिना बदलल्यास survey prop बदलतो — तेव्हा फॉर्म नवीन महिन्याच्या
  // डेटाने रिफ्रेश करा, नाहीतर जुना महिन्याचेच आकडे दिसत राहतात.
  useEffect(() => {
    setBulkData({ ...survey });
  }, [survey]);

  const indices = calculateIndices(survey);

  const handleFieldChange = (field: keyof ContainerSurveyData, value: any) => {
    onUpdateSurvey({
      ...survey,
      [field]: value,
    });
  };

  const handleExplicitSave = () => {
    onUpdateSurvey({ ...survey });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveBulk = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSurvey(bulkData);
    setIsEditingBulk(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Banner with Save & Edit Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1a4a72] flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-[#f39c12]" />
            १. सर्वेक्षण व राष्ट्रीय कार्यक्रम आकडेवारी
          </h2>
          <p className="text-xs text-slate-500">
            कंटेनर इंडेक्स, पाणी/मीठ चाचणी, TCL क्लोरीनेशन, क्षयरोग, कुष्ठरोग व मोतीबिंदू आकडेवारी
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-300 animate-pulse">
              <Check className="w-4 h-4 text-emerald-600" /> आकडेवारी यशस्वीरीत्या जतन झाली!
            </span>
          )}

          <button
            type="button"
            onClick={handleExplicitSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            title="बदललेली सर्व आकडेवारी जतन करा"
          >
            <Save className="w-3.5 h-3.5" />
            आकडेवारी सेव्ह करा
          </button>

          <button
            type="button"
            onClick={() => {
              setBulkData({ ...survey });
              setIsEditingBulk(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1a4a72] hover:bg-[#123653] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            सर्व आकडेवारी एकत्र भरा / बदला
          </button>
        </div>
      </div>

      {/* 1. CONTAINER SURVEY & INDICES */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6 animate-fade-up" style={{ animationDelay: '0ms' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1a4a72] flex items-center gap-2">
              अ. कंटेनर सर्वेक्षण (Index Calculation - कीटकशास्त्र)
            </h3>
            <p className="text-xs text-slate-500">
              घरे व भांडी तपासणीवरून हाउस इंडेक्स (HI), कंटेनर इंडेक्स (CI) व ब्रेटू इंडेक्स (BI) स्वयंचलित गणना
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${indices.riskColor}`}
          >
            {indices.riskLevel.includes('High') ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {indices.riskLevel}
          </span>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 focus-within:ring-2 focus-within:ring-[#1a4a72] focus-within:bg-white transition-all">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              तपासलेली घरे (Insp. Houses)
            </label>
            <NumberInput emptyOnZero
              value={survey.inspHouses}
              onChange={(val) => handleFieldChange('inspHouses', val)}
              showStepButtons={true}
              step={5}
              className="w-full text-base sm:text-lg font-bold text-[#1a4a72] bg-transparent outline-none"
              min={0}
            />
          </div>

          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 focus-within:ring-2 focus-within:ring-rose-500 focus-within:bg-white transition-all">
            <label className="block text-xs font-semibold text-rose-700 mb-1">
              दूषित घरे (Pos. Houses)
            </label>
            <NumberInput emptyOnZero
              value={survey.posHouses}
              onChange={(val) => handleFieldChange('posHouses', val)}
              showStepButtons={true}
              step={1}
              className="w-full text-base sm:text-lg font-bold text-rose-600 bg-transparent outline-none"
              min={0}
            />
          </div>

          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 focus-within:ring-2 focus-within:ring-[#1a4a72] focus-within:bg-white transition-all">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              तपासलेली भांडी (Insp. Containers)
            </label>
            <NumberInput emptyOnZero
              value={survey.inspCont}
              onChange={(val) => handleFieldChange('inspCont', val)}
              showStepButtons={true}
              step={5}
              className="w-full text-base sm:text-lg font-bold text-[#1a4a72] bg-transparent outline-none"
              min={0}
            />
          </div>

          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 focus-within:ring-2 focus-within:ring-rose-500 focus-within:bg-white transition-all">
            <label className="block text-xs font-semibold text-rose-700 mb-1">
              दूषित भांडी (Pos. Containers)
            </label>
            <NumberInput emptyOnZero
              value={survey.posCont}
              onChange={(val) => handleFieldChange('posCont', val)}
              showStepButtons={true}
              step={1}
              className="w-full text-base sm:text-lg font-bold text-rose-600 bg-transparent outline-none"
              min={0}
            />
          </div>
        </div>

        {/* Calculated Results */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 border border-slate-200">
          <div className="grid grid-cols-3 text-center divide-x divide-slate-200">
            <div className="px-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">HI % (House Index)</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1a4a72] mt-0.5">
                {indices.hi}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                (दूषित घरे / तपासलेली घरे × १००)
              </div>
            </div>

            <div className="px-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">CI % (Container Index)</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1a4a72] mt-0.5">
                {indices.ci}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                (दूषित भांडी / तपासलेली भांडी × १००)
              </div>
            </div>

            <div className="px-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">BI Index (Breteau Index)</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1a4a72] mt-0.5">
                {indices.bi}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                (दूषित भांडी / तपासलेली घरे × १००)
              </div>
            </div>
          </div>
        </div>

        {/* Preventive Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-700 mb-2">अळी प्रतिबंधात्मक कामे:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <div className="text-[11px] font-semibold text-slate-600 mb-1">अबेटिंग भांडी (Temephos)</div>
              <NumberInput emptyOnZero
                value={survey.temephosCont}
                onChange={(val) => handleFieldChange('temephosCont', val)}
                showStepButtons={true}
                step={1}
                className="w-full text-center font-bold text-slate-900 bg-white border border-slate-200 rounded py-1"
                min={0}
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <div className="text-[11px] font-semibold text-slate-600 mb-1">रिकामी / उलटी केलेली भांडी</div>
              <NumberInput emptyOnZero
                value={survey.emptiedCont}
                onChange={(val) => handleFieldChange('emptiedCont', val)}
                showStepButtons={true}
                step={1}
                className="w-full text-center font-bold text-slate-900 bg-white border border-slate-200 rounded py-1"
                min={0}
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <div className="text-[11px] font-semibold text-slate-600 mb-1">गप्पी मासे ठिकाणे</div>
              <NumberInput emptyOnZero
                value={survey.guppySites}
                onChange={(val) => handleFieldChange('guppySites', val)}
                showStepButtons={true}
                step={1}
                className="w-full text-center font-bold text-slate-900 bg-white border border-slate-200 rounded py-1"
                min={0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. WATER QUALITY, SALT TESTING & TCL SURVEILLANCE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-sm sm:text-base font-bold text-[#1a4a72] flex items-center gap-2">
            <Droplets className="w-5 h-5 text-sky-600" />
            ब. पाणी गुणवत्ता, मीठ नमुने व TCL क्लोरीनेशन तपासणी
          </h3>
          <p className="text-xs text-slate-500">
            जैविक व रासायनिक पाणी नमुने, मीठ आयोडीन तपासणी व टी.सी.एल. (TCL) पावडर वापर आकडेवारी
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Biological Water */}
          <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-sky-900">पाणी जैविक (Biological)</span>
              <select
                value={survey.waterBioSentStatus}
                onChange={(e) => handleFieldChange('waterBioSentStatus', e.target.value)}
                className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-sky-300 text-sky-900 outline-none"
              >
                <option value="होय">पाठवले (होय)</option>
                <option value="नाही">नाही</option>
              </select>
            </div>
            <div className="text-[11px] text-slate-600 mb-1">प्रयोगशाळेस पाठवले की नाही</div>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-xs font-medium text-slate-700">पाठवलेले नमुने:</span>
              <div className="w-28">
                <NumberInput emptyOnZero
                  value={survey.waterBioSent}
                  onChange={(val) => handleFieldChange('waterBioSent', val)}
                  showStepButtons={true}
                  step={1}
                  className="w-full px-1.5 py-1 bg-white border border-sky-300 rounded text-center font-bold text-sky-900 text-sm outline-none"
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Chemical Water */}
          <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-indigo-900">पाणी रासायनिक (Chemical)</span>
              <select
                value={survey.waterChemSentStatus}
                onChange={(e) => handleFieldChange('waterChemSentStatus', e.target.value)}
                className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-indigo-300 text-indigo-900 outline-none"
              >
                <option value="होय">पाठवले (होय)</option>
                <option value="नाही">नाही</option>
              </select>
            </div>
            <div className="text-[11px] text-slate-600 mb-1">प्रयोगशाळेस पाठवले की नाही</div>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-xs font-medium text-slate-700">पाठवलेले नमुने:</span>
              <div className="w-28">
                <NumberInput emptyOnZero
                  value={survey.waterChemSent}
                  onChange={(val) => handleFieldChange('waterChemSent', val)}
                  showStepButtons={true}
                  step={1}
                  className="w-full px-1.5 py-1 bg-white border border-indigo-300 rounded text-center font-bold text-indigo-900 text-sm outline-none"
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Salt Iodine Sample */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-900">मीठ नमुना तपासणी</span>
              <select
                value={survey.saltSampleSentStatus}
                onChange={(e) => handleFieldChange('saltSampleSentStatus', e.target.value)}
                className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-900 outline-none"
              >
                <option value="होय">पाठवले (होय)</option>
                <option value="नाही">नाही</option>
              </select>
            </div>
            <div className="text-[11px] text-slate-600 mb-1">तपासणीसाठी पाठवला की नाही</div>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-xs font-medium text-slate-700">तपासलेले नमुने:</span>
              <div className="w-28">
                <NumberInput emptyOnZero
                  value={survey.saltSampleSent}
                  onChange={(val) => handleFieldChange('saltSampleSent', val)}
                  showStepButtons={true}
                  step={1}
                  className="w-full px-1.5 py-1 bg-white border border-amber-300 rounded text-center font-bold text-amber-900 text-sm outline-none"
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* TCL & OT Tests */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
            <div className="text-xs font-bold text-emerald-900 mb-1">TCL पावडर व ओटी टेस्ट</div>
            <div className="text-[11px] text-slate-600 mb-2">पाणी शुद्धीकरण क्लोरीनेशन</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-semibold text-slate-600 block mb-1">TCL वापर (kg):</span>
                <NumberInput emptyOnZero
                  value={survey.tclUsedKg}
                  onChange={(val) => handleFieldChange('tclUsedKg', val)}
                  className="w-full px-1.5 py-1 bg-white border border-emerald-300 rounded text-center font-bold text-emerald-900 text-sm outline-none"
                  min={0}
                />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-600 block mb-1">ओटी चाचण्या:</span>
                <NumberInput emptyOnZero
                  value={survey.chlorineTests}
                  onChange={(val) => handleFieldChange('chlorineTests', val)}
                  className="w-full px-1.5 py-1 bg-white border border-emerald-300 rounded text-center font-bold text-emerald-900 text-sm outline-none"
                  min={0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Village marriage statistics */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200/80 p-4 sm:p-6 animate-fade-up" style={{ animationDelay: '160ms' }}>
        <div className="pb-3 border-b border-amber-100 mb-4 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-amber-800">गावातील सामाजिक आकडेवारी</h3>
            <p className="text-xs text-slate-500">गावात झालेल्या लग्नांची एकूण संख्या</p>
          </div>
          <span className="text-xs font-bold rounded-full bg-amber-100 text-amber-800 px-3 py-1">लग्न नोंद</span>
        </div>
        <div className="flex items-center justify-between bg-amber-50/60 p-3 rounded-xl border border-amber-200">
          <span className="text-sm text-slate-700 font-semibold">गावात झालेली एकूण लग्ने</span>
          <div className="w-28">
            <NumberInput emptyOnZero
              value={survey.villageMarriages}
              onChange={(val) => handleFieldChange('villageMarriages', val)}
              showStepButtons={true}
              step={1}
              className="w-full text-center font-bold text-sm text-amber-700 bg-white border border-amber-300 rounded py-1 outline-none focus:ring-1 focus:ring-amber-500"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Blood sample statistics */}
      <div className="bg-white rounded-2xl shadow-sm border border-rose-200/80 p-4 sm:p-6 animate-fade-up" style={{ animationDelay: '240ms' }}>
        <div className="pb-3 border-b border-rose-100 mb-4 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-rose-800">रक्त तपासणी आकडेवारी</h3>
            <p className="text-xs text-slate-500">गावात घेतलेल्या रक्तनमुन्यांची एकूण संख्या</p>
          </div>
          <span className="text-xs font-bold rounded-full bg-rose-100 text-rose-800 px-3 py-1">रक्तनमुने</span>
        </div>
        <div className="flex items-center justify-between bg-rose-50/60 p-3 rounded-xl border border-rose-200">
          <span className="text-sm text-slate-700 font-semibold">एकूण घेतलेले रक्तनमुने</span>
          <div className="w-28">
            <NumberInput emptyOnZero
              value={survey.bloodSamplesTaken}
              onChange={(val) => handleFieldChange('bloodSamplesTaken', val)}
              showStepButtons={true}
              step={1}
              className="w-full text-center font-bold text-sm text-rose-700 bg-white border border-rose-300 rounded py-1 outline-none focus:ring-1 focus:ring-rose-500"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* 3. NATIONAL HEALTH PROGRAMS (TB, LEPROSY, CATARACT) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6 animate-fade-up" style={{ animationDelay: '320ms' }}>
        <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1a4a72] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#f39c12]" />
              क. राष्ट्रीय आरोग्य कार्यक्रम आकडेवारी (TB, कुष्ठरोग व मोतीबिंदू)
            </h3>
            <p className="text-xs text-slate-500">
              उपकेंद्र कार्यक्षेत्रातील क्षयरोग, कुष्ठरोग आणि मोतीबिंदू संशयित व उपचाराखालील रुग्ण संख्या
            </p>
          </div>
          <button
            type="button"
            onClick={handleExplicitSave}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            बदल सेव्ह करा
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tuberculosis (TB) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                  १. क्षयरोग (Tuberculosis - NTEP)
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                TB
              </span>
            </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-700 font-medium">एकूण क्षयरुग्ण संख्या:</span>
                <div className="w-28">
                  <NumberInput emptyOnZero
                    value={survey.tbTotal}
                    onChange={(val) => handleFieldChange('tbTotal', val)}
                    showStepButtons={true}
                    step={1}
                    className="w-full text-center font-bold text-sm text-[#1a4a72] bg-slate-50 border border-slate-300 rounded py-0.5 outline-none focus:ring-1 focus:ring-[#1a4a72]"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-700 font-medium">संशयित क्षयरुग्ण संख्या:</span>
                <div className="w-28">
                  <NumberInput emptyOnZero
                    value={survey.tbSuspected}
                    onChange={(val) => handleFieldChange('tbSuspected', val)}
                    showStepButtons={true}
                    step={1}
                    className="w-full text-center font-bold text-sm text-amber-600 bg-slate-50 border border-slate-300 rounded py-0.5 outline-none focus:ring-1 focus:ring-amber-500"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-700 font-medium">उपचाराखालील क्षयरुग्ण:</span>
                <div className="w-28">
                  <NumberInput emptyOnZero
                    value={survey.tbUnderTreatment}
                    onChange={(val) => handleFieldChange('tbUnderTreatment', val)}
                    showStepButtons={true}
                    step={1}
                    className="w-full text-center font-bold text-sm text-emerald-600 bg-slate-50 border border-slate-300 rounded py-0.5 outline-none focus:ring-1 focus:ring-emerald-500"
                    min={0}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Leprosy */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-600" />
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                  २. कुष्ठरोग (Leprosy - NLEP)
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                NLEP
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-700 font-medium">संशयित कुष्ठरुग्ण संख्या:</span>
                <div className="w-28">
                  <NumberInput emptyOnZero
                    value={survey.leprosySuspected}
                    onChange={(val) => handleFieldChange('leprosySuspected', val)}
                    showStepButtons={true}
                    step={1}
                    className="w-full text-center font-bold text-sm text-purple-700 bg-slate-50 border border-slate-300 rounded py-0.5 outline-none focus:ring-1 focus:ring-purple-500"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-700 font-medium">उपचाराखालील कुष्ठरुग्ण:</span>
                <div className="w-28">
                  <NumberInput emptyOnZero
                    value={survey.leprosyUnderTreatment}
                    onChange={(val) => handleFieldChange('leprosyUnderTreatment', val)}
                    showStepButtons={true}
                    step={1}
                    className="w-full text-center font-bold text-sm text-emerald-600 bg-slate-50 border border-slate-300 rounded py-0.5 outline-none focus:ring-1 focus:ring-emerald-500"
                    min={0}
                  />
                </div>
              </div>

              <div className="p-2.5 bg-purple-50/50 rounded-lg text-[11px] text-purple-900 border border-purple-200">
                त्वचा डाग सर्वेक्षण व एमडीटी (MDT) औषधोपचार नियमित सुरू आहे.
              </div>
            </div>
          </div>

          {/* Cataract */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-sky-600" />
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                  ३. मोतीबिंदू (Cataract - NPCB)
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                नेत्र आरोग्य
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-700 font-medium">संशयित मोतीबिंदू संख्या:</span>
                <div className="w-28">
                  <NumberInput emptyOnZero
                    value={survey.cataractSuspected}
                    onChange={(val) => handleFieldChange('cataractSuspected', val)}
                    showStepButtons={true}
                    step={1}
                    className="w-full text-center font-bold text-sm text-sky-700 bg-slate-50 border border-slate-300 rounded py-0.5 outline-none focus:ring-1 focus:ring-sky-500"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-700 font-medium">ऑपरेशन झालेले मोतीबिंदू:</span>
                <div className="w-28">
                  <NumberInput emptyOnZero
                    value={survey.cataractOperated}
                    onChange={(val) => handleFieldChange('cataractOperated', val)}
                    showStepButtons={true}
                    step={1}
                    className="w-full text-center font-bold text-sm text-emerald-600 bg-slate-50 border border-slate-300 rounded py-0.5 outline-none focus:ring-1 focus:ring-emerald-500"
                    min={0}
                  />
                </div>
              </div>

              <div className="p-2.5 bg-sky-50/50 rounded-lg text-[11px] text-sky-900 border border-sky-200">
                नेत्र तपासणी शिबिर व शासकीय रुग्णालयात मोफत शस्त्रक्रिया संदर्भ.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save Action Bar */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 flex items-center justify-between flex-wrap gap-2 animate-fade-up" style={{ animationDelay: '420ms' }}>
        <div className="text-xs text-slate-600">
          टीप: आपण प्रविष्ट केलेले आकडे आपोआप चालू महिन्यासाठी जतन होतात. खात्रीसाठी खालील बटन दाबून सेव्ह करू शकता.
        </div>
        <button
          type="button"
          onClick={handleExplicitSave}
          className="pressable inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          ही सर्व आकडेवारी सेव्ह करा
        </button>
      </div>

      {/* Bulk Edit Modal */}
      {isEditingBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-scale-in">
            <div className="bg-[#1a4a72] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base sm:text-lg">
                  सर्व सर्वेक्षण व कार्यक्रम आकडेवारी एकत्र भरा / बदला
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingBulk(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBulk} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="border-b pb-3">
                <h4 className="font-bold text-xs text-[#1a4a72] mb-2 uppercase">१. कंटेनर सर्वेक्षण</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">तपासलेली घरे</label>
                    <NumberInput emptyOnZero
                      value={bulkData.inspHouses}
                      onChange={(val) => setBulkData({ ...bulkData, inspHouses: val })}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">दूषित घरे</label>
                    <NumberInput emptyOnZero
                      value={bulkData.posHouses}
                      onChange={(val) => setBulkData({ ...bulkData, posHouses: val })}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">तपासलेली भांडी</label>
                    <NumberInput emptyOnZero
                      value={bulkData.inspCont}
                      onChange={(val) => setBulkData({ ...bulkData, inspCont: val })}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">दूषित भांडी</label>
                    <NumberInput emptyOnZero
                      value={bulkData.posCont}
                      onChange={(val) => setBulkData({ ...bulkData, posCont: val })}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div className="border-b pb-3">
                <h4 className="font-bold text-xs text-[#1a4a72] mb-2 uppercase">२. पाणी, मीठ व TCL</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">पाणी जैविक पाठवले?</label>
                    <select
                      value={bulkData.waterBioSentStatus}
                      onChange={(e) => setBulkData({ ...bulkData, waterBioSentStatus: e.target.value as any })}
                      className="w-full px-2 py-1 text-xs border rounded bg-white"
                    >
                      <option value="होय">होय</option>
                      <option value="नाही">नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">पाणी रासायनिक पाठवले?</label>
                    <select
                      value={bulkData.waterChemSentStatus}
                      onChange={(e) => setBulkData({ ...bulkData, waterChemSentStatus: e.target.value as any })}
                      className="w-full px-2 py-1 text-xs border rounded bg-white"
                    >
                      <option value="होय">होय</option>
                      <option value="नाही">नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">मीठ नमुना पाठवला?</label>
                    <select
                      value={bulkData.saltSampleSentStatus}
                      onChange={(e) => setBulkData({ ...bulkData, saltSampleSentStatus: e.target.value as any })}
                      className="w-full px-2 py-1 text-xs border rounded bg-white"
                    >
                      <option value="होय">होय</option>
                      <option value="नाही">नाही</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">TCL वापर (किलो)</label>
                    <NumberInput emptyOnZero
                      value={bulkData.tclUsedKg}
                      onChange={(val) => setBulkData({ ...bulkData, tclUsedKg: val })}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-[#1a4a72] mb-2 uppercase">३. TB, कुष्ठरोग व मोतीबिंदू</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <div>
        <label className="text-[11px] font-semibold text-amber-700 block mb-1">गावात झालेली एकूण लग्ने</label>
        <NumberInput emptyOnZero
          value={bulkData.villageMarriages}
          onChange={(val) => setBulkData({ ...bulkData, villageMarriages: val })}
          className="w-full px-2 py-1 text-xs border border-amber-300 rounded"
          min={0}
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-slate-600 block mb-1">एकूण क्षयरुग्ण संख्या</label>
                    <NumberInput emptyOnZero
                      value={bulkData.tbTotal}
                      onChange={(val) => setBulkData({ ...bulkData, tbTotal: val })}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">संशयित क्षयरुग्ण संख्या</label>
                    <NumberInput emptyOnZero
                      value={bulkData.tbSuspected}
                      onChange={(val) => setBulkData({ ...bulkData, tbSuspected: val })}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">उपचाराखालील क्षयरुग्ण</label>
                    <NumberInput emptyOnZero
                      value={bulkData.tbUnderTreatment}
                      onChange={(val) => setBulkData({ ...bulkData, tbUnderTreatment: val })}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">संशयित कुष्ठरुग्ण</label>
                    <NumberInput emptyOnZero
                      value={bulkData.leprosySuspected}
                      onChange={(val) => setBulkData({ ...bulkData, leprosySuspected: val })}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">उपचाराखालील कुष्ठरुग्ण</label>
                    <NumberInput emptyOnZero
                      value={bulkData.leprosyUnderTreatment}
                      onChange={(val) => setBulkData({ ...bulkData, leprosyUnderTreatment: val })}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">संशयित मोतीबिंदू</label>
                    <NumberInput emptyOnZero
                      value={bulkData.cataractSuspected}
                      onChange={(val) => setBulkData({ ...bulkData, cataractSuspected: val })}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">ऑपरेशन झालेले मोतीबिंदू</label>
                    <NumberInput emptyOnZero
                      value={bulkData.cataractOperated}
                      onChange={(val) => setBulkData({ ...bulkData, cataractOperated: val })}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingBulk(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-[#1a4a72] text-white rounded-lg hover:bg-[#123653] cursor-pointer shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" /> सेव्ह करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
