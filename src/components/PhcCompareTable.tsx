import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { ArrowDown, ArrowUp, CalendarDays, Download, Table2 } from 'lucide-react';
import { calculateIndices, saveBlob } from '../utils/exportUtils';
import { getMonthList } from '../utils/storage';
import { MARATHI_MONTHS } from '../utils/dateUtils';
import type { CentreVM } from './PhcDashboard';

export function compareMonthLabel(key: string): string {
  const m = key.match(/^(\d{4})-(\d{2})$/);
  if (!m) return key;
  const month = MARATHI_MONTHS.find((x) => x.num === parseInt(m[2], 10));
  return `${month ? month.marathiName : m[2]} ${m[1]}`;
}

interface CmpRow {
  userId: string;
  subCentreName: string;
  workerName: string;
  hasData: boolean;
  hi: number;
  ci: number;
  bi: number;
  riskLevel: string;
  riskColor: string;
  inspHouses: number;
  posHouses: number;
  inspCont: number;
  posCont: number;
  water: number;
  tb: number;
  leprosy: number;
  cataract: number;
  deaths: number;
  patientsTotal: number;
}

type SortKey = 'name' | 'hi' | 'ci' | 'bi' | 'houses' | 'patients';

const num = (v: any): number => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);

function buildRows(centres: CentreVM[], monthKey: string): CmpRow[] {
  return centres.map((c) => {
    const base = {
      userId: c.userId,
      subCentreName: c.config.subCentreName || '—',
      workerName: c.config.workerName || '',
    };
    const s: any = c.monthlySurveys[monthKey];
    if (!s) {
      return {
        ...base,
        hasData: false,
        hi: 0, ci: 0, bi: 0, riskLevel: '', riskColor: '',
        inspHouses: 0, posHouses: 0, inspCont: 0, posCont: 0,
        water: 0, tb: 0, leprosy: 0, cataract: 0, deaths: 0, patientsTotal: 0,
      };
    }
    const idx = calculateIndices({
      inspHouses: num(s.inspHouses),
      posHouses: num(s.posHouses),
      inspCont: num(s.inspCont),
      posCont: num(s.posCont),
    } as any);
    const tb = getMonthList(c.tbByMonth, monthKey).length;
    const leprosy = getMonthList(c.leprosyByMonth, monthKey).length;
    const cataract = getMonthList(c.cataractByMonth, monthKey).length;
    const deaths = getMonthList(c.deathsByMonth, monthKey).length;
    return {
      ...base,
      hasData: true,
      hi: idx.hi,
      ci: idx.ci,
      bi: idx.bi,
      riskLevel: idx.riskLevel,
      riskColor: idx.riskColor,
      inspHouses: num(s.inspHouses),
      posHouses: num(s.posHouses),
      inspCont: num(s.inspCont),
      posCont: num(s.posCont),
      water: num(s.waterBioSent) + num(s.waterChemSent),
      tb,
      leprosy,
      cataract,
      deaths,
      patientsTotal: tb + leprosy + cataract + deaths,
    };
  });
}

const Th: React.FC<{
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: 1 | -1;
  onSort: (k: SortKey) => void;
  className?: string;
}> = ({ label, k, sortKey, sortDir, onSort, className = '' }) => {
  const active = sortKey === k;
  return (
    <th
      onClick={() => onSort(k)}
      className={`px-2 py-2.5 font-bold text-slate-600 cursor-pointer select-none whitespace-nowrap hover:text-[#1a4a72] ${className}`}
      title="क्रमवारी बदला"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortDir === 1 ? (
            <ArrowUp className="w-3 h-3 text-[#1a4a72]" />
          ) : (
            <ArrowDown className="w-3 h-3 text-[#1a4a72]" />
          )
        ) : (
          <span className="w-3" />
        )}
      </span>
    </th>
  );
};

export const PhcCompareTable: React.FC<{
  centres: CentreVM[];
  months: string[];
  monthKey: string;
  onMonthChange: (k: string) => void;
  phcName: string;
}> = ({ centres, months, monthKey, onMonthChange, phcName }) => {
  const [sortKey, setSortKey] = useState<SortKey>('hi');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const onSort = (k: SortKey) => {
    if (k === sortKey) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(k);
      setSortDir(k === 'name' ? 1 : -1);
    }
  };

  const rows = useMemo(() => buildRows(centres, monthKey), [centres, monthKey]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    const val = (r: CmpRow): number | string => {
      switch (sortKey) {
        case 'name':
          return r.subCentreName;
        case 'hi':
          return r.hi;
        case 'ci':
          return r.ci;
        case 'bi':
          return r.bi;
        case 'houses':
          return r.inspHouses;
        case 'patients':
          return r.patientsTotal;
      }
    };
    arr.sort((a, b) => {
      if (a.hasData !== b.hasData) return a.hasData ? -1 : 1;
      const va = val(a);
      const vb = val(b);
      const cmp =
        typeof va === 'string' && typeof vb === 'string'
          ? va.localeCompare(vb, 'mr')
          : (va as number) - (vb as number);
      return cmp * sortDir;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const totals = useMemo(() => {
    const t = {
      centres: 0,
      inspHouses: 0,
      posHouses: 0,
      inspCont: 0,
      posCont: 0,
      water: 0,
      tb: 0,
      leprosy: 0,
      cataract: 0,
      deaths: 0,
    };
    rows.forEach((r) => {
      if (!r.hasData) return;
      t.centres += 1;
      t.inspHouses += r.inspHouses;
      t.posHouses += r.posHouses;
      t.inspCont += r.inspCont;
      t.posCont += r.posCont;
      t.water += r.water;
      t.tb += r.tb;
      t.leprosy += r.leprosy;
      t.cataract += r.cataract;
      t.deaths += r.deaths;
    });
    return {
      ...t,
      hi: t.inspHouses > 0 ? Number(((t.posHouses / t.inspHouses) * 100).toFixed(2)) : 0,
      ci: t.inspCont > 0 ? Number(((t.posCont / t.inspCont) * 100).toFixed(2)) : 0,
      bi: t.inspHouses > 0 ? Number(((t.posCont / t.inspHouses) * 100).toFixed(2)) : 0,
    };
  }, [rows]);

  async function exportExcel() {
    const headers = [
      'अ.क्र.', 'उपकेंद्र', 'कर्मचारी', 'HI %', 'CI %', 'BI %', 'धोका पातळी',
      'तपासलेली घरे', 'पाणी नमुने', 'TB', 'कुष्ठ', 'मोतीबिंदू', 'मृत्यू',
    ];
    const body = sorted.map((r, i) => [
      i + 1,
      r.subCentreName,
      r.workerName,
      r.hasData ? r.hi : '—',
      r.hasData ? r.ci : '—',
      r.hasData ? r.bi : '—',
      r.hasData ? r.riskLevel : 'माहिती नाही',
      r.hasData ? r.inspHouses : '—',
      r.hasData ? r.water : '—',
      r.hasData ? r.tb : '—',
      r.hasData ? r.leprosy : '—',
      r.hasData ? r.cataract : '—',
      r.hasData ? r.deaths : '—',
    ]);
    const totalRow = [
      '', 'एकूण (PHC)', `${totals.centres} उपकेंद्रे`,
      totals.hi, totals.ci, totals.bi, '',
      totals.inspHouses, totals.water, totals.tb, totals.leprosy, totals.cataract, totals.deaths,
    ];
    const data = [
      [`PHC तुलनात्मक अहवाल — ${compareMonthLabel(monthKey)} (${phcName})`, ...Array(headers.length - 1).fill('')],
      headers,
      ...body,
      totalRow,
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    ws['!cols'] = headers.map((h, i) => ({ wch: i < 3 ? Math.max(14, h.length + 6) : 12 }));
    const style = (addr: string, s: any) => {
      const cell = ws[addr];
      if (cell) cell.s = s;
    };
    const border = {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } },
    };
    const colLetter = (c: number) => XLSX.utils.encode_col(c);
    for (let c = 0; c < headers.length; c++) {
      style(`${colLetter(c)}1`, {
        font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1A4A72' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      });
      style(`${colLetter(c)}2`, {
        font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '2E6B9E' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border,
      });
    }
    for (let r = 3; r <= data.length; r++) {
      const isTotal = r === data.length;
      for (let c = 0; c < headers.length; c++) {
        style(`${colLetter(c)}${r}`, {
          font: { bold: isTotal, sz: 11 },
          fill: isTotal ? { fgColor: { rgb: 'EFF6FF' } } : undefined,
          alignment: { horizontal: c < 3 ? 'left' : 'center', vertical: 'center' },
          border,
        });
      }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'तुलनात्मक अहवाल');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await saveBlob(blob, `PHC_Tulanatmak_Ahwal_${monthKey}.xlsx`);
  }

  const dash = <span className="text-slate-300">—</span>;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden animate-fade-up">
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-bold text-[#1a4a72] text-sm mr-auto">
          <Table2 className="w-4 h-4" />
          तुलनात्मक अहवाल
        </div>
        {months.length > 0 && (
          <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700">
            <CalendarDays className="w-4 h-4 text-[#1a4a72]" />
            महिना:
            <select
              value={monthKey}
              onChange={(e) => onMonthChange(e.target.value)}
              className="text-xs font-bold text-[#1a4a72] outline-none bg-transparent cursor-pointer"
            >
              {months.map((k) => (
                <option key={k} value={k}>
                  {compareMonthLabel(k)}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={() => void exportExcel()}
          className="pressable inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
        >
          <Download className="w-3.5 h-3.5" />
          Excel डाउनलोड
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[980px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              <Th label="उपकेंद्र" k="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="pl-3" />
              <Th label="HI %" k="hi" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-center" />
              <Th label="CI %" k="ci" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-center" />
              <Th label="BI %" k="bi" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-center" />
              <th className="px-2 py-2.5 font-bold text-slate-600 whitespace-nowrap">धोका पातळी</th>
              <Th label="तपासलेली घरे" k="houses" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-center" />
              <th className="px-2 py-2.5 font-bold text-slate-600 whitespace-nowrap text-center">पाणी नमुने</th>
              <Th label="एकूण रुग्ण" k="patients" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-center" />
              <th className="px-2 py-2.5 font-bold text-slate-600 whitespace-nowrap text-center pr-3">TB / कुष्ठ / मोतीबिंदू / मृत्यू</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                  या महिन्यात कोणत्याही उपकेंद्राचा अहवाल नाही.
                </td>
              </tr>
            )}
            {sorted.map((r) => (
              <tr key={r.userId} className={`border-b border-slate-100 hover:bg-slate-50/70 ${r.hasData ? '' : 'opacity-60'}`}>
                <td className="px-2 py-2.5 pl-3">
                  <div className="font-bold text-[#1a4a72] whitespace-nowrap">{r.subCentreName}</div>
                  <div className="text-[11px] text-slate-400">{r.workerName}</div>
                </td>
                <td className="px-2 py-2.5 text-center font-bold">{r.hasData ? `${r.hi}%` : dash}</td>
                <td className="px-2 py-2.5 text-center font-bold">{r.hasData ? `${r.ci}%` : dash}</td>
                <td className="px-2 py-2.5 text-center font-bold">{r.hasData ? `${r.bi}%` : dash}</td>
                <td className="px-2 py-2.5">
                  {r.hasData ? (
                    <span className={`inline-block text-[11px] font-bold border rounded-full px-2 py-0.5 whitespace-nowrap ${r.riskColor}`}>
                      {r.riskLevel.split(' (')[0]}
                    </span>
                  ) : (
                    dash
                  )}
                </td>
                <td className="px-2 py-2.5 text-center">{r.hasData ? r.inspHouses : dash}</td>
                <td className="px-2 py-2.5 text-center">{r.hasData ? r.water : dash}</td>
                <td className="px-2 py-2.5 text-center font-bold">{r.hasData ? r.patientsTotal : dash}</td>
                <td className="px-2 py-2.5 pr-3 text-center whitespace-nowrap text-slate-600">
                  {r.hasData ? `${r.tb} / ${r.leprosy} / ${r.cataract} / ${r.deaths}` : dash}
                </td>
              </tr>
            ))}
          </tbody>
          {totals.centres > 0 && (
            <tfoot>
              <tr className="bg-blue-50/70 border-t-2 border-[#1a4a72]/20 font-bold">
                <td className="px-2 py-2.5 pl-3 text-[#1a4a72] whitespace-nowrap">
                  एकूण (PHC)
                  <div className="text-[11px] font-normal text-slate-500">{totals.centres} उपकेंद्रे</div>
                </td>
                <td className="px-2 py-2.5 text-center">{totals.hi}%</td>
                <td className="px-2 py-2.5 text-center">{totals.ci}%</td>
                <td className="px-2 py-2.5 text-center">{totals.bi}%</td>
                <td className="px-2 py-2.5" />
                <td className="px-2 py-2.5 text-center">{totals.inspHouses}</td>
                <td className="px-2 py-2.5 text-center">{totals.water}</td>
                <td className="px-2 py-2.5 text-center">{totals.tb + totals.leprosy + totals.cataract + totals.deaths}</td>
                <td className="px-2 py-2.5 pr-3 text-center whitespace-nowrap">
                  {totals.tb} / {totals.leprosy} / {totals.cataract} / {totals.deaths}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="px-3 py-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-bold text-slate-600">धोका पातळी:</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> सुरक्षित
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> मध्यम खबरदारी
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> हाय रिस्क
        </span>
        <span className="ml-auto">शीर्षकावर टॅप करून क्रमवारी बदला</span>
      </div>
    </div>
  );
};
