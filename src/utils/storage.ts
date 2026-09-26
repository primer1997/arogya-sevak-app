import { supabase } from '../lib/supabase';
import {
  SubCentreConfig,
  ContainerSurveyData,
  PatientRecord,
  TbPatientRecord,
  LeprosyPatientRecord,
  CataractPatientRecord,
  DeathRecord,
} from '../types';
import {
  initialConfig,
  initialSurveyData,
  initialMonthlySurveys,
  initialJulySurveyData,
  blankSurveyData,
} from '../data/initialData';
import { parseReportingMonth, getMonthKey } from './dateUtils';

const CONFIG_KEY = 'arogya_sevak_config_v2';
const SURVEY_KEY = 'arogya_sevak_survey_v2';
const MONTHLY_SURVEYS_KEY = 'arogya_sevak_monthly_surveys_v2';
// प्रत्येक महिन्याचा लाईनलिस्ट डेटा स्वतंत्र सेव्ह करण्यासाठी महिना-कीड मॅप्स
const PATIENTS_MONTHLY_KEY = 'arogya_sevak_patients_monthly_v1';
const TB_PATIENTS_MONTHLY_KEY = 'arogya_sevak_tb_patients_monthly_v1';
const LEPROSY_PATIENTS_MONTHLY_KEY = 'arogya_sevak_leprosy_patients_monthly_v1';
const CATARACT_PATIENTS_MONTHLY_KEY = 'arogya_sevak_cataract_patients_monthly_v1';
const DEATHS_MONTHLY_KEY = 'arogya_sevak_deaths_monthly_v1';
// जुने फ्लॅट (महिनाविरहित) कीज — फक्त एकदाच्या मायग्रेशनसाठी वाचले जातात
const PATIENTS_KEY = 'arogya_sevak_patients_v2';
const TB_PATIENTS_KEY = 'arogya_sevak_tb_patients_v1';
const LEPROSY_PATIENTS_KEY = 'arogya_sevak_leprosy_patients_v1';
const CATARACT_PATIENTS_KEY = 'arogya_sevak_cataract_patients_v1';
const DEATHS_KEY = 'arogya_sevak_deaths_v1';
const MONTHLY_MIGRATION_FLAG = 'arogya_sevak_monthly_migrated_v1';

// महिनानिहाय डेटा: { "2026-09": [...], "2026-10": [...] }
export interface CloudAppData {
  ownerEmail?: string;
  config: SubCentreConfig;
  survey: ContainerSurveyData;
  monthlySurveys: Record<string, ContainerSurveyData>;
  patientsByMonth: Record<string, PatientRecord[]>;
  tbPatientsByMonth: Record<string, TbPatientRecord[]>;
  leprosyPatientsByMonth: Record<string, LeprosyPatientRecord[]>;
  cataractPatientsByMonth: Record<string, CataractPatientRecord[]>;
  deathsByMonth: Record<string, DeathRecord[]>;
}

// जुना क्लाउड फॉरमॅट (फ्लॅट अ‍ॅरे) — मायग्रेशनसाठी
interface LegacyCloudAppData {
  config?: SubCentreConfig;
  survey?: ContainerSurveyData;
  monthlySurveys?: Record<string, ContainerSurveyData>;
  patients?: PatientRecord[];
  tbPatients?: TbPatientRecord[];
  leprosyPatients?: LeprosyPatientRecord[];
  cataractPatients?: CataractPatientRecord[];
  deaths?: DeathRecord[];
}

function currentMonthKey(): string {
  const cfg = loadConfig();
  const { monthNum, year } = parseReportingMonth(cfg.reportingMonth);
  return getMonthKey(monthNum, year);
}

function isNewCloudShape(data: unknown): data is CloudAppData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.patientsByMonth === 'object' && d.patientsByMonth !== null &&
    typeof d.tbPatientsByMonth === 'object' && d.tbPatientsByMonth !== null
  );
}

function toNewCloudShape(legacy: LegacyCloudAppData): CloudAppData {
  let monthKey = currentMonthKey();
  try {
    if (legacy.config?.reportingMonth) {
      const { monthNum, year } = parseReportingMonth(legacy.config.reportingMonth);
      monthKey = getMonthKey(monthNum, year);
    }
  } catch { /* fallback: current month */ }
  const put = <T,>(arr: T[] | undefined, normalize: (r: Partial<T>) => T): Record<string, T[]> =>
    arr && arr.length > 0 ? { [monthKey]: arr.map((r) => normalize((r || {}) as Partial<T>)) } : {};
  // जुना फ्लॅट survey फक्त active की मध्ये न ठेवता त्याच्या महिन्यातही नोंदवा,
  // जेणेकरून महिना बदलून परत आल्यावर आकडेवारी हरवणार नाही.
  const monthly: Record<string, ContainerSurveyData> = { ...(legacy.monthlySurveys ?? {}) };
  if (legacy.survey && !monthly[monthKey]) {
    monthly[monthKey] = legacy.survey;
  }
  return {
    config: legacy.config ?? initialConfig,
    survey: legacy.survey ?? { ...blankSurveyData },
    monthlySurveys: monthly,
    patientsByMonth: put(legacy.patients, normalizePatientRecord),
    tbPatientsByMonth: put(legacy.tbPatients, normalizeTbPatientRecord),
    leprosyPatientsByMonth: put(legacy.leprosyPatients, normalizeLeprosyPatientRecord),
    cataractPatientsByMonth: put(legacy.cataractPatients, normalizeCataractPatientRecord),
    deathsByMonth: put(legacy.deaths, normalizeDeathRecord),
  };
}

export async function loadCloudAppData(): Promise<CloudAppData | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data, error } = await supabase.from('user_app_data').select('data').eq('user_id', userData.user.id).maybeSingle();
  if (error) throw error;
  const raw = data?.data as unknown;
  if (!raw) return null;
  // जुना फ्लॅट फॉरमॅट आढळल्यास नव्या महिनानिहाय फॉरमॅटमध्ये रूपांतरित करा
  if (isNewCloudShape(raw)) return raw;
  return toNewCloudShape(raw as LegacyCloudAppData);
}

export async function saveCloudAppData(payload: CloudAppData) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  // PHC डॅशबोर्डवर कोणत्या email चे कार्ड आहे ते दिसावे म्हणून email सोबत सेव्ह करा
  const payloadWithEmail: CloudAppData = {
    ...payload,
    ownerEmail: userData.user.email ?? payload.ownerEmail,
  };
  const { error } = await supabase.from('user_app_data').upsert({ user_id: userData.user.id, data: payloadWithEmail, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export function loadConfig(): SubCentreConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load config from storage', e);
  }
  return initialConfig;
}

export function saveConfig(config: SubCentreConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config', e);
  }
}

export function loadMonthlySurveys(): Record<string, ContainerSurveyData> {
  let map: Record<string, ContainerSurveyData> = { ...initialMonthlySurveys };
  try {
    const raw = localStorage.getItem(MONTHLY_SURVEYS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, ContainerSurveyData>;
      map = { ...map, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load monthly surveys from storage', e);
  }
  // जुने डेमो सीड महिने (2026-07 / 2026-08) वापरकर्त्याने बदलले नसतील तर काढून टाका,
  // जेणेकरून प्रगतिपर आकडेवारीत डेमो डेटा मिसळणार नाही.
  let cleaned = false;
  const seedJson: Record<string, string> = {
    '2026-07': JSON.stringify(initialJulySurveyData),
    '2026-08': JSON.stringify(initialSurveyData),
  };
  for (const k of Object.keys(seedJson)) {
    if (map[k] && JSON.stringify(map[k]) === seedJson[k]) {
      delete map[k];
      cleaned = true;
    }
  }
  // जुना फ्लॅट survey (SURVEY_KEY) चालू महिन्याच्या बकेटमध्ये हलवा —
  // जेणेकरून महिना बदलून परत आल्यावर आकडेवारी हरवणार नाही.
  try {
    const mk = currentMonthKey();
    if (!map[mk]) {
      const flat = localStorage.getItem(SURVEY_KEY);
      if (flat) {
        const s = JSON.parse(flat) as ContainerSurveyData;
        if (s && typeof s === 'object') {
          map[mk] = s;
          cleaned = true;
        }
      }
    }
  } catch { /* ignore */ }
  if (cleaned) {
    try { localStorage.setItem(MONTHLY_SURVEYS_KEY, JSON.stringify(map)); } catch { /* ignore */ }
  }
  return map;
}

export function saveMonthlySurveys(map: Record<string, ContainerSurveyData>) {
  try {
    localStorage.setItem(MONTHLY_SURVEYS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save monthly surveys', e);
  }
}

/**
 * दिलेल्या महिन्याचा सर्व्हे परत करते. महिन्याचा डेटा अजून सेव्ह झालेला नसेल
 * तर पूर्ण कोरा (blank) फॉर्म परत करते — मागील महिन्यातील आकडे पुढे नेले जात नाहीत.
 */
export function getSurveyForMonth(monthKey: string): ContainerSurveyData {
  const map = loadMonthlySurveys();
  if (map[monthKey]) {
    return map[monthKey];
  }
  // नवीन महिना — कोरा फॉर्म (सेव्ह न करता; पहिल्या एडिटवर सेव्ह होईल)
  return { ...blankSurveyData };
}

export function saveSurveyForMonth(monthKey: string, survey: ContainerSurveyData) {
  const map = loadMonthlySurveys();
  map[monthKey] = survey;
  saveMonthlySurveys(map);
  // Also save active survey key
  saveSurveyData(survey);
}

export function loadSurveyData(): ContainerSurveyData {
  try {
    const raw = localStorage.getItem(SURVEY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load survey from storage', e);
  }
  return initialSurveyData;
}

export function saveSurveyData(survey: ContainerSurveyData) {
  try {
    localStorage.setItem(SURVEY_KEY, JSON.stringify(survey));
  } catch (e) {
    console.error('Failed to save survey', e);
  }
}

/* ------------------------------------------------------------------ */
/* रेकॉर्ड नॉर्मलायझेशन                                                */
/* जुन्या किंवा अपूर्ण रेकॉर्डमधील missing फील्डमुळे लाईनलिस्ट टॅब      */
/* क्रॅश होऊ नये (उदा. undefined.toLowerCase()) म्हणून डीफॉल्ट मूल्ये.   */
/* ------------------------------------------------------------------ */
const sstr = (v: unknown): string => (typeof v === 'string' ? v : '');
const snum = (v: unknown): number => (typeof v === 'number' && !isNaN(v) ? v : 0);
const sbool = (v: unknown): boolean => v === true;
const sarr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
const sgender = (v: unknown): 'पुरुष' | 'स्त्री' | 'इतर' =>
  v === 'स्त्री' || v === 'इतर' ? v : 'पुरुष';

export function normalizePatientRecord(p: Partial<PatientRecord>): PatientRecord {
  return {
    id: sstr(p.id) || `pt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    regNo: sstr(p.regNo),
    date: sstr(p.date),
    name: sstr(p.name),
    age: snum(p.age),
    gender: sgender(p.gender),
    village: sstr(p.village),
    contact: sstr(p.contact),
    symptoms: sarr(p.symptoms),
    suspectedDisease: sstr(p.suspectedDisease) || 'गॅस्ट्रो',
    tclStatus: p.tclStatus === 'होय' ? 'होय' : 'नाही',
    tclDetails: sstr(p.tclDetails),
    bloodSlideTaken: sbool(p.bloodSlideTaken),
    rdtResult: sstr(p.rdtResult),
    treatment: sstr(p.treatment),
    referred: sbool(p.referred),
    referralCenter: sstr(p.referralCenter),
    status:
      p.status === 'पूर्ण बरा झाला' || p.status === 'रेफर केले' ? p.status : 'उपचार चालू',
    remarks: sstr(p.remarks),
  } as PatientRecord;
}

export function normalizeTbPatientRecord(p: Partial<TbPatientRecord>): TbPatientRecord {
  return {
    id: sstr(p.id) || `tb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    regNo: sstr(p.regNo),
    date: sstr(p.date),
    name: sstr(p.name),
    age: snum(p.age),
    gender: sgender(p.gender),
    village: sstr(p.village),
    contact: sstr(p.contact),
    tbType: p.tbType === 'फुफ्फुसेतर (Extra-Pulmonary)' ? p.tbType : 'फुफ्फुसीय (Pulmonary)',
    category:
      p.category === 'उपचाराखालील (Under Treatment)' || p.category === 'उपचार पूर्ण (Cured)'
        ? p.category
        : 'संशयित (Suspected)',
    treatmentStartDate: sstr(p.treatmentStartDate),
    dotsProvider: sstr(p.dotsProvider),
    hivStatus:
      p.hivStatus === 'पॉझिटिव्ह' || p.hivStatus === 'निगेटिव्ह'
        ? p.hivStatus
        : 'तपासणी केली नाही / अज्ञात',
    bankDetailsAdded: p.bankDetailsAdded === 'होय' ? 'होय' : 'नाही',
    remarks: sstr(p.remarks),
  } as TbPatientRecord;
}

export function normalizeLeprosyPatientRecord(p: Partial<LeprosyPatientRecord>): LeprosyPatientRecord {
  return {
    id: sstr(p.id) || `lep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    regNo: sstr(p.regNo),
    date: sstr(p.date),
    name: sstr(p.name),
    age: snum(p.age),
    gender: sgender(p.gender),
    village: sstr(p.village),
    contact: sstr(p.contact),
    leprosyType: p.leprosyType === 'MB (Multi-Bacillary)' ? p.leprosyType : 'PB (Pauci-Bacillary)',
    category:
      p.category === 'उपचाराखालील (Under Treatment)' || p.category === 'उपचार पूर्ण (RFT)'
        ? p.category
        : 'संशयित (Suspected)',
    lesionsCount: snum(p.lesionsCount),
    lesionLocation: sstr(p.lesionLocation),
    deformityGrade:
      p.deformityGrade === 'Grade 1 (संवेदना नष्ट)' || p.deformityGrade === 'Grade 2 (दिसणारे व्यंग)'
        ? p.deformityGrade
        : 'Grade 0 (व्यंग नाही)',
    mdtStartDate: sstr(p.mdtStartDate),
    remarks: sstr(p.remarks),
  } as LeprosyPatientRecord;
}

export function normalizeCataractPatientRecord(p: Partial<CataractPatientRecord>): CataractPatientRecord {
  return {
    id: sstr(p.id) || `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    regNo: sstr(p.regNo),
    date: sstr(p.date),
    name: sstr(p.name),
    age: snum(p.age),
    gender: sgender(p.gender),
    village: sstr(p.village),
    contact: sstr(p.contact),
    affectedEye:
      p.affectedEye === 'उजवा डोळा' || p.affectedEye === 'डावा डोळा' ? p.affectedEye : 'दोन्ही डोळे',
    visualAcuity: sstr(p.visualAcuity),
    screeningSite: sstr(p.screeningSite),
    surgeryStatus:
      p.surgeryStatus === 'शस्त्रक्रिया पूर्ण झाली' || p.surgeryStatus === 'शस्त्रक्रियेस नकार / अनफिट'
        ? p.surgeryStatus
        : 'संशयित / प्रलंबित',
    surgeryDate: sstr(p.surgeryDate),
    hospitalName: sstr(p.hospitalName),
    remarks: sstr(p.remarks),
  } as CataractPatientRecord;
}

export function normalizeDeathRecord(p: Partial<DeathRecord>): DeathRecord {
  return {
    id: sstr(p.id) || `dth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: sstr(p.date),
    name: sstr(p.name),
    age: snum(p.age),
    gender: sgender(p.gender),
    village: sstr(p.village),
    place: p.place === 'गावाबाहेर' ? p.place : 'गावात',
    deathPlace: sstr(p.deathPlace),
    cause: sstr(p.cause),
    remarks: sstr(p.remarks),
  } as DeathRecord;
}

/** महिना-कीड मॅपमधील प्रत्येक रेकॉर्ड नॉर्मलाइज करा. */
export function normalizeMonthMap<T>(
  map: Record<string, unknown[]>,
  normalize: (r: Partial<T>) => T,
): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const [k, arr] of Object.entries(map || {})) {
    out[k] = Array.isArray(arr) ? arr.map((r) => normalize((r || {}) as Partial<T>)) : [];
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* महिनानिहाय लाईनलिस्ट स्टोरेज                                          */
/* प्रत्येक महिन्याचा डेटा स्वतंत्र मॅपमध्ये: { "2026-09": [...] }         */
/* ------------------------------------------------------------------ */

function loadMonthlyMap<T>(key: string, normalize: (r: Partial<T>) => T): Record<string, T[]> {
  migrateLegacyMonthlyData();
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown[]>;
      if (parsed && typeof parsed === 'object') return normalizeMonthMap(parsed, normalize);
    }
  } catch (e) {
    console.error(`Failed to load monthly map ${key}`, e);
  }
  return {};
}

function saveMonthlyMap<T>(key: string, map: Record<string, T[]>) {
  migrateLegacyMonthlyData();
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch (e) {
    console.error(`Failed to save monthly map ${key}`, e);
  }
}

function readLegacyArray<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(`Failed to read legacy key ${key}`, e);
  }
  return null;
}

/**
 * एकदाचे मायग्रेशन: जुन्या फ्लॅट (महिनाविरहित) कीजमधील डेटा चालू
 * अहवाल महिन्याच्या बकेटमध्ये हलवते आणि जुने कीज काढून टाकते.
 */
export function migrateLegacyMonthlyData() {
  try {
    if (localStorage.getItem(MONTHLY_MIGRATION_FLAG)) return;
    const monthKey = currentMonthKey();
    const jobs: Array<[string, string, (r: Partial<never>) => unknown]> = [
      [PATIENTS_KEY, PATIENTS_MONTHLY_KEY, normalizePatientRecord as (r: Partial<never>) => unknown],
      [TB_PATIENTS_KEY, TB_PATIENTS_MONTHLY_KEY, normalizeTbPatientRecord as (r: Partial<never>) => unknown],
      [LEPROSY_PATIENTS_KEY, LEPROSY_PATIENTS_MONTHLY_KEY, normalizeLeprosyPatientRecord as (r: Partial<never>) => unknown],
      [CATARACT_PATIENTS_KEY, CATARACT_PATIENTS_MONTHLY_KEY, normalizeCataractPatientRecord as (r: Partial<never>) => unknown],
      [DEATHS_KEY, DEATHS_MONTHLY_KEY, normalizeDeathRecord as (r: Partial<never>) => unknown],
    ];
    for (const [legacyKey, monthlyKey, normalize] of jobs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const legacy = readLegacyArray<any>(legacyKey);
      if (legacy) {
        let map: Record<string, unknown[]> = {};
        try {
          const raw = localStorage.getItem(monthlyKey);
          if (raw) map = JSON.parse(raw) as Record<string, unknown[]>;
        } catch { /* start fresh */ }
        if (!map[monthKey] || (Array.isArray(map[monthKey]) && map[monthKey].length === 0)) {
          // नॉर्मलाइज करा — अपूर्ण रेकॉर्डमुळे टॅब क्रॅश होऊ नये.
          map[monthKey] = legacy.map((r) => normalize((r || {}) as Partial<never>));
          localStorage.setItem(monthlyKey, JSON.stringify(map));
        }
      }
      localStorage.removeItem(legacyKey);
    }
    localStorage.setItem(MONTHLY_MIGRATION_FLAG, '1');
  } catch (e) {
    console.error('Monthly migration failed', e);
  }
}

/** दिलेल्या महिन्याचा डेटा; नसल्यास रिकामा अ‍ॅरे (पूर्ण नवा महिना = कोरा फॉर्म). */
export function getMonthList<T>(map: Record<string, T[]>, monthKey: string): T[] {
  return map[monthKey] ?? [];
}

function setMonthList<T>(map: Record<string, T[]>, monthKey: string, list: T[]): Record<string, T[]> {
  return { ...map, [monthKey]: list };
}

// जलजन्य / सर्वसाधारण रुग्ण
export function loadPatientsMap(): Record<string, PatientRecord[]> {
  return loadMonthlyMap<PatientRecord>(PATIENTS_MONTHLY_KEY, normalizePatientRecord);
}
export function savePatientsMap(map: Record<string, PatientRecord[]>) {
  saveMonthlyMap(PATIENTS_MONTHLY_KEY, map);
}

// १. क्षयरुग्ण (TB)
export function loadTbPatientsMap(): Record<string, TbPatientRecord[]> {
  return loadMonthlyMap<TbPatientRecord>(TB_PATIENTS_MONTHLY_KEY, normalizeTbPatientRecord);
}
export function saveTbPatientsMap(map: Record<string, TbPatientRecord[]>) {
  saveMonthlyMap(TB_PATIENTS_MONTHLY_KEY, map);
}

// २. कुष्ठरुग्ण (Leprosy)
export function loadLeprosyPatientsMap(): Record<string, LeprosyPatientRecord[]> {
  return loadMonthlyMap<LeprosyPatientRecord>(LEPROSY_PATIENTS_MONTHLY_KEY, normalizeLeprosyPatientRecord);
}
export function saveLeprosyPatientsMap(map: Record<string, LeprosyPatientRecord[]>) {
  saveMonthlyMap(LEPROSY_PATIENTS_MONTHLY_KEY, map);
}

// ३. मोतीबिंदू (Cataract)
export function loadCataractPatientsMap(): Record<string, CataractPatientRecord[]> {
  return loadMonthlyMap<CataractPatientRecord>(CATARACT_PATIENTS_MONTHLY_KEY, normalizeCataractPatientRecord);
}
export function saveCataractPatientsMap(map: Record<string, CataractPatientRecord[]>) {
  saveMonthlyMap(CATARACT_PATIENTS_MONTHLY_KEY, map);
}

// ४. मृत्यू नोंदी
export function loadDeathsMap(): Record<string, DeathRecord[]> {
  return loadMonthlyMap<DeathRecord>(DEATHS_MONTHLY_KEY, normalizeDeathRecord);
}
export function saveDeathsMap(map: Record<string, DeathRecord[]>) {
  saveMonthlyMap(DEATHS_MONTHLY_KEY, map);
}

export function resetAllData() {
  localStorage.removeItem(CONFIG_KEY);
  localStorage.removeItem(SURVEY_KEY);
  localStorage.removeItem(MONTHLY_SURVEYS_KEY);
  localStorage.removeItem(PATIENTS_MONTHLY_KEY);
  localStorage.removeItem(TB_PATIENTS_MONTHLY_KEY);
  localStorage.removeItem(LEPROSY_PATIENTS_MONTHLY_KEY);
  localStorage.removeItem(CATARACT_PATIENTS_MONTHLY_KEY);
  localStorage.removeItem(DEATHS_MONTHLY_KEY);
  localStorage.removeItem(MONTHLY_MIGRATION_FLAG);
  // जुने कीज (असल्यास)
  localStorage.removeItem(PATIENTS_KEY);
  localStorage.removeItem(TB_PATIENTS_KEY);
  localStorage.removeItem(LEPROSY_PATIENTS_KEY);
  localStorage.removeItem(CATARACT_PATIENTS_KEY);
  localStorage.removeItem(DEATHS_KEY);
}

