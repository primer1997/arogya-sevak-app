export interface MonthItem {
  num: number; // 1 to 12
  marathiName: string;
  englishName: string;
}

export const MARATHI_MONTHS: MonthItem[] = [
  { num: 1, marathiName: 'जानेवारी', englishName: 'January' },
  { num: 2, marathiName: 'फेब्रुवारी', englishName: 'February' },
  { num: 3, marathiName: 'मार्च', englishName: 'March' },
  { num: 4, marathiName: 'एप्रिल', englishName: 'April' },
  { num: 5, marathiName: 'मे', englishName: 'May' },
  { num: 6, marathiName: 'जून', englishName: 'June' },
  { num: 7, marathiName: 'जुलै', englishName: 'July' },
  { num: 8, marathiName: 'ऑगस्ट', englishName: 'August' },
  { num: 9, marathiName: 'सप्टेंबर', englishName: 'September' },
  { num: 10, marathiName: 'ऑक्टोबर', englishName: 'October' },
  { num: 11, marathiName: 'नोव्हेंबर', englishName: 'November' },
  { num: 12, marathiName: 'डिसेंबर', englishName: 'December' },
];

// Keep the reporting year selector open for historical and future records.
export const AVAILABLE_YEARS = Array.from({ length: 201 }, (_, index) => 1900 + index);

// Convert English numerals to Marathi numerals
export function toMarathiDigits(num: number | string): string {
  const marathiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(num).replace(/\d/g, (d) => marathiDigits[parseInt(d, 10)]);
}

// Convert Marathi numerals to English numerals
export function toEnglishDigits(str: string | number): string {
  if (typeof str === 'number') return String(str);
  if (!str) return '';
  const marathiDigits: Record<string, string> = {
    '०': '0',
    '१': '1',
    '२': '2',
    '३': '3',
    '४': '4',
    '५': '5',
    '६': '6',
    '७': '7',
    '८': '8',
    '९': '9',
  };
  return String(str).replace(/[०-९]/g, (d) => marathiDigits[d] || d);
}

/**
 * Robust numeric parser that handles both English (0-9) and Marathi (०-९) numerals.
 */
export function parseNumberInput(val: string | number, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val || typeof val !== 'string') return fallback;
  const eng = toEnglishDigits(val.trim());
  const clean = eng.replace(/[^0-9-]/g, '');
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Parses a string like "ऑगस्ट २०२६" or "ऑगस्ट 2026" or "August 2026"
 * Returns monthNum (1-12) and year (e.g. 2026)
 */
export function parseReportingMonth(reportingMonth: string): {
  monthNum: number;
  monthName: string;
  year: number;
} {
  const clean = (reportingMonth || '').trim();
  const engText = toEnglishDigits(clean);

  // Find Year
  const yearMatch = engText.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 2026;

  // Find Month
  let monthNum = 8; // Default August
  let monthName = 'ऑगस्ट';

  for (const m of MARATHI_MONTHS) {
    if (
      clean.includes(m.marathiName) ||
      clean.toLowerCase().includes(m.englishName.toLowerCase())
    ) {
      monthNum = m.num;
      monthName = m.marathiName;
      break;
    }
  }

  return { monthNum, monthName, year };
}

/**
 * Formats month number and year into standard Marathi reportingMonth string with standard English year digits
 * e.g. (8, 2026) -> "ऑगस्ट 2026"
 */
export function formatReportingMonth(monthNum: number, year: number): string {
  const m = MARATHI_MONTHS.find((item) => item.num === monthNum) || MARATHI_MONTHS[7];
  return `${m.marathiName} ${year}`;
}

/**
 * Creates month key for storage: e.g. "2026-08"
 */
export function getMonthKey(monthNum: number, year: number): string {
  const padded = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
  return `${year}-${padded}`;
}

/**
 * Returns previous month info: e.g. for (8, 2026) -> (7, 2026, "जुलै २०२६", "2026-07")
 */
export function getPreviousMonthInfo(
  monthNum: number,
  year: number
): {
  prevMonthNum: number;
  prevYear: number;
  prevReportingMonth: string;
  prevMonthKey: string;
} {
  let prevMonthNum = monthNum - 1;
  let prevYear = year;
  if (prevMonthNum < 1) {
    prevMonthNum = 12;
    prevYear = year - 1;
  }
  const prevReportingMonth = formatReportingMonth(prevMonthNum, prevYear);
  const prevMonthKey = getMonthKey(prevMonthNum, prevYear);
  return { prevMonthNum, prevYear, prevReportingMonth, prevMonthKey };
}
