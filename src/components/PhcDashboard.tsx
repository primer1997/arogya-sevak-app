import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FileBarChart,
  HeartPulse,
  LogOut,
  Mail,
  RefreshCw,
  LayoutGrid,
  Search,
  Table2,
  Trash2,
  Users,
} from 'lucide-react';
import { LiveHeaderFx } from './LiveHeaderFx';
import { PhcCompareTable } from './PhcCompareTable';
import { supabase, fetchAllUserReports, UserReportRow } from '../lib/supabase';
import { ReportsTab } from './ReportsTab';
import { initialConfig, blankSurveyData } from '../data/initialData';
import {
  parseReportingMonth,
  getMonthKey,
  MARATHI_MONTHS,
} from '../utils/dateUtils';
import {
  getMonthList,
  normalizeMonthMap,
  normalizePatientRecord,
  normalizeTbPatientRecord,
  normalizeLeprosyPatientRecord,
  normalizeCataractPatientRecord,
  normalizeDeathRecord,
} from '../utils/storage';
import {
  SubCentreConfig,
  ContainerSurveyData,
  PatientRecord,
  TbPatientRecord,
  LeprosyPatientRecord,
  CataractPatientRecord,
  DeathRecord,
} from '../types';

export interface CentreVM {
  userId: string;
  updatedAt: string;
  ownerEmail: string;
  config: SubCentreConfig;
  monthKeys: string[];
  monthlySurveys: Record<string, ContainerSurveyData>;
  patientsByMonth: Record<string, PatientRecord[]>;
  tbByMonth: Record<string, TbPatientRecord[]>;
  leprosyByMonth: Record<string, LeprosyPatientRecord[]>;
  cataractByMonth: Record<string, CataractPatientRecord[]>;
  deathsByMonth: Record<string, DeathRecord[]>;
}

function asRecord(v: any): Record<string, any> {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

function monthLabel(key: string): string {
  const m = key.match(/^(\d{4})-(\d{2})$/);
  if (!m) return key;
  const month = MARATHI_MONTHS.find((x) => x.num === parseInt(m[2], 10));
  return `${month ? month.marathiName : m[2]} ${m[1]}`;
}

function toVM(row: UserReportRow): CentreVM {
  const d: any = row.data ?? {};
  const config: SubCentreConfig = { ...initialConfig, ...(d.config ?? {}) };
  const monthlySurveys = asRecord(d.monthlySurveys) as Record<string, ContainerSurveyData>;
  const patientsByMonth = normalizeMonthMap(asRecord(d.patientsByMonth), normalizePatientRecord);
  const tbByMonth = normalizeMonthMap(asRecord(d.tbPatientsByMonth), normalizeTbPatientRecord);
  const leprosyByMonth = normalizeMonthMap(asRecord(d.leprosyPatientsByMonth), normalizeLeprosyPatientRecord);
  const cataractByMonth = normalizeMonthMap(asRecord(d.cataractPatientsByMonth), normalizeCataractPatientRecord);
  const deathsByMonth = normalizeMonthMap(asRecord(d.deathsByMonth), normalizeDeathRecord);

  const keys = new Set<string>();
  Object.keys(monthlySurveys).forEach((k) => keys.add(k));
  [patientsByMonth, tbByMonth, leprosyByMonth, cataractByMonth, deathsByMonth].forEach((map) =>
    Object.keys(map).forEach((k) => keys.add(k)),
  );
  try {
    const { monthNum, year } = parseReportingMonth(config.reportingMonth);
    keys.add(getMonthKey(monthNum, year));
  } catch {
    /* ignore */
  }
  const monthKeys = [...keys].filter((k) => /^\d{4}-\d{2}$/.test(k)).sort().reverse();

  return {
    userId: row.user_id,
    updatedAt: row.updated_at,
    ownerEmail: typeof d.ownerEmail === 'string' ? d.ownerEmail : '',
    config,
    monthKeys,
    monthlySurveys,
    patientsByMonth,
    tbByMonth,
    leprosyByMonth,
    cataractByMonth,
    deathsByMonth,
  };
}

function totalRecords(vm: CentreVM): number {
  const sum = (m: Record<string, any[]>) => Object.values(m).reduce((a, l) => a + l.length, 0);
  return (
    sum(vm.patientsByMonth) +
    sum(vm.tbByMonth) +
    sum(vm.leprosyByMonth) +
    sum(vm.cataractByMonth) +
    sum(vm.deathsByMonth)
  );
}

export const PhcDashboard: React.FC = () => {
  const [rows, setRows] = useState<CentreVM[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [myUserId, setMyUserId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CentreVM | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [listMode, setListMode] = useState<'cards' | 'compare'>('cards');
  const [compareMonthKey, setCompareMonthKey] = useState('');

  const load = async () => {
    setRefreshing(true);
    setError('');
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) setMyUserId(userData.user.id);
    } catch {
      /* दुर्लक्ष करा */
    }
    try {
      const data = await fetchAllUserReports();
      // उपकेंद्र नावानुसार सुटसुटीत क्रम (अ-ज्ञ)
      const vms = data.map(toVM);
      vms.sort((a, b) =>
        (a.config.subCentreName || '').localeCompare(b.config.subCentreName || '', 'mr'),
      );
      setRows(vms);
    } catch (e: any) {
      console.error('[phc] load failed', e);
      setError(
        'अहवाल वाचता आले नाहीत. Supabase मध्ये PHC सेटअप (supabase-phc-setup.sql) चालवले आहे का ते तपासा — किंवा इंटरनेट कनेक्शन पहा.',
      );
      setRows([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function deleteReportData(vm: CentreVM) {
    setDeleting(true);
    setError(null);
    const { error } = await supabase.from('user_app_data').delete().eq('user_id', vm.userId);
    setDeleting(false);
    if (error) {
      setError('अहवाल डिलीट करता आला नाही: ' + error.message);
      return;
    }
    setRows((prev) => (prev ? prev.filter((r) => r.userId !== vm.userId) : prev));
    setDeleteTarget(null);
  }

  async function deleteWorkerAccount(vm: CentreVM) {
    setDeleting(true);
    setError(null);
    const { error } = await supabase.rpc('delete_worker_account', { target_user_id: vm.userId });
    setDeleting(false);
    if (error) {
      setError('कर्मचारी डिलीट करता आला नाही: ' + error.message);
      return;
    }
    setRows((prev) => (prev ? prev.filter((r) => r.userId !== vm.userId) : prev));
    setDeleteTarget(null);
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.config.subCentreName.toLowerCase().includes(q) ||
        r.config.workerName.toLowerCase().includes(q) ||
        r.config.phcName.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const selected = useMemo(
    () => rows?.find((r) => r.userId === selectedUserId) ?? null,
    [rows, selectedUserId],
  );

  // निवडलेल्या उपकेंद्राचा महिना ठरवा
  useEffect(() => {
    if (selected) {
      setSelectedMonthKey((prev) => {
        if (prev && selected.monthKeys.includes(prev)) return prev;
        return selected.monthKeys[0] ?? null;
      });
    } else {
      setSelectedMonthKey(null);
    }
  }, [selected]);

  const openCentre = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedMonthKey(null);
    window.scrollTo({ top: 0 });
  };

  const phcName = rows && rows.length > 0 ? rows[0].config.phcName || 'PHC' : 'PHC';

  // तुलनात्मक तक्त्यासाठी सर्व महिने (union), default = सगळ्यात अलीकडचा
  const allMonths = useMemo(() => {
    if (!rows) return [];
    const set = new Set<string>();
    rows.forEach((r) => r.monthKeys.forEach((k) => set.add(k)));
    return [...set].filter((k) => /^\d{4}-\d{2}$/.test(k)).sort().reverse();
  }, [rows]);

  useEffect(() => {
    if (!compareMonthKey && allMonths.length > 0) setCompareMonthKey(allMonths[0]);
  }, [allMonths, compareMonthKey]);

  const detailData = useMemo(() => {
    if (!selected || !selectedMonthKey) return null;
    const survey = selected.monthlySurveys[selectedMonthKey] ?? { ...blankSurveyData };
    return {
      survey,
      patients: getMonthList(selected.patientsByMonth, selectedMonthKey),
      tbPatients: getMonthList(selected.tbByMonth, selectedMonthKey),
      leprosyPatients: getMonthList(selected.leprosyByMonth, selectedMonthKey),
      cataractPatients: getMonthList(selected.cataractByMonth, selectedMonthKey),
      deaths: getMonthList(selected.deathsByMonth, selectedMonthKey),
    };
  }, [selected, selectedMonthKey]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Mukta',sans-serif] text-slate-900">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-[#1a4a72] via-[#163d5e] to-[#0f2740] text-white shadow-md print:hidden">
        <LiveHeaderFx />
        <div className="relative max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 shrink-0">
              <div aria-hidden className="absolute inset-0 rounded-full border-2 border-dashed border-amber-300/40 animate-spin-slow" />
              <div className="absolute inset-[5px] rounded-full bg-white/15 flex items-center justify-center border border-white/25 shadow-inner">
                <Building2 className="w-6 h-6 text-[#f39c12]" />
              </div>
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">PHC अहवाल डॅशबोर्ड</div>
              <div className="text-xs text-slate-300">{phcName} — सर्व उपकेंद्रांचे अहवाल</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition disabled:opacity-50"
              title="रिफ्रेश करा"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition"
            >
              <LogOut className="w-4 h-4" />
              बाहेर पडा
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4">
        {selected && detailData ? (
          /* ===== तपशील दृश्य: एका उपकेंद्राचा अहवाल ===== */
          <div className="animate-fade-up">
            <div className="flex flex-wrap items-center gap-2 mb-3 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="pressable inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-[#1a4a72] shadow-xs hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                सर्व उपकेंद्रे
              </button>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-xs">
                <Building2 className="w-4 h-4 text-[#1a4a72]" />
                <span className="text-sm font-bold">{selected.config.subCentreName || '—'}</span>
                <span className="text-xs text-slate-500">
                  {selected.config.workerName}
                  {selected.config.workerDesignation ? ` (${selected.config.workerDesignation})` : ''}
                  {selected.ownerEmail ? ` • ${selected.ownerEmail}` : ''}
                </span>
              </div>
              {selected.monthKeys.length > 0 && (
                <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-xs text-xs font-bold text-slate-700">
                  <CalendarDays className="w-4 h-4 text-[#1a4a72]" />
                  महिना:
                  <select
                    value={selectedMonthKey ?? ''}
                    onChange={(e) => setSelectedMonthKey(e.target.value)}
                    className="text-xs font-bold text-[#1a4a72] outline-none bg-transparent cursor-pointer"
                  >
                    {selected.monthKeys.map((k) => (
                      <option key={k} value={k}>
                        {monthLabel(k)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {selectedMonthKey ? (
              <ReportsTab
                config={selected.config}
                survey={detailData.survey}
                patients={detailData.patients}
                tbPatients={detailData.tbPatients}
                leprosyPatients={detailData.leprosyPatients}
                cataractPatients={detailData.cataractPatients}
                deaths={detailData.deaths}
                monthKey={selectedMonthKey}
                monthlySurveys={selected.monthlySurveys}
                patientsByMonth={selected.patientsByMonth}
                tbPatientsByMonth={selected.tbByMonth}
                leprosyPatientsByMonth={selected.leprosyByMonth}
                cataractPatientsByMonth={selected.cataractByMonth}
                deathsByMonth={selected.deathsByMonth}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-sm">
                या उपकेंद्राकडे अजून कोणताही महिन्याचा अहवाल नाही.
              </div>
            )}
          </div>
        ) : (
          /* ===== यादी दृश्य: सर्व उपकेंद्रे ===== */
          <div className="animate-fade-up">
            {/* दृश्य टॉगल: यादी / तुलनात्मक तक्ता */}
            <div className="flex items-center gap-1 mb-3 bg-white border border-slate-200 rounded-xl p-1 shadow-xs w-fit print:hidden">
              <button
                type="button"
                onClick={() => setListMode('cards')}
                className={`pressable inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                  listMode === 'cards'
                    ? 'bg-[#1a4a72] text-white shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                उपकेंद्र यादी
              </button>
              <button
                type="button"
                onClick={() => setListMode('compare')}
                className={`pressable inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                  listMode === 'compare'
                    ? 'bg-[#1a4a72] text-white shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Table2 className="w-4 h-4" />
                तुलनात्मक तक्ता
              </button>
            </div>

            {listMode === 'compare' ? (
              <PhcCompareTable
                centres={filtered}
                months={allMonths}
                monthKey={compareMonthKey}
                onMonthChange={setCompareMonthKey}
                phcName={phcName}
              />
            ) : (
              <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="उपकेंद्र किंवा कर्मचारी नावाने शोधा…"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm shadow-xs outline-none focus:border-[#1a4a72] focus:ring-2 focus:ring-[#1a4a72]/15"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-xs whitespace-nowrap">
                <Users className="w-4 h-4 text-[#1a4a72]" />
                {filtered.length} उपकेंद्रे
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {rows === null || refreshing && rows === null ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-1/2 mb-3" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <FileBarChart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <div className="font-bold text-slate-700 mb-1">
                  {search ? 'शोधाशी जुळणारे उपकेंद्र सापडले नाही.' : 'अजून कोणत्याही उपकेंद्राचा अहवाल आलेला नाही.'}
                </div>
                {!search && (
                  <div className="text-xs text-slate-500">
                    कर्मचारी त्यांच्या लॉगिनमधून अहवाल भरून सेव्ह करतील तेव्हा ते इथे दिसतील.
                  </div>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((r, idx) => (
                  <div
                    key={r.userId}
                    role="button"
                    tabIndex={0}
                    onClick={() => openCentre(r.userId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openCentre(r.userId);
                    }}
                    className="pressable cursor-pointer text-left bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md hover:border-[#1a4a72]/40 transition animate-fade-up"
                    style={{ animationDelay: `${Math.min(idx, 8) * 60}ms` }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-bold text-[#1a4a72]">{r.config.subCentreName || '—'}</div>
                      <div className="flex items-center gap-1 shrink-0">
                        {r.userId !== myUserId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(r);
                            }}
                            className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                            title="डिलीट करा"
                            aria-label="डिलीट करा"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                          {totalRecords(r)} नोंदी
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 mb-1">
                      {r.config.workerName}
                      {r.config.workerDesignation ? ` • ${r.config.workerDesignation}` : ''}
                    </div>
                    {r.ownerEmail && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-2 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{r.ownerEmail}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {r.monthKeys.length} महिने
                      </span>
                      <span>
                        अपडेट: {new Date(r.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1a4a72]">
                      <FileBarChart className="w-3.5 h-3.5" />
                      अहवाल पहा
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            )}
          </div>
        )}
      </main>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 animate-fade-in"
          onClick={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-bold text-slate-900">डिलीट करा</h3>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-semibold">{deleteTarget.config.subCentreName || '—'}</span>
              {deleteTarget.config.workerName ? ` • ${deleteTarget.config.workerName}` : ''}
              {deleteTarget.ownerEmail ? (
                <span className="block text-xs text-slate-400">{deleteTarget.ownerEmail}</span>
              ) : null}
            </p>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => deleteReportData(deleteTarget)}
                className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-left transition hover:bg-amber-100 disabled:opacity-50"
              >
                <div className="font-semibold text-amber-800">फक्त उपकेंद्र अहवाल डिलीट करा</div>
                <div className="mt-0.5 text-xs text-amber-700">
                  या उपकेंद्राचा save केलेला डेटा निघून जाईल. (तो कर्मचारी परत login करून save केल्यास डेटा परत येऊ शकतो.)
                </div>
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => deleteWorkerAccount(deleteTarget)}
                className="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-left transition hover:bg-red-100 disabled:opacity-50"
              >
                <div className="font-semibold text-red-800">कर्मचारी कायमचा डिलीट करा</div>
                <div className="mt-0.5 text-xs text-red-700">
                  त्याचा अहवाल + login account दोन्ही कायमचे निघून जाईल. तो परत login करू शकणार नाही. ही क्रिया परत घेता येणार नाही.
                </div>
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {deleting ? 'डिलीट होत आहे…' : 'रद्द करा'}
              </button>
            </div>
          </div>
        </div>
      )}
      <footer className="py-3 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500 print:hidden">
        <span className="inline-flex items-center gap-1.5">
          <HeartPulse className="w-4 h-4 text-rose-500 animate-glow-pulse" />
          सार्वजनिक आरोग्य विभाग, महाराष्ट्र शासन | PHC अहवाल डॅशबोर्ड (फक्त वाचन — माहिती बदलता येणार नाही)
        </span>
      </footer>
    </div>
  );
};
