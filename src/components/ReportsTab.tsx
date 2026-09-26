import React, { useState } from 'react';
import {
  SubCentreConfig,
  ContainerSurveyData,
  PatientRecord,
  TbPatientRecord,
  LeprosyPatientRecord,
  CataractPatientRecord,
  DeathRecord,
} from '../types';
import { calculateIndices, exportToExcel, generateWhatsAppSummary, nativePrintReport } from '../utils/exportUtils';
import { printMonthlyReport } from '../utils/monthlyReportPrint';
import { BUILD_ID } from '../generated/version';
import { BeatingHeartEcg } from './BeatingHeartEcg';
import { Capacitor } from '@capacitor/core';
import { WhatsAppSummaryModal, copyToClipboard } from './WhatsAppSummaryModal';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Share2,
  Check,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Activity,
  HeartPulse,
  Eye,
  CreditCard,
  Hospital,
  Edit3,
} from 'lucide-react';

interface Props {
  config: SubCentreConfig;
  survey: ContainerSurveyData;
  patients: PatientRecord[];
  tbPatients?: TbPatientRecord[];
  leprosyPatients?: LeprosyPatientRecord[];
  cataractPatients?: CataractPatientRecord[];
  deaths?: DeathRecord[];
  // महिनानिहाय आकडेवारीसाठी
  monthKey?: string;
  monthlySurveys?: Record<string, ContainerSurveyData>;
  patientsByMonth?: Record<string, PatientRecord[]>;
  tbPatientsByMonth?: Record<string, TbPatientRecord[]>;
  leprosyPatientsByMonth?: Record<string, LeprosyPatientRecord[]>;
  cataractPatientsByMonth?: Record<string, CataractPatientRecord[]>;
  deathsByMonth?: Record<string, DeathRecord[]>;
  onNavigateTab?: (tab: 'survey' | 'entry') => void;
}

export const ReportsTab: React.FC<Props> = ({
  config,
  survey,
  patients,
  tbPatients = [],
  leprosyPatients = [],
  cataractPatients = [],
  deaths = [],
  monthKey = '',
  monthlySurveys = {},
  patientsByMonth = {},
  tbPatientsByMonth = {},
  leprosyPatientsByMonth = {},
  cataractPatientsByMonth = {},
  deathsByMonth = {},
  onNavigateTab,
}) => {
  const [copied, setCopied] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const indices = calculateIndices(survey);

  // ---- मासिक व प्रगतिपर (cumulative) सारांश ----
  // "YYYY-MM" कीजची स्ट्रिंग तुलना कालक्रमानुसार चालते.
  const monthsUpTo = Object.keys(monthlySurveys).filter((k) => !monthKey || k <= monthKey);
  const sumField = (f: keyof ContainerSurveyData): number =>
    monthsUpTo.reduce((n, k) => n + (Number(monthlySurveys[k]?.[f]) || 0), 0);
  const countUpTo = <T,>(m: Record<string, T[]>): number =>
    Object.keys(m).filter((k) => !monthKey || k <= monthKey).reduce((n, k) => n + (m[k]?.length ?? 0), 0);

  const summaryRows: Array<{ label: string; monthly: number; progressive: number }> = [
    { label: 'तपासलेली घरे', monthly: survey.inspHouses, progressive: sumField('inspHouses') },
    { label: 'तपासलेली भांडी', monthly: survey.inspCont, progressive: sumField('inspCont') },
    { label: 'TCL वापर (किलो)', monthly: survey.tclUsedKg, progressive: sumField('tclUsedKg') },
    { label: 'घेतलेले रक्तनमुने', monthly: survey.bloodSamplesTaken, progressive: sumField('bloodSamplesTaken') },
    { label: 'जलजन्य रुग्ण नोंदी', monthly: patients.length, progressive: countUpTo(patientsByMonth) },
    { label: 'क्षयरुग्ण लाईनलिस्ट', monthly: tbPatients.length, progressive: countUpTo(tbPatientsByMonth) },
    { label: 'कुष्ठरुग्ण लाईनलिस्ट', monthly: leprosyPatients.length, progressive: countUpTo(leprosyPatientsByMonth) },
    { label: 'मोतीबिंदू लाईनलिस्ट', monthly: cataractPatients.length, progressive: countUpTo(cataractPatientsByMonth) },
    { label: 'मृत्यू नोंदी', monthly: deaths.length, progressive: countUpTo(deathsByMonth) },
  ];

  const totalPatients = patients.length;
  const choleraCount = patients.filter((p) => p.suspectedDisease === 'कॉलरा').length;
  const gastroCount = patients.filter((p) => p.suspectedDisease === 'गॅस्ट्रो').length;
  const diarrheaCount = patients.filter((p) => p.suspectedDisease === 'अतिसार').length;
  const dysenteryCount = patients.filter((p) => p.suspectedDisease === 'हगवण').length;
  const encephalitisCount = patients.filter((p) => p.suspectedDisease === 'मेंदुज्वर').length;
  const jointPainCount = patients.filter((p) => p.suspectedDisease === 'सांधेदुखी').length;
  const tclDoneCount = patients.filter((p) => p.tclStatus === 'होय').length;

  const currentSummary = generateWhatsAppSummary(
    config,
    survey,
    patients,
    tbPatients,
  leprosyPatients,
  cataractPatients,
  deaths
  );

  const handleCopyWhatsApp = async () => {
    // 1. Attempt clipboard copy with fallback
    const ok = await copyToClipboard(currentSummary);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
    // 2. Always also open the preview modal so user can view, copy manually or click 'Open WhatsApp'
    setShowWhatsAppModal(true);
  };

  const handleDownloadPDF = async () => {
    try {
      setGeneratingPdf(true);
      // Browser print engine -> "Save as PDF": perfect Marathi, neat multi-page layout.
      await printMonthlyReport({
        config,
        survey,
        indices,
        patients,
        tbPatients,
        leprosyPatients,
        cataractPatients,
        deaths,
      });
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      await exportToExcel(config, survey, patients, tbPatients, leprosyPatients, cataractPatients, deaths);
    } catch (err) {
      console.error('Excel Generation Error:', err);
    }
  };

  const handlePrint = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await nativePrintReport(`Arogya_Sevak_Ahwal_${config.reportingMonth || 'Report'}`);
      } else {
        // Same neat multi-page Marathi report as the PDF export.
        await printMonthlyReport({
          config,
          survey,
          indices,
          patients,
          tbPatients,
          leprosyPatients,
          cataractPatients,
          deaths,
        });
      }
    } catch (err) {
      console.error('Print Error:', err);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* धडधडणारे हृदय + ECG — decorative */}
      <BeatingHeartEcg className="animate-fade-up" />
      {/* Export Action Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1a4a72]">
            ३. उपकेंद्र मासिक प्रगती अहवाल व निर्यात (Official Reports & Export)
          </h2>
          <p className="text-xs text-slate-500">
            कंटेनर इंडेक्स, पाणी/मीठ चाचणी, TCL, क्षयरुग्ण, कुष्ठरुग्ण व मोतीबिंदू लाईनलिस्ट अहवाल निर्यात करा
            <span className="ml-2 text-slate-400">अहवाल आवृत्ती: {BUILD_ID}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="export-excel-btn"
            type="button"
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors min-w-[130px] justify-center cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel अहवाल (.xlsx)
          </button>

          <button
            id="export-pdf-btn"
            type="button"
            disabled={generatingPdf}
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 disabled:bg-rose-400 text-white text-xs font-bold rounded-lg shadow-sm transition-colors min-w-[130px] justify-center cursor-pointer"
          >
            {generatingPdf ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                PDF तयार होत आहे...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                PDF अहवाल (.pdf)
              </>
            )}
          </button>

          <button
            id="print-report-btn"
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1a4a72] hover:bg-[#123653] text-white text-xs font-bold rounded-lg shadow-sm transition-colors min-w-[110px] justify-center cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            प्रिंट अहवाल
          </button>

          <button
            id="copy-whatsapp-btn"
            type="button"
            onClick={handleCopyWhatsApp}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#f39c12] hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-lg shadow-sm transition-colors min-w-[120px] justify-center cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'प्रत झाली!' : 'WhatsApp सारांश'}
          </button>
        </div>
      </div>

      {/* Printable Sheet Frame */}
      <div
        id="printable-report"
        className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/90 print:p-0 print:border-none print:shadow-none"
      >
        {/* Government Letterhead Header */}
        <div className="border-b-2 border-[#1a4a72] pb-4 mb-6 text-center relative">
          <div className="text-xs uppercase tracking-widest text-slate-600 font-bold mb-1">
            {config.stateDepartment}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a4a72] tracking-tight">
            मासिक उपकेंद्र एकात्मिक आरोग्य प्रगती अहवाल
          </h1>
          <div className="text-sm font-semibold text-[#f39c12] mt-0.5">
            माहे: {config.reportingMonth}
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">उपकेंद्र:</span>
              <span className="font-bold text-slate-900">{config.subCentreName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">प्रा. आ. केंद्र:</span>
              <span className="font-bold text-slate-900">{config.phcName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">तालुका / जिल्हा:</span>
              <span className="font-bold text-slate-900">
                {config.taluka}, {config.district}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">आरोग्य सेवक:</span>
              <span className="font-bold text-slate-900">
                {config.workerName} ({config.workerDesignation})
              </span>
            </div>
          </div>
        </div>

        {/* मासिक व प्रगतिपर सारांश */}
        <div className="mb-6 rounded-2xl border border-[#1a4a72]/20 bg-gradient-to-br from-[#1a4a72]/5 to-transparent p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h3 className="text-sm font-bold text-[#1a4a72] uppercase tracking-wide">
              मासिक व प्रगतिपर सारांश
            </h3>
            <span className="text-[11px] text-slate-500">
              माहे: {config.reportingMonth} | प्रगतिपर: सुरुवातीपासून {config.reportingMonth} पर्यंत
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-200 bg-white rounded-xl overflow-hidden">
              <thead className="bg-[#1a4a72] text-white">
                <tr>
                  <th className="p-2.5 text-left font-semibold">घटक</th>
                  <th className="p-2.5 text-center font-semibold">मासिक<br /><span className="font-normal opacity-80">(या महिन्यात)</span></th>
                  <th className="p-2.5 text-center font-semibold">प्रगतिपर<br /><span className="font-normal opacity-80">(सुरुवातीपासून एकूण)</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {summaryRows.map((row) => (
                  <tr key={row.label} className="hover:bg-slate-50">
                    <td className="p-2.5 font-medium text-slate-800">{row.label}</td>
                    <td className="p-2.5 text-center font-black text-[#1a4a72] text-sm">{row.monthly}</td>
                    <td className="p-2.5 text-center font-black text-emerald-700 text-sm">{row.progressive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 1: Container Survey Indices */}
        <div>
          <div className="border-b border-slate-200 pb-2 mb-3 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-[#1a4a72] uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#f39c12]" />
              १. डेंग्यू / चिकनगुनिया डास आळी सर्वेक्षण (NVBDCP Indices)
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${indices.riskColor}`}>
                जोखीम: {indices.riskLevel}
              </span>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('survey')}
                  className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold text-[#1a4a72] bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                >
                  <Edit3 className="w-3 h-3 text-[#f39c12]" />
                  एडिट करा
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs text-slate-500">तपासलेली घरे / भांडी</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                {survey.inspHouses} <span className="text-xs font-normal text-slate-500">घरे</span>
              </div>
              <div className="text-[10px] text-slate-500">दूषित भांडी: {survey.posCont}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs text-slate-500">हाउस इंडेक्स (HI)</div>
              <div className="text-xl font-black text-slate-900 mt-1">{indices.hi}%</div>
              <div className="text-[10px] text-slate-400">मानक: &lt;१% सुरक्षित</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs text-slate-500">कंटेनर इंडेक्स (CI)</div>
              <div className="text-xl font-black text-slate-900 mt-1">{indices.ci}%</div>
              <div className="text-[10px] text-slate-400">मानक: &lt;२% सुरक्षित</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs text-slate-500">ब्रेटू इंडेक्स (BI)</div>
              <div className="text-xl font-black text-slate-900 mt-1">{indices.bi}</div>
              <div className="text-[10px] text-slate-400">मानक: &lt;५ सुरक्षित</div>
            </div>
          </div>
        </div>

        {/* Section 2: Water Quality, Salt and TCL Testing */}
        <div className="mt-6">
          <div className="border-b border-slate-200 pb-2 mb-3 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-[#1a4a72] uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#f39c12]" />
              २. पाणी गुणवत्ता, मीठ नमुने व TCL क्लोरीनेशन तपासणी
            </h3>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('survey')}
                className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold text-[#1a4a72] bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
              >
                <Edit3 className="w-3 h-3 text-[#f39c12]" />
                एडिट करा
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold">
                <tr>
                  <th className="p-2.5 border-b">तपासणी घटक (Parameter)</th>
                  <th className="p-2.5 border-b text-center">प्रयोगशाळेस पाठवले की नाही?</th>
                  <th className="p-2.5 border-b text-center">पाठवलेले नमुने संख्या</th>
                  <th className="p-2.5 border-b">सद्यस्थिती / शेरा</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-medium text-slate-900">पाणी जैविक तपासणी (Biological Water)</td>
                  <td className="p-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {survey.waterBioSentStatus}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-800">{survey.waterBioSent} नमुने</td>
                  <td className="p-2.5 text-slate-600">प्रयोगशाळा अहवाल सुरक्षित आला</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-900">पाणी रासायनिक तपासणी (Chemical Water)</td>
                  <td className="p-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {survey.waterChemSentStatus}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-800">{survey.waterChemSent} नमुने</td>
                  <td className="p-2.5 text-slate-600">पिण्यायोग्य पाणी प्रमाणपत्र प्राप्त</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-900">मीठ नमुना तपासणी (Salt Iodine Testing)</td>
                  <td className="p-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {survey.saltSampleSentStatus}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-800">{survey.saltSampleSent} नमुने</td>
                  <td className="p-2.5 text-slate-600">आयोडीनचे प्रमाण मानक निकषांप्रमाणे</td>
                </tr>
                <tr className="bg-emerald-50/40">
                  <td className="p-2.5 font-bold text-emerald-950">TCL (टी.सी.एल. पावडर वापर)</td>
                  <td className="p-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white">
                      नियमित वापर
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-black text-emerald-800">{survey.tclUsedKg} किलो वापर</td>
                  <td className="p-2.5 text-emerald-900 font-medium">
                    ओटी चाचण्या: {survey.chlorineTests} | विहिरी व पाण्याच्या टाक्यांचे क्लोरीनेशन पूर्ण
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: National Health Programs Statistics (TB, Leprosy, Cataract) */}
        <div className="mt-6">
          <div className="border-b border-slate-200 pb-2 mb-3 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-[#1a4a72] uppercase tracking-wide flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#f39c12]" />
              ३. राष्ट्रीय आरोग्य कार्यक्रम आकडेवारी (TB, कुष्ठरोग व मोतीबिंदू)
            </h3>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('survey')}
                className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold text-[#1a4a72] bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
              >
                <Edit3 className="w-3 h-3 text-[#f39c12]" />
                आकडेवारी एडिट करा
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* TB Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl animate-fade-up" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                <span className="font-bold text-xs text-rose-800">१. क्षयरोग (TB - NTEP)</span>
                <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                  {tbPatients.length} लाईनलिस्ट
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">एकूण क्षयरुग्ण संख्या:</span>
                  <span className="font-bold text-slate-900">{survey.tbTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">संशयित क्षयरुग्ण संख्या:</span>
                  <span className="font-bold text-amber-700">{survey.tbSuspected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">उपचाराखालील क्षयरुग्ण:</span>
                  <span className="font-bold text-emerald-700">{survey.tbUnderTreatment}</span>
                </div>
              </div>
            </div>

            {/* Leprosy Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl animate-fade-up" style={{ animationDelay: '80ms' }}>
              <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                <span className="font-bold text-xs text-purple-800">२. कुष्ठरोग (Leprosy - NLEP)</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                  {leprosyPatients.length} लाईनलिस्ट
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">संशयित कुष्ठरुग्ण संख्या:</span>
                  <span className="font-bold text-purple-700">{survey.leprosySuspected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">उपचाराखालील कुष्ठरुग्ण:</span>
                  <span className="font-bold text-emerald-700">{survey.leprosyUnderTreatment}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>MDT औषधोपचार:</span>
                  <span className="text-emerald-700 font-semibold">नियमित सुरू</span>
                </div>
              </div>
            </div>

            {/* Cataract Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl animate-fade-up" style={{ animationDelay: '160ms' }}>

              <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                <span className="font-bold text-xs text-amber-800">३. मोतीबिंदू (Cataract - NPCB)</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                  {cataractPatients.length} लाईनलिस्ट
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">संशयित मोतीबिंदू संख्या:</span>
                  <span className="font-bold text-amber-700">{survey.cataractSuspected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ऑपरेशन झालेले मोतीबिंदू:</span>
                  <span className="font-bold text-emerald-700">{survey.cataractOperated}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>शस्त्रक्रिया यशस्विता:</span>
                  <span className="text-emerald-700 font-semibold">१००% यशस्वी</span>
                </div>
              </div>
            </div>

            {/* Death Register Card */}
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl animate-fade-up" style={{ animationDelay: '240ms' }}>
              <div className="flex items-center justify-between border-b border-red-200 pb-1.5 mb-2">
                <span className="font-bold text-xs text-red-800">४. मृत्यू नोंदणी</span>
                <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">{deaths.length} नोंदी</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-600">एकूण मृत्यू:</span><span className="font-bold text-red-700">{deaths.length}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">गावातील मृत्यू:</span><span className="font-bold text-slate-900">{deaths.filter((death) => death.place === 'गावात').length}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">गावाबाहेरील मृत्यू:</span><span className="font-bold text-slate-900">{deaths.filter((death) => death.place === 'गावाबाहेर').length}</span></div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 animate-fade-up" style={{ animationDelay: '320ms' }}>
              <div className="text-xs font-bold text-amber-800">गावातील सामाजिक आकडेवारी</div>
              <div className="mt-1 text-xs"><span className="text-slate-600">गावात झालेली एकूण लग्ने:</span> <span className="font-bold text-amber-700">{survey.villageMarriages}</span></div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 animate-fade-up" style={{ animationDelay: '400ms' }}>
              <div className="text-xs font-bold text-rose-800">रक्त तपासणी आकडेवारी</div>
              <div className="mt-1 text-xs"><span className="text-slate-600">एकूण घेतलेले रक्तनमुने:</span> <span className="font-bold text-rose-700">{survey.bloodSamplesTaken}</span></div>
            </div>
          </div>

          {deaths.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-red-200">
              <div className="bg-red-50 px-3 py-2 text-xs font-bold text-red-800">मृत्यू नोंदणी लाईनलिस्ट</div>
              <table className="w-full text-xs text-left">
                <thead className="bg-red-100 text-red-900"><tr><th className="p-2">क्र.</th><th className="p-2">मृत्यू दिनांक</th><th className="p-2">नाव / वय</th><th className="p-2">गाव</th><th className="p-2">मृत्यू कोठे झाला</th><th className="p-2">मृत्यूचे कारण</th></tr></thead>
                <tbody>{deaths.map((death, index) => <tr key={death.id} className="border-t border-red-100"><td className="p-2">{index + 1}</td><td className="p-2 whitespace-nowrap">{death.date}</td><td className="p-2">{death.name || (death as DeathRecord & { deceasedName?: string; deceased_name?: string; personName?: string; fullName?: string }).deceasedName || (death as DeathRecord & { deceased_name?: string }).deceased_name || (death as DeathRecord & { personName?: string }).personName || (death as DeathRecord & { fullName?: string }).fullName || 'नाव उपलब्ध नाही'} / {death.age}</td><td className="p-2">{death.village || '—'}</td><td className="p-2">{death.place}{death.deathPlace ? ` - ${death.deathPlace}` : ''}</td><td className="p-2">{death.cause}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 4: Waterborne Disease Register */}
        <div className="mt-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#1a4a72] uppercase tracking-wide">
                ४. जलजन्य व सांधेदुखी रुग्ण सर्वेक्षण नोंदवही (कॉलरा, गॅस्ट्रो, अतिसार, हगवण, मेंदुज्वर, सांधेदुखी)
              </h3>
              <span className="text-xs text-slate-500">
                एकूण रुग्ण: {totalPatients} (कॉलरा: {choleraCount}, गॅस्ट्रो: {gastroCount}, अतिसार: {diarrheaCount}, हगवण: {dysenteryCount}, मेंदुज्वर: {encephalitisCount}, सांधेदुखी: {jointPainCount})
              </span>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('entry')}
                className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold text-[#1a4a72] bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
              >
                <Edit3 className="w-3 h-3 text-[#f39c12]" />
                रुग्ण नोंदवही एडिट करा
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold">
                <tr>
                  <th className="p-2 border-b">नोंदणी क्र.</th>
                  <th className="p-2 border-b">तारीख</th>
                  <th className="p-2 border-b">रुग्ण नाव व वय</th>
                  <th className="p-2 border-b">गाव / वस्ती</th>
                  <th className="p-2 border-b">आजार प्रकार</th>
                  <th className="p-2 border-b text-center">TCL</th>
                  <th className="p-2 border-b">उपचार</th>
                  <th className="p-2 border-b">सद्यस्थिती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-400 italic">
                      सध्या या महिन्यात नोंदवलेले जलजन्य रुग्ण नाहीत
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono text-[11px] font-bold text-[#1a4a72]">{p.regNo}</td>
                      <td className="p-2 text-slate-600">{p.date}</td>
                      <td className="p-2 font-medium text-slate-900">
                        {p.name} ({p.age}/{p.gender[0]})
                      </td>
                      <td className="p-2 text-slate-600">{p.village}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            p.suspectedDisease === 'कॉलरा'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : p.suspectedDisease === 'गॅस्ट्रो'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : p.suspectedDisease === 'अतिसार'
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : p.suspectedDisease === 'हगवण'
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : p.suspectedDisease === 'मेंदुज्वर'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : p.suspectedDisease === 'सांधेदुखी'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : p.suspectedDisease === 'मलेरिया'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : p.suspectedDisease === 'डेंग्यू'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {p.suspectedDisease}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            p.tclStatus === 'होय'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.tclStatus || 'नाही'}
                        </span>
                      </td>
                      <td className="p-2 text-slate-700 max-w-[150px] truncate">{p.treatment}</td>
                      <td className="p-2 text-slate-700">{p.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Linelist Summaries for TB, Leprosy, Cataract */}
        {(tbPatients.length > 0 || leprosyPatients.length > 0 || cataractPatients.length > 0) && (
          <div className="mt-6">
            <div className="border-b border-slate-200 pb-2 mb-3 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-[#1a4a72] uppercase tracking-wide">
                ५. विशेष लाईनलिस्ट तपशील (TB, कुष्ठरोग व मोतीबिंदू वैयक्तिक नोंदी)
              </h3>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('entry')}
                  className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold text-[#1a4a72] bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                >
                  <Edit3 className="w-3 h-3 text-[#f39c12]" />
                  लाईनलिस्ट एडिट करा
                </button>
              )}
            </div>

<div className="space-y-5">
              {/* TB full linelist table */}
              {tbPatients.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white animate-fade-up print:overflow-visible">
                  <div className="px-4 py-2.5 bg-gradient-to-r from-rose-700 to-rose-800 text-white flex items-center justify-between">
                    <span className="font-bold text-sm">क्षयरुग्ण (TB) वैयक्तिक नोंदी</span>
                    <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">{tbPatients.length} रुग्ण</span>
                  </div>
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-xs min-w-[980px]">
                      <thead>
                        <tr className="bg-rose-50/70 text-rose-900 text-left">
                          <th className="p-2.5 text-center w-10">#</th>
                          <th className="p-2.5">नोंदणी क्र. / तारीख</th>
                          <th className="p-2.5">रुग्णाचे नाव व वय/लिंग</th>
                          <th className="p-2.5">गाव व संपर्क</th>
                          <th className="p-2.5">टीबी प्रकार</th>
                          <th className="p-2.5">सद्यस्थिती</th>
                          <th className="p-2.5">डॉट्स प्रदाता</th>
                          <th className="p-2.5">निक्षय पोषण</th>
                          <th className="p-2.5">शेरा</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tbPatients.map((tb, idx) => (
                          <tr key={tb.id} className="hover:bg-slate-50/80">
                            <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-2.5"><span className="font-bold text-slate-900 font-mono block">{tb.regNo}</span><span className="text-[10px] text-slate-400 block">{tb.date}</span></td>
                            <td className="p-2.5"><div className="font-bold text-slate-900">{tb.name}</div><div className="text-[11px] text-slate-500">{tb.age} वर्षे | {tb.gender}</div></td>
                            <td className="p-2.5"><div className="text-slate-700">{tb.village}</div><div className="text-[11px] text-slate-500">{tb.contact}</div></td>
                            <td className="p-2.5"><span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">{tb.tbType}</span><div className="text-[10px] text-slate-400 mt-0.5">HIV: {tb.hivStatus}</div></td>
                            <td className="p-2.5"><span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${tb.category === 'उपचार पूर्ण (Cured)' ? 'bg-blue-50 text-blue-700 border border-blue-200' : tb.category === 'उपचाराखालील (Under Treatment)' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{tb.category}</span>{tb.treatmentStartDate && tb.treatmentStartDate !== '-' && (<div className="text-[10px] text-slate-500 mt-0.5">सुरुवात: {tb.treatmentStartDate}</div>)}</td>
                            <td className="p-2.5 text-slate-700"><div className="text-xs font-medium">{tb.dotsProvider}</div></td>
                            <td className="p-2.5"><span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${tb.bankDetailsAdded === 'होय' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}><CreditCard className="w-3 h-3" />{tb.bankDetailsAdded}</span></td>
                            <td className="p-2.5 text-slate-600 text-[11px] max-w-[160px]">{tb.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Leprosy full linelist table */}
              {leprosyPatients.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white animate-fade-up print:overflow-visible" style={{ animationDelay: '80ms' }}>
                  <div className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-purple-900 text-white flex items-center justify-between">
                    <span className="font-bold text-sm">कुष्ठरुग्ण वैयक्तिक नोंदी</span>
                    <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">{leprosyPatients.length} रुग्ण</span>
                  </div>
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-xs min-w-[980px]">
                      <thead>
                        <tr className="bg-purple-50/70 text-purple-900 text-left">
                          <th className="p-2.5 text-center w-10">#</th>
                          <th className="p-2.5">नोंदणी क्र. / तारीख</th>
                          <th className="p-2.5">रुग्णाचे नाव व वय/लिंग</th>
                          <th className="p-2.5">गाव व संपर्क</th>
                          <th className="p-2.5">कुष्ठरोग प्रकार</th>
                          <th className="p-2.5">चट्टे संख्या</th>
                          <th className="p-2.5">व्यंग प्रत (Grade)</th>
                          <th className="p-2.5">सद्यस्थिती व MDT</th>
                          <th className="p-2.5">शेरा</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leprosyPatients.map((lep, idx) => (
                          <tr key={lep.id} className="hover:bg-slate-50/80">
                            <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-2.5"><span className="font-bold text-slate-900 font-mono block">{lep.regNo}</span><span className="text-[10px] text-slate-400 block">{lep.date}</span></td>
                            <td className="p-2.5"><div className="font-bold text-slate-900">{lep.name}</div><div className="text-[11px] text-slate-500">{lep.age} वर्षे | {lep.gender}</div></td>
                            <td className="p-2.5"><div className="text-slate-700">{lep.village}</div><div className="text-[11px] text-slate-500">{lep.contact}</div></td>
                            <td className="p-2.5"><span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap ${lep.leprosyType.startsWith('MB') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>{lep.leprosyType}</span></td>
                            <td className="p-2.5"><span className="font-semibold text-slate-900">{lep.lesionsCount} चट्टे</span>{lep.lesionLocation ? (<div className="text-[11px] text-slate-500">{lep.lesionLocation}</div>) : null}</td>
                            <td className="p-2.5"><span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">{lep.deformityGrade}</span></td>
                            <td className="p-2.5"><span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${lep.category === 'उपचार पूर्ण (RFT)' ? 'bg-blue-50 text-blue-700 border border-blue-200' : lep.category === 'उपचाराखालील (Under Treatment)' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{lep.category}</span>{lep.mdtStartDate && lep.mdtStartDate !== '-' && (<div className="text-[10px] text-slate-500 mt-0.5">MDT: {lep.mdtStartDate}</div>)}</td>
                            <td className="p-2.5 text-slate-600 text-[11px] max-w-[160px]">{lep.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Cataract full linelist table */}
              {cataractPatients.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white animate-fade-up print:overflow-visible" style={{ animationDelay: '160ms' }}>
                  <div className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
                    <span className="font-bold text-sm">मोतीबिंदू वैयक्तिक नोंदी</span>
                    <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">{cataractPatients.length} रुग्ण</span>
                  </div>
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-xs min-w-[980px]">
                      <thead>
                        <tr className="bg-amber-50/70 text-amber-900 text-left">
                          <th className="p-2.5 text-center w-10">#</th>
                          <th className="p-2.5">नोंदणी क्र. / तारीख</th>
                          <th className="p-2.5">रुग्णाचे नाव व वय/लिंग</th>
                          <th className="p-2.5">गाव व संपर्क</th>
                          <th className="p-2.5">बाधित डोळा</th>
                          <th className="p-2.5">दृष्टीदोष</th>
                          <th className="p-2.5">तपासणी ठिकाण</th>
                          <th className="p-2.5">शस्त्रक्रिया स्थिती</th>
                          <th className="p-2.5">रुग्णालय व शेरा</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cataractPatients.map((cat, idx) => (
                          <tr key={cat.id} className="hover:bg-slate-50/80">
                            <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-2.5"><span className="font-bold text-slate-900 font-mono block">{cat.regNo}</span><span className="text-[10px] text-slate-400 block">{cat.date}</span></td>
                            <td className="p-2.5"><div className="font-bold text-slate-900">{cat.name}</div><div className="text-[11px] text-slate-500">{cat.age} वर्षे | {cat.gender}</div></td>
                            <td className="p-2.5"><div className="text-slate-700">{cat.village}</div><div className="text-[11px] text-slate-500">{cat.contact}</div></td>
                            <td className="p-2.5"><span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap ${cat.affectedEye === 'दोन्ही डोळे' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>{cat.affectedEye}</span></td>
                            <td className="p-2.5"><span className="font-medium text-slate-800">{cat.visualAcuity}</span></td>
                            <td className="p-2.5 text-slate-600"><div className="text-[11px]">{cat.screeningSite}</div></td>
                            <td className="p-2.5"><span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${cat.surgeryStatus === 'शस्त्रक्रिया पूर्ण झाली' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : cat.surgeryStatus === 'संशयित / प्रलंबित' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{cat.surgeryStatus}</span>{cat.surgeryDate && (<div className="text-[10px] text-slate-500 mt-0.5">दिनांक: {cat.surgeryDate}</div>)}</td>
                            <td className="p-2.5 text-slate-600 max-w-[170px]">{cat.hospitalName && (<div className="flex items-center gap-1 text-[11px] font-medium text-slate-700"><Hospital className="w-3 h-3 text-slate-400 shrink-0" /><span>{cat.hospitalName}</span></div>)}{cat.remarks && <div className="text-[10px] text-slate-400">{cat.remarks}</div>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-10 pt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left text-xs text-slate-700">
          <div>
            <div className="font-bold text-slate-900">{config.workerName}</div>
            <div className="text-slate-500">{config.workerDesignation}</div>
            <div className="text-slate-500">{config.subCentreName}</div>
          </div>

          <div className="text-center">
            <div className="text-slate-400 italic mb-1">सही व शिक्का</div>
            <div className="font-bold text-slate-900">आरोग्य पर्यवेक्षक</div>
            <div className="text-slate-500">{config.phcName}</div>
          </div>

          <div className="text-right sm:text-right">
            <div className="text-slate-400 italic mb-1">प्रतिस्वाक्षरी</div>
            <div className="font-bold text-slate-900">वैद्यकीय अधिकारी</div>
            <div className="text-slate-500">{config.phcName}</div>
          </div>
        </div>
      </div>

      {/* WhatsApp Summary Preview & Share Modal */}
      <WhatsAppSummaryModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        summaryText={currentSummary}
        reportingMonth={config.reportingMonth}
        subCentreName={config.subCentreName}
      />
    </div>
  );
};
