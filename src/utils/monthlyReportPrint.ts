/**
 * Monthly Report — Print-optimized Marathi PDF via the browser print engine.
 *
 * Why print instead of jsPDF: jsPDF cannot shape Devanagari (conjuncts/matra
 * positioning break), so Marathi either disappears or renders wrong. The
 * browser's print engine shapes Marathi perfectly and "Save as PDF" produces
 * a clean, selectable-text PDF with zero extra dependencies.
 *
 * Layout: every section starts on its own A4 page — no manual arrangement
 * needed by the health worker.
 */
import { Capacitor } from '@capacitor/core';
import { BUILD_ID } from '../generated/version';
import type {
  SubCentreConfig,
  ContainerSurveyData,
  PatientRecord,
  TbPatientRecord,
  LeprosyPatientRecord,
  CataractPatientRecord,
  DeathRecord,
} from '../types';

export interface ReportIndices {
  hi: number;
  ci: number;
  bi: number;
  riskLevel: string;
}

export interface MonthlyReportData {
  config: SubCentreConfig;
  survey: ContainerSurveyData;
  indices: ReportIndices;
  patients: PatientRecord[];
  tbPatients: TbPatientRecord[];
  leprosyPatients: LeprosyPatientRecord[];
  cataractPatients: CataractPatientRecord[];
  deaths: DeathRecord[];
}

/** Devanagari digits for section numbers */
const DEV_NUM = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९', '१०'];
const devNum = (n: number) => (n < DEV_NUM.length ? DEV_NUM[n] : String(n));

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso);
}

function num(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  return esc(v);
}

function emptyRow(cols: number, label = 'या महिन्यात नोंदी उपलब्ध नाहीत.'): string {
  return `<tr><td colspan="${cols}" class="rpt-empty">${label}</td></tr>`;
}

const CSS = `
@page { size: A4 portrait; margin: 11mm 9mm 15mm 9mm; }
/* Linelist pages print landscape so wide tables fit fully */
@page landscape { size: A4 landscape; margin: 10mm 10mm 14mm 10mm; }
.rpt-page.landscape { page: landscape; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: "Noto Sans Devanagari", "Nirmala UI", "Mangal", "Kokila", sans-serif;
  font-size: 10.5px; line-height: 1.45; color: #0f172a;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.rpt-page { page-break-before: always; padding-bottom: 6mm; }
.rpt-page.first { page-break-before: auto; }
/* Slim footer repeated on every printed page */
.rpt-footer {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 8.5px; color: #64748b; border-top: 1px solid #cbd5e1;
  padding: 2mm 0 0 0; background: #fff;
}
.rpt-footer .pg::after { content: "पान " counter(page) " / " counter(pages); }
/* Letterhead */
.rpt-letterhead { text-align: center; border-bottom: 3px double #1a4a72; padding-bottom: 3mm; margin-bottom: 4mm; }
.rpt-letterhead .l1 { font-size: 11px; letter-spacing: 2px; color: #475569; font-weight: 700; }
.rpt-letterhead .l2 { font-size: 17px; font-weight: 800; color: #1a4a72; margin: 1mm 0; }
.rpt-letterhead .l3 { font-size: 13px; font-weight: 700; color: #0f172a; }
.rpt-letterhead .l4 { font-size: 10.5px; color: #334155; margin-top: 1mm; }
/* Page strip header */
.rpt-strip {
  display: flex; justify-content: space-between; align-items: center;
  background: #1a4a72; color: #fff; border-radius: 2mm;
  padding: 2mm 3.5mm; margin-bottom: 3.5mm; font-size: 10px; font-weight: 700;
}
.rpt-strip .s-month { font-weight: 400; opacity: .92; }
/* Section titles */
.rpt-sec { margin: 0 0 4mm 0; }
.rpt-sec-head {
  display: flex; align-items: center; gap: 2.5mm;
  font-size: 12.5px; font-weight: 800; color: #1a4a72;
  border-bottom: 2px solid #1a4a72; padding-bottom: 1.2mm; margin-bottom: 2.5mm;
}
.rpt-sec-no {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 7mm; height: 7mm; border-radius: 50%;
  background: #1a4a72; color: #fff; font-size: 11px; font-weight: 800;
}
/* Info grid */
.rpt-grid { display: table; width: 100%; border-collapse: collapse; margin-bottom: 4mm; }
.rpt-grid .row { display: table-row; }
.rpt-grid .cell {
  display: table-cell; width: 50%; padding: 1.6mm 2.5mm;
  border: 1px solid #cbd5e1; font-size: 10.5px; vertical-align: top;
}
.rpt-grid .cell:nth-child(odd) { background: #f1f5f9; }
.rpt-grid .k { color: #475569; }
.rpt-grid .v { font-weight: 700; color: #0f172a; }
/* Tables */
table.rpt-table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; font-size: 10px; }
table.rpt-table thead { display: table-header-group; }
table.rpt-table tr { page-break-inside: avoid; }
table.rpt-table th {
  background: #1a4a72; color: #fff; font-weight: 700;
  padding: 1.8mm 1.5mm; border: 1px solid #1a4a72; text-align: left; font-size: 9.5px;
}
table.rpt-table td { padding: 1.6mm 1.5mm; border: 1px solid #cbd5e1; vertical-align: top; }
table.rpt-table tbody tr:nth-child(even) td { background: #f8fafc; }
table.rpt-table.amber th { background: #b45309; border-color: #b45309; }
table.rpt-table.red th { background: #991b1b; border-color: #991b1b; }
table.rpt-table.green th { background: #166534; border-color: #166534; }
td.rpt-empty { text-align: center; color: #64748b; padding: 5mm !important; font-style: italic; }
td.c, th.c { text-align: center; }
td.r, th.r { text-align: right; }
td.b { font-weight: 700; }
/* Stat cards row */
.rpt-cards { display: table; width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 2mm 0; margin: 0 -2mm 4mm -2mm; }
.rpt-card {
  display: table-cell; border: 1.5px solid #1a4a72; border-radius: 2mm;
  padding: 2.5mm; text-align: center; vertical-align: middle;
}
.rpt-card .ck { font-size: 9px; color: #475569; margin-bottom: 1mm; }
.rpt-card .cv { font-size: 14px; font-weight: 800; color: #1a4a72; }
.rpt-card .cs { font-size: 8.5px; color: #64748b; margin-top: 1mm; }
.rpt-card.warn { border-color: #b45309; } .rpt-card.warn .cv { color: #b45309; }
.rpt-card.danger { border-color: #991b1b; } .rpt-card.danger .cv { color: #991b1b; }
.rpt-card.ok { border-color: #166534; } .rpt-card.ok .cv { color: #166534; }
.rpt-note {
  border: 1px solid #cbd5e1; border-left: 4px solid #b45309; background: #fffbeb;
  padding: 2.5mm 3mm; border-radius: 0 2mm 2mm 0; margin-bottom: 4mm; font-size: 10px;
}
.rpt-sign { display: table; width: 100%; margin-top: 12mm; }
.rpt-sign .s { display: table-cell; width: 50%; text-align: center; font-size: 10.5px; color: #334155; }
.rpt-sign .line { border-top: 1px solid #0f172a; margin: 14mm 12mm 2mm 12mm; }
.rpt-total { text-align: right; font-weight: 700; color: #1a4a72; margin: -2mm 0 3mm 0; font-size: 10.5px; }
`;

function letterhead(d: MonthlyReportData): string {
  const c = d.config;
  return `
  <div class="rpt-letterhead">
    <div class="l1">महाराष्ट्र शासन &nbsp;•&nbsp; सार्वजनिक आरोग्य विभाग</div>
    <div class="l2">उपकेंद्र मासिक अहवाल - ${esc(c.subCentreName || '—')} - ${esc(c.reportingMonth || '—')}</div>
    <div class="l4">प्राथमिक आरोग्य केंद्र : ${esc(c.phcName || '—')} &nbsp;|&nbsp; आरोग्य सेवक : ${esc(c.workerName || '—')}</div>
  </div>`;
}

function strip(d: MonthlyReportData, title: string): string {
  return `
  <div class="rpt-strip">
    <span>${title}</span>
    <span class="s-month">${esc(d.config.subCentreName || '')} &nbsp;|&nbsp; ${esc(d.config.reportingMonth || '')}</span>
  </div>`;
}

function infoGrid(d: MonthlyReportData): string {
  const c = d.config;
  const s = d.survey;
  const cell = (k: string, v: string) =>
    `<div class="cell"><span class="k">${k} :</span> <span class="v">${v}</span></div>`;
  return `
  <div class="rpt-sec">
    <div class="rpt-sec-head"><span class="rpt-sec-no">${devNum(1)}</span> उपकेंद्राची सर्वसाधारण माहिती</div>
    <div class="rpt-grid">
      <div class="row">${cell('जिल्हा', esc(c.district))}${cell('तालुका', esc(c.taluka))}</div>
      <div class="row">${cell('प्राथमिक आरोग्य केंद्र', esc(c.phcName))}${cell('उपकेंद्र', esc(c.subCentreName))}</div>
      <div class="row">${cell('आरोग्य सेवक', esc(c.workerName))}${cell('पदनाम', esc(c.workerDesignation))}</div>
      <div class="row">${cell('उपकेंद्र लोकसंख्या', num(c.subCentrePopulation))}${cell('एकूण कुटुंबे', num(c.totalHouseholds))}</div>
      <div class="row">${cell('अहवाल महिना', esc(c.reportingMonth))}${cell('अहवाल तयार दिनांक', esc(new Date().toLocaleDateString('en-GB')))}</div>
    </div>
  </div>`;
}

function containerSurveySection(d: MonthlyReportData): string {
  const s = d.survey;
  const i = d.indices;
  const row = (label: string, value: string) =>
    `<tr><td>${label}</td><td class="c b">${value}</td></tr>`;
  return `
  <div class="rpt-sec">
    <div class="rpt-sec-head"><span class="rpt-sec-no">${devNum(2)}</span> कंटेनर सर्वेक्षण (साथरोग नियंत्रण)</div>
    <table class="rpt-table">
      <thead><tr><th>तपशील</th><th class="c" style="width:32%">संख्या</th></tr></thead>
      <tbody>
        ${row('तपासलेली घरे', num(s.inspHouses))}
        ${row('दूषित (पॉझिटिव्ह) घरे', num(s.posHouses))}
        ${row('तपासलेली भांडी / कंटेनर', num(s.inspCont))}
        ${row('दूषित (पॉझिटिव्ह) भांडी / कंटेनर', num(s.posCont))}
        ${row('अबेट (टेमीफॉस) टाकलेली भांडी', num(s.temephosCont))}
        ${row('रिकामी / नष्ट केलेली भांडी', num(s.emptiedCont))}
        ${row('गप्पी मासे सोडलेली ठिकाणे', num(s.guppySites))}
      </tbody>
    </table>
  </div>
  <div class="rpt-sec">
    <div class="rpt-sec-head"><span class="rpt-sec-no">${devNum(3)}</span> कीटक निर्देशांक (NVBDCP मानक)</div>
    <div class="rpt-cards">
      <div class="rpt-card"><div class="ck">हाऊस इंडेक्स (HI)</div><div class="cv">${i.hi.toFixed(1)}%</div><div class="cs">मानक : &lt;१% सुरक्षित</div></div>
      <div class="rpt-card"><div class="ck">कंटेनर इंडेक्स (CI)</div><div class="cv">${i.ci.toFixed(1)}%</div><div class="cs">मानक : &lt;२% सुरक्षित</div></div>
      <div class="rpt-card"><div class="ck">ब्रिटो इंडेक्स (BI)</div><div class="cv">${i.bi.toFixed(1)}</div><div class="cs">मानक : &lt;५ सुरक्षित</div></div>
    </div>
    <div class="rpt-note"><b>साथरोग जोखीम पातळी :</b> ${esc(i.riskLevel)}</div>
  </div>`;
}

function waterProgramSection(d: MonthlyReportData): string {
  const s = d.survey;
  const wrow = (label: string, status: string, count: string) =>
    `<tr><td>${label}</td><td class="c">${status}</td><td class="c b">${count}</td></tr>`;
  const prow = (label: string, value: string) =>
    `<tr><td>${label}</td><td class="c b">${value}</td></tr>`;
  return `
  <div class="rpt-sec">
    <div class="rpt-sec-head"><span class="rpt-sec-no">${devNum(4)}</span> पाणी गुणवत्ता, मीठ तपासणी व TCL क्लोरीनेशन</div>
    <table class="rpt-table green">
      <thead><tr><th>तपासणी</th><th class="c">केली का?</th><th class="c">नमुने / वापर</th></tr></thead>
      <tbody>
        ${wrow('पाणी जैविक तपासणी (Bacteriological)', esc(s.waterBioSentStatus), num(s.waterBioSent) + ' नमुने')}
        ${wrow('पाणी रासायनिक तपासणी (Chemical)', esc(s.waterChemSentStatus), num(s.waterChemSent) + ' नमुने')}
        ${wrow('मीठ नमुना तपासणी (आयोडीन)', esc(s.saltSampleSentStatus), num(s.saltSampleSent) + ' नमुने')}
        ${wrow('TCL पावडर वापर (क्लोरीनेशन)', '—', num(s.tclUsedKg) + ' किलो')}
        ${wrow('क्लोरीन OT चाचणी', '—', num(s.chlorineTests) + ' चाचण्या')}
      </tbody>
    </table>
    <div class="rpt-note">मिठातील आयोडीनचे प्रमाण मानक निकषांप्रमाणे तपासले जावे.</div>
  </div>
  <div class="rpt-sec">
    <div class="rpt-sec-head"><span class="rpt-sec-no">${devNum(5)}</span> राष्ट्रीय आरोग्य कार्यक्रम सांख्यिकी</div>
    <table class="rpt-table amber">
      <thead><tr><th>कार्यक्रम / तपशील</th><th class="c" style="width:32%">संख्या</th></tr></thead>
      <tbody>
        ${prow('क्षयरोग — एकूण रुग्ण (NTEP)', num(s.tbTotal))}
        ${prow('क्षयरोग — संशयित रुग्ण', num(s.tbSuspected))}
        ${prow('क्षयरोग — उपचाराखालील (DOTS)', num(s.tbUnderTreatment))}
        ${prow('कुष्ठरोग — संशयित रुग्ण (NLEP)', num(s.leprosySuspected))}
        ${prow('कुष्ठरोग — उपचाराखालील', num(s.leprosyUnderTreatment))}
        ${prow('मोतीबिंदू — संशयित रुग्ण (NPCB)', num(s.cataractSuspected))}
        ${prow('मोतीबिंदू — शस्त्रक्रिया झालेले', num(s.cataractOperated))}
        ${prow('गावात झालेली एकूण लग्ने', num(s.villageMarriages))}
        ${prow('घेतलेले एकूण रक्तनमुने', num(s.bloodSamplesTaken))}
      </tbody>
    </table>
    ${s.notes ? `<div class="rpt-note"><b>शेरा :</b> ${esc(s.notes)}</div>` : ''}
  </div>`;
}

function patientLinelistPage(d: MonthlyReportData): string {
  const rows = d.patients
    .map(
      (p, idx) => `<tr>
      <td class="c">${idx + 1}</td>
      <td class="c">${esc(fmtDate(p.date))}</td>
      <td class="b">${esc(p.name)}</td>
      <td class="c">${num(p.age)}</td>
      <td class="c">${esc(p.gender)}</td>
      <td>${esc(p.village)}</td>
      <td>${esc(p.suspectedDisease)}</td>
      <td class="c">${esc(p.tclStatus)}</td>
      <td>${esc(p.treatment || '—')}</td>
      <td class="c">${esc(p.status)}</td>
    </tr>`
    )
    .join('');
  return `
  <div class="rpt-sec">
    <div class="rpt-sec-head"><span class="rpt-sec-no">${devNum(6)}</span> जलजन्य व साथरोग रुग्ण लाईनलिस्ट</div>
    <div class="rpt-total">एकूण रुग्ण नोंदी : ${d.patients.length}</div>
    <table class="rpt-table">
      <thead><tr>
        <th class="c">अ.क्र.</th><th class="c">दिनांक</th><th>रुग्णाचे नाव</th>
        <th class="c">वय</th><th class="c">लिंग</th><th>गाव / वस्ती</th>
        <th>संशयित आजार</th><th class="c">TCL</th><th>उपचार</th><th class="c">स्थिती</th>
      </tr></thead>
      <tbody>${rows || emptyRow(10)}</tbody>
    </table>
  </div>`;
}

function tbLinelistPage(d: MonthlyReportData): string {
  const rows = d.tbPatients
    .map(
      (p, idx) => `<tr>
      <td class="c">${idx + 1}</td>
      <td class="c">${esc(p.regNo || '—')}</td>
      <td class="c">${esc(fmtDate(p.date))}</td>
      <td class="b">${esc(p.name)}</td>
      <td class="c">${num(p.age)}</td>
      <td class="c">${esc(p.gender)}</td>
      <td>${esc(p.village)}</td>
      <td>${esc(p.tbType)}</td>
      <td>${esc(p.category)}</td>
      <td>${esc(p.dotsProvider || '—')}</td>
    </tr>`
    )
    .join('');
  return `
  <div class="rpt-sec">
    <div class="rpt-sec-head"><span class="rpt-sec-no">${devNum(7)}</span> क्षयरुग्ण लाईनलिस्ट (NTEP)</div>
    <div class="rpt-total">एकूण नोंदी : ${d.tbPatients.length}</div>
    <table class="rpt-table">
      <thead><tr>
        <th class="c">अ.क्र.</th><th class="c">नोंदणी क्र.</th><th class="c">दिनांक</th>
        <th>रुग्णाचे नाव</th><th class="c">वय</th><th class="c">लिंग</th>
        <th>गाव</th><th>TB प्रकार</th><th>स्थिती</th><th>डॉट्स प्रदाता</th>
      </tr></thead>
      <tbody>${rows || emptyRow(10)}</tbody>
    </table>
  </div>`;
}

function leprosyLinelistPage(d: MonthlyReportData): string {
  const rows = d.leprosyPatients
    .map(
      (p, idx) => `<tr>
      <td class="c">${idx + 1}</td>
      <td class="c">${esc(p.regNo || '—')}</td>
      <td class="c">${esc(fmtDate(p.date))}</td>
      <td class="b">${esc(p.name)}</td>
      <td class="c">${num(p.age)}</td>
      <td class="c">${esc(p.gender)}</td>
      <td>${esc(p.village)}</td>
      <td class="c">${esc(p.leprosyType)}</td>
      <td>${esc(p.category)}</td>
      <td class="c">${num(p.lesionsCount)}</td>
      <td>${esc(p.lesionLocation || '—')}</td>
      <td class="c">${esc(p.deformityGrade)}</td>
    </tr>`
    )
    .join('');
  return `
  <div class="rpt-sec">
    <div class="rpt-sec-head"><span class="rpt-sec-no">${devNum(8)}</span> कुष्ठरुग्ण लाईनलिस्ट (NLEP)</div>
    <div class="rpt-total">एकूण नोंदी : ${d.leprosyPatients.length}</div>
    <table class="rpt-table">
      <thead><tr>
        <th class="c">अ.क्र.</th><th class="c">नोंदणी क्र.</th><th class="c">दिनांक</th>
        <th>रुग्णाचे नाव</th><th class="c">वय</th><th class="c">लिंग</th>
        <th>गाव</th><th class="c">प्रकार</th><th>स्थिती</th>
        <th class="c">चट्टे</th><th>चट्टा कोठे आहे</th><th class="c">व्यंग प्रत</th>
      </tr></thead>
      <tbody>${rows || emptyRow(12)}</tbody>
    </table>
  </div>`;
}

function cataractLinelistPage(d: MonthlyReportData): string {
  const rows = d.cataractPatients
    .map(
      (p, idx) => `<tr>
      <td class="c">${idx + 1}</td>
      <td class="c">${esc(p.regNo || '—')}</td>
      <td class="c">${esc(fmtDate(p.date))}</td>
      <td class="b">${esc(p.name)}</td>
      <td class="c">${num(p.age)}</td>
      <td class="c">${esc(p.gender)}</td>
      <td>${esc(p.village)}</td>
      <td class="c">${esc(p.affectedEye)}</td>
      <td class="c">${esc(p.visualAcuity || '—')}</td>
      <td>${esc(p.surgeryStatus)}</td>
      <td>${esc(p.hospitalName || '—')}</td>
    </tr>`
    )
    .join('');
  return `
  <div class="rpt-sec">
    <div class="rpt-sec-head"><span class="rpt-sec-no">${devNum(9)}</span> मोतीबिंदू रुग्ण लाईनलिस्ट (NPCB)</div>
    <div class="rpt-total">एकूण नोंदी : ${d.cataractPatients.length}</div>
    <table class="rpt-table">
      <thead><tr>
        <th class="c">अ.क्र.</th><th class="c">नोंदणी क्र.</th><th class="c">दिनांक</th>
        <th>रुग्णाचे नाव</th><th class="c">वय</th><th class="c">लिंग</th>
        <th>गाव</th><th class="c">बाधित डोळा</th><th class="c">दृष्टी</th>
        <th>शस्त्रक्रिया स्थिती</th><th>रुग्णालय</th>
      </tr></thead>
      <tbody>${rows || emptyRow(11)}</tbody>
    </table>
  </div>`;
}

function deathPage(d: MonthlyReportData): string {
  const rows = d.deaths
    .map(
      (r, idx) => `<tr>
      <td class="c">${idx + 1}</td>
      <td class="c">${esc(fmtDate(r.date))}</td>
      <td class="b">${esc(r.name)}</td>
      <td class="c">${num(r.age)}</td>
      <td class="c">${esc(r.gender)}</td>
      <td>${esc(r.village)}</td>
      <td class="c">${esc(r.place)}</td>
      <td>${esc(r.deathPlace)}</td>
      <td>${esc(r.cause)}</td>
      <td>${esc(r.remarks || '—')}</td>
    </tr>`
    )
    .join('');
  return `
  <div class="rpt-sec">
    <div class="rpt-sec-head"><span class="rpt-sec-no">${devNum(10)}</span> मृत्यू नोंदणी</div>
    <div class="rpt-total">एकूण मृत्यू नोंदी : ${d.deaths.length}</div>
    <table class="rpt-table red">
      <thead><tr>
        <th class="c">अ.क्र.</th><th class="c">मृत्यू दिनांक</th><th>मृत व्यक्तीचे नाव</th>
        <th class="c">वय</th><th class="c">लिंग</th><th>गाव / वस्ती</th>
        <th class="c">गावात / बाहेर</th><th>मृत्यूचे ठिकाण</th><th>मृत्यूचे कारण</th><th>शेरा</th>
      </tr></thead>
      <tbody>${rows || emptyRow(10)}</tbody>
    </table>
  </div>
  <div class="rpt-sign">
    <div class="s"><div class="line"></div>आरोग्य सेवक (सही व शिक्का)<br/>${esc(d.config.workerName || '')}</div>
    <div class="s"><div class="line"></div>वैद्यकीय अधिकारी, ${esc(d.config.phcName || 'प्रा.आ.केंद्र')}</div>
  </div>`;
}

/** Build the complete standalone print HTML document (Marathi, A4). */
export function buildMonthlyReportHTML(d: MonthlyReportData): string {
  const title = `उपकेंद्र मासिक अहवाल - ${d.config.subCentreName || ''} - ${d.config.reportingMonth || ''}`;
  return `<!DOCTYPE html>
<html lang="mr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="rpt-footer"><span>आरोग्य सेवक — स्मार्ट रिपोर्टिंग &nbsp;|&nbsp; तयार केल्याची तारीख : ${esc(new Date().toLocaleDateString('en-GB'))} &nbsp;|&nbsp; आवृत्ती : ${esc(BUILD_ID)}</span><span class="pg"></span></div>

<section class="rpt-page first">
  ${letterhead(d)}
  ${infoGrid(d)}
  ${containerSurveySection(d)}
</section>

<section class="rpt-page">
  ${strip(d, 'पाणी, मीठ, TCL व राष्ट्रीय कार्यक्रम सांख्यिकी')}
  ${waterProgramSection(d)}
</section>

<section class="rpt-page landscape">
  ${strip(d, 'जलजन्य व साथरोग रुग्ण लाईनलिस्ट')}
  ${patientLinelistPage(d)}
</section>

<section class="rpt-page landscape">
  ${strip(d, 'क्षयरुग्ण लाईनलिस्ट (NTEP)')}
  ${tbLinelistPage(d)}
</section>

<section class="rpt-page landscape">
  ${strip(d, 'कुष्ठरुग्ण लाईनलिस्ट (NLEP)')}
  ${leprosyLinelistPage(d)}
</section>

<section class="rpt-page landscape">
  ${strip(d, 'मोतीबिंदू रुग्ण लाईनलिस्ट (NPCB)')}
  ${cataractLinelistPage(d)}
</section>

<section class="rpt-page landscape">
  ${strip(d, 'मृत्यू नोंदणी')}
  ${deathPage(d)}
</section>

</body>
</html>`;
}

/**
 * Open the report in a hidden iframe and trigger the system print dialog.
 * On Android Chrome the dialog offers "Save as PDF" — the PDF has perfect
 * Marathi (shaped by the browser engine) with selectable text.
 */
export async function printMonthlyReport(d: MonthlyReportData): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    // Native shell: hand the HTML to the platform print plugin.
    const { registerPlugin } = await import('@capacitor/core');
    const NativePrint = registerPlugin<{ print(opts: { html: string; jobName: string }): Promise<void> }>('Print');
    await NativePrint.print({
      html: buildMonthlyReportHTML(d),
      jobName: `Arogya_Sevak_Ahwal_${d.config.reportingMonth || 'Report'}`,
    });
    return;
  }

  const html = buildMonthlyReportHTML(d);
  // Off-screen but fully laid-out at real A4 size: printing a 0x0/hidden
  // iframe is unreliable on some mobile browsers (clipped pagination).
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'मासिक अहवाल प्रिंट');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  try {
    const iwin = iframe.contentWindow;
    if (!iwin) throw new Error('print iframe unavailable');
    iwin.document.open();
    iwin.document.write(html);
    iwin.document.close();
    // Let the iframe render + fonts settle (same hardening as the NTEP form).
    await new Promise((r) => setTimeout(r, 400));
    await new Promise((r) => iwin.requestAnimationFrame(() => iwin.requestAnimationFrame(r)));
    iwin.focus();
    iwin.print();
  } finally {
    // Give the print dialog time to capture the document before cleanup.
    setTimeout(() => iframe.remove(), 3000);
  }
}
