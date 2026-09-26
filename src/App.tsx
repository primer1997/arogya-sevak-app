import React, { useEffect, useState } from 'react';
import {
  SubCentreConfig,
  ContainerSurveyData,
  PatientRecord,
  TbPatientRecord,
  LeprosyPatientRecord,
  CataractPatientRecord,
  DeathRecord,
} from './types';
import {
  loadConfig,
  saveConfig,
  loadSurveyData,
  saveSurveyData,
  getSurveyForMonth,
  saveSurveyForMonth,
  loadPatientsMap,
  savePatientsMap,
  loadTbPatientsMap,
  saveTbPatientsMap,
  loadLeprosyPatientsMap,
  saveLeprosyPatientsMap,
  loadCataractPatientsMap,
  saveCataractPatientsMap,
  loadDeathsMap,
  saveDeathsMap,
  resetAllData,
  loadCloudAppData,
  saveCloudAppData,
  loadMonthlySurveys,
  saveMonthlySurveys,
  getMonthList,
  normalizeMonthMap,
  normalizePatientRecord,
  normalizeTbPatientRecord,
  normalizeLeprosyPatientRecord,
  normalizeCataractPatientRecord,
  normalizeDeathRecord,
  CloudAppData,
} from './utils/storage';
import {
  parseReportingMonth,
  getMonthKey,
} from './utils/dateUtils';
import {
  initialConfig,
  blankSurveyData,
} from './data/initialData';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { PhcDashboard } from './components/PhcDashboard';
import { supabase, fetchMyRole, AppRole } from './lib/supabase';
import { SurveyProgramsTab } from './components/SurveyProgramsTab';
import { PatientEntryTab } from './components/PatientEntryTab';
import { ReportsTab } from './components/ReportsTab';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ClipboardList, Users, FileBarChart, HeartPulse, ShieldCheck } from 'lucide-react';

function AuthGate() {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.session?.user?.id ?? null);
      setIsLoadingAuth(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUserId(session?.user?.id ?? null);
      setIsLoadingAuth(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // भूमिका वाचा — PHC असेल तर PHC डॅशबोर्ड, नाहीतर नेहमीचे workspace
  useEffect(() => {
    if (!userId) {
      setRole(null);
      return;
    }
    let mounted = true;
    fetchMyRole().then((r) => {
      if (mounted) setRole(r);
    });
    return () => {
      mounted = false;
    };
  }, [userId]);

  if (isLoadingAuth || (userId && !role)) {
    return <div className="min-h-screen bg-[#0f2740] flex items-center justify-center text-white">Loading secure workspace...</div>;
  }

  if (!userId) {
    return <AuthScreen onAuthenticated={() => {}} />;
  }

  return role === 'phc' ? <PhcDashboard /> : <Workspace />;
}

export default function App() {
  return <AuthGate />;
}

function Workspace() {
  const [config, setConfig] = useState<SubCentreConfig>(() => loadConfig());
  const [survey, setSurvey] = useState<ContainerSurveyData>(() => {
    const loadedConfig = loadConfig();
    const { monthNum, year } = parseReportingMonth(loadedConfig.reportingMonth);
    const currentMonthKey = getMonthKey(monthNum, year);
    return getSurveyForMonth(currentMonthKey);
  });
  const [monthlySurveys, setMonthlySurveys] = useState<Record<string, ContainerSurveyData>>(() => loadMonthlySurveys());
  // प्रत्येक महिन्याचा लाईनलिस्ट डेटा स्वतंत्र मॅपमध्ये सेव्ह होतो
  const [patientsByMonth, setPatientsByMonth] = useState<Record<string, PatientRecord[]>>(() => loadPatientsMap());
  const [tbPatientsByMonth, setTbPatientsByMonth] = useState<Record<string, TbPatientRecord[]>>(() => loadTbPatientsMap());
  const [leprosyPatientsByMonth, setLeprosyPatientsByMonth] = useState<Record<string, LeprosyPatientRecord[]>>(() => loadLeprosyPatientsMap());
  const [cataractPatientsByMonth, setCataractPatientsByMonth] = useState<Record<string, CataractPatientRecord[]>>(() => loadCataractPatientsMap());
  const [deathsByMonth, setDeathsByMonth] = useState<Record<string, DeathRecord[]>>(() => loadDeathsMap());
  const [cloudReady, setCloudReady] = useState(false);

  // चालू अहवाल महिन्याचा की व त्या महिन्यातील याद्या
  const { monthNum, year } = parseReportingMonth(config.reportingMonth);
  const monthKey = getMonthKey(monthNum, year);
  const patients = getMonthList(patientsByMonth, monthKey);
  const tbPatients = getMonthList(tbPatientsByMonth, monthKey);
  const leprosyPatients = getMonthList(leprosyPatientsByMonth, monthKey);
  const cataractPatients = getMonthList(cataractPatientsByMonth, monthKey);
  const deaths = getMonthList(deathsByMonth, monthKey);

  const cloudPayload = (): CloudAppData => ({
    config,
    survey,
    monthlySurveys,
    patientsByMonth,
    tbPatientsByMonth,
    leprosyPatientsByMonth,
    cataractPatientsByMonth,
    deathsByMonth,
  });

  useEffect(() => {
    let mounted = true;
    loadCloudAppData().then((remote) => {
      if (!mounted) return;
      if (remote) {
        setConfig(remote.config);
        const rMonthlySurveys = remote.monthlySurveys && typeof remote.monthlySurveys === 'object' ? remote.monthlySurveys : {};
        // Active survey नेहमी config च्या महिन्यानुसार निवडा — जुन्या डेटात survey
        // फक्त monthlySurveys मध्ये असू शकतो.
        let activeSurvey = remote.survey;
        try {
          const { monthNum, year } = parseReportingMonth(remote.config.reportingMonth);
          const activeKey = getMonthKey(monthNum, year);
          if (rMonthlySurveys[activeKey]) activeSurvey = rMonthlySurveys[activeKey];
        } catch { /* fallback: remote.survey */ }
        setSurvey(activeSurvey);
        const rPatients = remote.patientsByMonth && typeof remote.patientsByMonth === 'object' ? remote.patientsByMonth : {};
        const rTb = remote.tbPatientsByMonth && typeof remote.tbPatientsByMonth === 'object' ? remote.tbPatientsByMonth : {};
        const rLeprosy = remote.leprosyPatientsByMonth && typeof remote.leprosyPatientsByMonth === 'object' ? remote.leprosyPatientsByMonth : {};
        const rCataract = remote.cataractPatientsByMonth && typeof remote.cataractPatientsByMonth === 'object' ? remote.cataractPatientsByMonth : {};
        const rDeaths = remote.deathsByMonth && typeof remote.deathsByMonth === 'object' ? remote.deathsByMonth : {};
        setMonthlySurveys(rMonthlySurveys);
        // रेकॉर्ड नॉर्मलाइज करा — जुन्या/अपूर्ण रेकॉर्डमुळे टॅब क्रॅश होऊ नये.
        const nPatients = normalizeMonthMap(rPatients, normalizePatientRecord);
        const nTb = normalizeMonthMap(rTb, normalizeTbPatientRecord);
        const nLeprosy = normalizeMonthMap(rLeprosy, normalizeLeprosyPatientRecord);
        const nCataract = normalizeMonthMap(rCataract, normalizeCataractPatientRecord);
        const nDeaths = normalizeMonthMap(rDeaths, normalizeDeathRecord);
        setPatientsByMonth(nPatients);
        setTbPatientsByMonth(nTb);
        setLeprosyPatientsByMonth(nLeprosy);
        setCataractPatientsByMonth(nCataract);
        setDeathsByMonth(nDeaths);
        // Mirror cloud data into local storage so offline state stays fresh
        // after syncing on another device.
        saveConfig(remote.config);
        saveSurveyData(activeSurvey);
        saveMonthlySurveys(rMonthlySurveys);
        savePatientsMap(nPatients);
        saveTbPatientsMap(nTb);
        saveLeprosyPatientsMap(nLeprosy);
        saveCataractPatientsMap(nCataract);
        saveDeathsMap(nDeaths);
      } else {
        void saveCloudAppData(cloudPayload());
      }
      setCloudReady(true);
    }).catch((error) => console.error('[v0] Cloud data load failed:', error));
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cloudReady) void saveCloudAppData(cloudPayload()).catch((error) => console.error('[v0] Cloud data save failed:', error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudReady, config, survey, monthlySurveys, patientsByMonth, tbPatientsByMonth, leprosyPatientsByMonth, cataractPatientsByMonth, deathsByMonth]);

  const [activeTab, setActiveTab] = useState<'survey' | 'entry' | 'report'>('survey');

  // Config & Survey Sync
  const handleUpdateConfig = (newConfig: SubCentreConfig) => {
    const monthChanged = newConfig.reportingMonth !== config.reportingMonth;
    setConfig(newConfig);
    saveConfig(newConfig);

    if (monthChanged) {
      // आधी चालू महिन्याचा survey त्याच महिन्यात जतन करा — महिना बदलून
      // परत आल्यावर आकडेवारी हरवू नये म्हणून.
      const stashedSurveys = { ...monthlySurveys, [monthKey]: survey };
      setMonthlySurveys(stashedSurveys);
      saveMonthlySurveys(stashedSurveys);
      // नवीन महिना निवडल्यास त्या महिन्याचा स्वतंत्र डेटा लोड करा;
      // नवीन महिना असल्यास पूर्ण कोरा फॉर्म मिळतो (मागील महिन्याचा डेटा दिसत नाही).
      const { monthNum: m, year: y } = parseReportingMonth(newConfig.reportingMonth);
      const newMonthKey = getMonthKey(m, y);
      const newSurvey = getSurveyForMonth(newMonthKey);
      setSurvey(newSurvey);
      saveSurveyData(newSurvey);
    }
  };

  const handleUpdateSurvey = (newSurvey: ContainerSurveyData) => {
    setSurvey(newSurvey);
    const updated = { ...monthlySurveys, [monthKey]: newSurvey };
    setMonthlySurveys(updated);
    saveSurveyForMonth(monthKey, newSurvey);
  };

  // चालू महिन्याच्या यादीत बदल करून महिनानिहाय सेव्ह करा
  const saveMonthList = <T,>(
    map: Record<string, T[]>,
    setter: React.Dispatch<React.SetStateAction<Record<string, T[]>>>,
    saver: (m: Record<string, T[]>) => void,
    list: T[],
  ) => {
    const updated = { ...map, [monthKey]: list };
    setter(updated);
    saver(updated);
  };

  // Waterborne Patients Handlers
  const handleAddPatient = (patient: PatientRecord) => {
    saveMonthList(patientsByMonth, setPatientsByMonth, savePatientsMap, [patient, ...patients]);
  };

  const handleUpdatePatient = (patient: PatientRecord) => {
    saveMonthList(patientsByMonth, setPatientsByMonth, savePatientsMap, patients.map((p: PatientRecord) => (p.id === patient.id ? patient : p)));
  };

  const handleDeletePatient = (id: string) => {
    saveMonthList(patientsByMonth, setPatientsByMonth, savePatientsMap, patients.filter((p: PatientRecord) => p.id !== id));
  };

  // TB Linelist Handlers
  const handleAddTbPatient = (patient: TbPatientRecord) => {
    saveMonthList(tbPatientsByMonth, setTbPatientsByMonth, saveTbPatientsMap, [patient, ...tbPatients]);
  };

  const handleUpdateTbPatient = (patient: TbPatientRecord) => {
    saveMonthList(tbPatientsByMonth, setTbPatientsByMonth, saveTbPatientsMap, tbPatients.map((p: TbPatientRecord) => (p.id === patient.id ? patient : p)));
  };

  const handleDeleteTbPatient = (id: string) => {
    saveMonthList(tbPatientsByMonth, setTbPatientsByMonth, saveTbPatientsMap, tbPatients.filter((p: TbPatientRecord) => p.id !== id));
  };

  // Leprosy Linelist Handlers
  const handleAddLeprosyPatient = (patient: LeprosyPatientRecord) => {
    saveMonthList(leprosyPatientsByMonth, setLeprosyPatientsByMonth, saveLeprosyPatientsMap, [patient, ...leprosyPatients]);
  };

  const handleUpdateLeprosyPatient = (patient: LeprosyPatientRecord) => {
    saveMonthList(leprosyPatientsByMonth, setLeprosyPatientsByMonth, saveLeprosyPatientsMap, leprosyPatients.map((p: LeprosyPatientRecord) => (p.id === patient.id ? patient : p)));
  };

  const handleDeleteLeprosyPatient = (id: string) => {
    saveMonthList(leprosyPatientsByMonth, setLeprosyPatientsByMonth, saveLeprosyPatientsMap, leprosyPatients.filter((p: LeprosyPatientRecord) => p.id !== id));
  };

  // Cataract Linelist Handlers
  const handleAddCataractPatient = (patient: CataractPatientRecord) => {
    saveMonthList(cataractPatientsByMonth, setCataractPatientsByMonth, saveCataractPatientsMap, [patient, ...cataractPatients]);
  };

  const handleUpdateCataractPatient = (patient: CataractPatientRecord) => {
    saveMonthList(cataractPatientsByMonth, setCataractPatientsByMonth, saveCataractPatientsMap, cataractPatients.map((p: CataractPatientRecord) => (p.id === patient.id ? patient : p)));
  };

  const handleDeleteCataractPatient = (id: string) => {
    saveMonthList(cataractPatientsByMonth, setCataractPatientsByMonth, saveCataractPatientsMap, cataractPatients.filter((p: CataractPatientRecord) => p.id !== id));
  };

  const handleAddDeath = (record: DeathRecord) => {
    saveMonthList(deathsByMonth, setDeathsByMonth, saveDeathsMap, [record, ...deaths]);
  };
  const handleUpdateDeath = (record: DeathRecord) => {
    saveMonthList(deathsByMonth, setDeathsByMonth, saveDeathsMap, deaths.map((item: DeathRecord) => item.id === record.id ? record : item));
  };
  const handleDeleteDeath = (id: string) => {
    saveMonthList(deathsByMonth, setDeathsByMonth, saveDeathsMap, deaths.filter((item: DeathRecord) => item.id !== id));
  };

  const handleResetData = () => {
    resetAllData();
    setConfig(initialConfig);
    setMonthlySurveys({});
    setSurvey({ ...blankSurveyData });
    setPatientsByMonth({});
    setTbPatientsByMonth({});
    setLeprosyPatientsByMonth({});
    setCataractPatientsByMonth({});
    setDeathsByMonth({});
  };

  const totalAllPatients =
    patients.length + tbPatients.length + leprosyPatients.length + cataractPatients.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Mukta',sans-serif] text-slate-900 selection:bg-[#1a4a72] selection:text-white">
      {/* Official Government Header */}
      <Header
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onResetData={handleResetData}
      />

      {/* Main Container */}
      <main className="app-shell flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4">
        {/* Navigation Tabs (nav-pills nav-fill matching official government system design) */}
        <div className="relative bg-white rounded-xl shadow-xs border border-slate-200/80 p-1.5 mb-4 grid grid-cols-3 gap-1.5 print:hidden">
          {/* Sliding active pill */}
          <div
            aria-hidden
            className="absolute top-1.5 bottom-1.5 left-1.5 rounded-lg bg-gradient-to-r from-[#1a4a72] to-[#236089] shadow-md shadow-[#1a4a72]/25 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
            style={{
              width: 'calc((100% - 1.5rem) / 3)',
              transform: `translateX(calc(${['survey', 'entry', 'report'].indexOf(activeTab) * 100}% + ${['survey', 'entry', 'report'].indexOf(activeTab) * 0.375}rem))`,
            }}
          />
          <button
            id="tab-survey-btn"
            type="button"
            onClick={() => setActiveTab('survey')}
            className={`pressable relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'survey' ? 'text-white' : 'text-[#1a4a72] hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span>सर्व्हे व कार्यक्रम</span>
          </button>

          <button
            id="tab-entry-btn"
            type="button"
            onClick={() => setActiveTab('entry')}
            className={`pressable relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'entry' ? 'text-white' : 'text-[#1a4a72] hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>रुग्ण नोंदणी व लाईनलिस्ट</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'entry' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {totalAllPatients}
            </span>
          </button>

          <button
            id="tab-report-btn"
            type="button"
            onClick={() => setActiveTab('report')}
            className={`pressable relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'report' ? 'text-white' : 'text-[#1a4a72] hover:bg-slate-100'
            }`}
          >
            <FileBarChart className="w-4 h-4 shrink-0" />
            <span>अहवाल व निर्यात</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="tab-content">
          {activeTab === 'survey' && (
            <div id="tab-survey" key="tab-survey" className="animate-fade-up">
              <SurveyProgramsTab
                survey={survey}
                onUpdateSurvey={handleUpdateSurvey}
              />
            </div>
          )}

          {activeTab === 'entry' && (
            <div id="tab-entry" key="tab-entry" className="animate-fade-up">
              <PatientEntryTab
                patients={patients}
                onAddPatient={handleAddPatient}
                onUpdatePatient={handleUpdatePatient}
                onDeletePatient={handleDeletePatient}
                tbPatients={tbPatients}
                onAddTbPatient={handleAddTbPatient}
                onUpdateTbPatient={handleUpdateTbPatient}
                onDeleteTbPatient={handleDeleteTbPatient}
                leprosyPatients={leprosyPatients}
                onAddLeprosyPatient={handleAddLeprosyPatient}
                onUpdateLeprosyPatient={handleUpdateLeprosyPatient}
                onDeleteLeprosyPatient={handleDeleteLeprosyPatient}
                cataractPatients={cataractPatients}
                onAddCataractPatient={handleAddCataractPatient}
                onUpdateCataractPatient={handleUpdateCataractPatient}
                onDeleteCataractPatient={handleDeleteCataractPatient}
                deaths={deaths}
                onAddDeath={handleAddDeath}
                onUpdateDeath={handleUpdateDeath}
                onDeleteDeath={handleDeleteDeath}
              />
            </div>
          )}

          {activeTab === 'report' && (
            <div id="tab-report" key="tab-report" className="animate-fade-up">
              <ReportsTab
                config={config}
                survey={survey}
                patients={patients}
                tbPatients={tbPatients}
                leprosyPatients={leprosyPatients}
  cataractPatients={cataractPatients}
  deaths={deaths}
  monthKey={monthKey}
  monthlySurveys={monthlySurveys}
  patientsByMonth={patientsByMonth}
  tbPatientsByMonth={tbPatientsByMonth}
  leprosyPatientsByMonth={leprosyPatientsByMonth}
  cataractPatientsByMonth={cataractPatientsByMonth}
  deathsByMonth={deathsByMonth}
  onNavigateTab={(tab) => setActiveTab(tab)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-3 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1a4a72]" />
            <HeartPulse className="w-4 h-4 text-rose-500 animate-glow-pulse" />
            <span>सार्वजनिक आरोग्य विभाग, महाराष्ट्र शासन | राष्ट्रीय आरोग्य अभियान (NHM / NVBDCP / NTEP / NLEP / NPCB)</span>
          </div>
          <div>
            उपकेंद्र: {config.subCentreName} ({config.phcName})
          </div>
        </div>
      </footer>

      <OfflineIndicator />
    </div>
  );
}
