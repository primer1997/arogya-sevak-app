import * as XLSX from 'xlsx-js-style';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const NativePrint = registerPlugin<{
  print(options: { html: string; jobName?: string }): Promise<void>;
}>('Print');

/**
 * Print the on-screen report on a real Android device.
 * window.print() is a no-op inside the app's WebView, so the report HTML
 * (with all app CSS inlined) is handed to a native plugin that opens
 * Android's system print dialog.
 */
function buildPrintableHtml(): string {
  const el = document.getElementById('printable-report');
  if (!el) throw new Error('printable-report element not found');
  let css = '';
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) css += rule.cssText + '\n';
    } catch {
      /* cross-origin stylesheet — skip */
    }
  }
  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=794">' +
    `<style>${css}</style></head><body>${el.outerHTML}</body></html>`
  );
}

export async function nativePrintReport(jobName: string): Promise<void> {
  await NativePrint.print({ html: buildPrintableHtml(), jobName });
}
import {
  SubCentreConfig,
  ContainerSurveyData,
  PatientRecord,
  TbPatientRecord,
  LeprosyPatientRecord,
  CataractPatientRecord,
  DeathRecord,
} from '../types';

export function calculateIndices(survey: ContainerSurveyData) {
  const { inspHouses, posHouses, inspCont, posCont } = survey;
  const hi = inspHouses > 0 ? (posHouses / inspHouses) * 100 : 0;
  const ci = inspCont > 0 ? (posCont / inspCont) * 100 : 0;
  const bi = inspHouses > 0 ? (posCont / inspHouses) * 100 : 0;

  let riskLevel: 'सुरक्षित (Safe)' | 'मध्यम खबरदारी (Moderate)' | 'अतिसंवेदनशील / हाय रिस्क (High Risk)' = 'सुरक्षित (Safe)';
  let riskColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';

  if (hi > 5 || bi > 20 || ci > 10) {
    riskLevel = 'अतिसंवेदनशील / हाय रिस्क (High Risk)';
    riskColor = 'text-red-700 bg-red-50 border-red-300';
  } else if (hi >= 1 || bi >= 5 || ci >= 2) {
    riskLevel = 'मध्यम खबरदारी (Moderate)';
    riskColor = 'text-amber-700 bg-amber-50 border-amber-300';
  }

  return {
    hi: Number(hi.toFixed(2)),
    ci: Number(ci.toFixed(2)),
    bi: Number(bi.toFixed(2)),
    riskLevel,
    riskColor,
  };
}

/**
 * Save a generated file so it actually works everywhere:
 * - Inside the installed Android app: writes the file to Documents and opens
 *   the system share sheet (worker can save to Downloads or send via WhatsApp).
 * - In a browser / PWA: normal anchor download.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function saveBlob(blob: Blob, fileName: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);
    const saved = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Documents,
    });
    await Share.share({
      title: fileName,
      text: fileName,
      url: saved.uri,
      dialogTitle: 'अहवाल सेव्ह / शेअर करा',
    });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Utility to calculate column widths based on cell content length
 */
function autoFitColumns(
  data: (string | number | boolean | null | undefined)[][],
  minWidth = 12,
  maxWidth = 55
): { wch: number }[] {
  const colWidths: number[] = [];
  data.forEach((row) => {
    row.forEach((cell, colIdx) => {
      if (cell === null || cell === undefined) return;
      const str = String(cell);
      // Marathi or wide characters often display broader than ASCII
      const visualLen = str.length + 3;
      colWidths[colIdx] = Math.max(colWidths[colIdx] || minWidth, visualLen);
    });
  });
  return colWidths.map((w) => ({ wch: Math.min(Math.max(w, minWidth), maxWidth) }));
}

// -------------------------------------------------------------
// Excel Styling Helpers & Palettes (Government Executive Theme)
// -------------------------------------------------------------
const BORDER_THIN = {
  top: { style: 'thin', color: { rgb: 'CBD5E1' } },
  bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
  left: { style: 'thin', color: { rgb: 'CBD5E1' } },
  right: { style: 'thin', color: { rgb: 'CBD5E1' } },
};

const BORDER_HEADER = {
  top: { style: 'medium', color: { rgb: '0F2B48' } },
  bottom: { style: 'medium', color: { rgb: '0F2B48' } },
  left: { style: 'thin', color: { rgb: 'CBD5E1' } },
  right: { style: 'thin', color: { rgb: 'CBD5E1' } },
};

function styleCell(ws: any, r: number, c: number, style: any) {
  const addr = XLSX.utils.encode_cell({ r, c });
  if (!ws[addr]) {
    ws[addr] = { t: 's', v: '' };
  }
  ws[addr].s = style;
}

function styleRange(
  ws: any,
  startR: number,
  startC: number,
  endR: number,
  endC: number,
  style: any
) {
  for (let r = startR; r <= endR; r++) {
    for (let c = startC; c <= endC; c++) {
      styleCell(ws, r, c, style);
    }
  }
}

const TITLE_BANNER_STYLE = (bgColor = '1A4A72') => ({
  font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
  fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: BORDER_THIN,
});

const SUBTITLE_BANNER_STYLE = (bgColor = '285B88') => ({
  font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
  fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: BORDER_THIN,
});

const META_BANNER_STYLE = {
  font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1E293B' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'E2E8F0' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: BORDER_THIN,
};

const SECTION_HEADER_STYLE = (bgColor = '1E3A8A') => ({
  font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
  fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
  alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
  border: BORDER_THIN,
});

const TABLE_HEADER_STYLE = (bgColor = '1F497D') => ({
  font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
  fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_HEADER,
});

const KEY_CELL_STYLE = {
  font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1E293B' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'F1F5F9' } },
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
  border: BORDER_THIN,
};

const DATA_CELL_STYLE = (
  isEven: boolean,
  align: 'left' | 'center' | 'right' = 'left',
  bold = false,
  customFg?: string,
  customFontColor?: string
) => ({
  font: {
    name: 'Calibri',
    sz: 10,
    bold,
    color: { rgb: customFontColor || '0F172A' },
  },
  fill: {
    patternType: 'solid',
    fgColor: { rgb: customFg || (isEven ? 'FFFFFF' : 'F8FAFC') },
  },
  alignment: { horizontal: align, vertical: 'center', wrapText: true },
  border: BORDER_THIN,
});

const SIGNATURE_CELL_STYLE = (align: 'left' | 'center' = 'center') => ({
  font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1E293B' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } },
  alignment: { horizontal: align, vertical: 'center', wrapText: true },
  border: BORDER_THIN,
});

export async function exportToExcel(
  config: SubCentreConfig,
  survey: ContainerSurveyData,
  patients: PatientRecord[],
  tbPatients: TbPatientRecord[] = [],
  leprosyPatients: LeprosyPatientRecord[] = [],
  cataractPatients: CataractPatientRecord[] = [],
  deaths: DeathRecord[] = []
  ) {
  const wb = XLSX.utils.book_new();
  const indices = calculateIndices(survey);

  const choleraCases = patients.filter((p) => p.suspectedDisease === 'कॉलरा').length;
  const gastroCases = patients.filter((p) => p.suspectedDisease === 'गॅस्ट्रो').length;
  const diarrheaCases = patients.filter((p) => p.suspectedDisease === 'अतिसार').length;
  const dysenteryCases = patients.filter((p) => p.suspectedDisease === 'हगवण').length;
  const encephalitisCases = patients.filter((p) => p.suspectedDisease === 'मेंदुज्वर').length;
  const jointPainCases = patients.filter((p) => p.suspectedDisease === 'सांधेदुखी').length;
  const malariaCases = patients.filter((p) => p.suspectedDisease === 'मलेरिया').length;
  const dengueCases = patients.filter((p) => p.suspectedDisease === 'डेंग्यू').length;
  const tclDone = patients.filter((p) => p.tclStatus === 'होय').length;
  const referred = patients.filter((p) => p.referred).length;

  // =========================================================================
  // Sheet 1: उपकेंद्र मासिक प्रगती अहवाल (Executive Summary Dashboard)
  // =========================================================================
  const surveySheetData: (string | number)[][] = [
    ['महाराष्ट्र शासन - सार्वजनिक आरोग्य विभाग | उपकेंद्र मासिक प्रगती अहवाल', '', '', ''],
    [`उपकेंद्र मासिक एकात्मिक आरोग्य प्रगती अहवाल - माहे: ${config.reportingMonth}`, '', '', ''],
    [
      `उपकेंद्र: ${config.subCentreName} | प्रा.आ.केंद्र: ${config.phcName} | तालुका: ${config.taluka} | जिल्हा: ${config.district} | अहवाल दिनांक: ${new Date().toLocaleDateString('mr-IN')}`,
      '',
      '',
      '',
    ],
    ['', '', '', ''],
    ['१. उपकेंद्र मूलभूत माहिती व मनुष्यबळ', '', '', ''],
    ['जिल्हा व तालुका', `${config.district} / ${config.taluka}`, 'उपकेंद्राचे नाव', config.subCentreName],
    ['प्राथमिक आरोग्य केंद्र (PHC)', config.phcName, 'अहवाल महिना', config.reportingMonth],
    ['आरोग्य सेवक / सेविकेचे नाव', config.workerName, 'पदनाम', config.workerDesignation],
    ['उपकेंद्र एकूण लोकसंख्या', config.subCentrePopulation, 'एकूण कुटुंबे (Households)', config.totalHouseholds],
    ['', '', '', ''],
    ['२. डास आळी / कंटेनर सर्वेक्षण निर्देशांक (NVBDCP Vector Indices)', '', '', ''],
    ['तपासणी तपशील (Survey Parameter)', 'संख्या / प्रमाण', 'निर्देशांक प्रकार (Index)', 'टक्केवारी व शेरा'],
    ['तपासलेली घरे (Inspected Houses)', survey.inspHouses, 'हाऊस इंडेक्स - HI (%)', `${indices.hi}% (${indices.hi > 5 ? 'धोकादायक' : 'सुरक्षित'})`],
    ['दूषित घरे आढळली (Positive Houses)', survey.posHouses, 'कंटेनर इंडेक्स - CI (%)', `${indices.ci}% (${indices.ci > 10 ? 'धोकादायक' : 'सुरक्षित'})`],
    ['तपासलेली भांडी (Inspected Containers)', survey.inspCont, 'ब्रेटू इंडेक्स - BI', `${indices.bi} (${indices.bi > 20 ? 'धोकादायक' : 'सुरक्षित'})`],
    ['दूषित भांडी आढळली (Positive Containers)', survey.posCont, 'एकूण जोखीम श्रेणी (Overall Risk)', indices.riskLevel],
    ['अबेट / टेमीफॉस टाकलेली भांडी', survey.temephosCont, 'रिकामी / उलटी केलेली भांडी', survey.emptiedCont],
    ['गप्पी मासे सोडलेली ठिकाणे', survey.guppySites, 'कोरडा दिवस / धुरळणी घरे', `${survey.dryDayHouses || 0} घरे / ${survey.foggingHouses || 0} घरे`],
    ['', '', '', ''],
    ['३. पाणी गुणवत्ता, मीठ नमुने व TCL निर्जंतुकीकरण सनियंत्रण', '', '', ''],
    ['चाचणी तपशील (Water Surveillance)', 'संख्या / नमुने', 'स्थिती / शेरा', 'मानक निष्कर्ष'],
    ['पाणी जैविक तपासणी (Biological)', `${survey.waterBioSent} नमुने`, survey.waterBioSentStatus, 'प्रयोगशाळा अहवाल प्रलंबित/प्राप्त'],
    ['पाणी रासायनिक तपासणी (Chemical)', `${survey.waterChemSent} नमुने`, survey.waterChemSentStatus, 'प्रयोगशाळेत तपासणीसाठी पाठवले'],
    ['मीठ आयोडीन नमुना तपासणी (Salt Testing)', `${survey.saltSampleSent} नमुने`, survey.saltSampleSentStatus, 'किचन व लॅब तपासणी'],
    ['टी.सी.एल. पावडर वापर (TCL Usage)', `${survey.tclUsedKg} किलो`, 'विहिरी व साठे क्लोरीनेशन', 'नियमित निर्जंतुकीकरण'],
    ['क्लोरीन ओटी चाचण्या (OT Tests)', `${survey.chlorineTests} चाचण्या`, 'पाणी शुद्धीकरण तपासणी', 'योग्य आढळले'],
    ['', '', '', ''],
    ['४. जलजन्य, सांधेदुखी व साथरोग रुग्ण सर्वेक्षण सारांश', '', '', ''],
    ['संशयित आजार प्रकार (Disease)', 'नोंदणी रुग्ण संख्या', 'TCL क्लोरीनेशन परिसर', 'सद्यस्थिती व शेरा'],
    ['कॉलरा (Cholera)', choleraCases, choleraCases > 0 ? 'तात्काळ TCL केले' : 'निरंक', choleraCases > 0 ? 'अतिदक्षता नियंत्रण' : 'निरंक'],
    ['गॅस्ट्रो (Gastro)', gastroCases, gastroCases > 0 ? 'TCL केले' : 'निरंक', gastroCases > 0 ? 'उपचार सुरू' : 'निरंक'],
    ['अतिसार (Diarrhea)', diarrheaCases, diarrheaCases > 0 ? 'TCL केले' : 'निरंक', diarrheaCases > 0 ? 'उपचार सुरू' : 'निरंक'],
    ['हगवण (Dysentery)', dysenteryCases, dysenteryCases > 0 ? 'TCL केले' : 'निरंक', dysenteryCases > 0 ? 'उपचार सुरू' : 'निरंक'],
    ['मेंदुज्वर (Encephalitis)', encephalitisCases, encephalitisCases > 0 ? 'TCL केले' : 'निरंक', encephalitisCases > 0 ? 'तात्काळ संदर्भ' : 'निरंक'],
    ['सांधेदुखी (Joint Pain)', jointPainCases, jointPainCases > 0 ? 'TCL केले' : 'निरंक', jointPainCases > 0 ? 'उपचार सुरू' : 'निरंक'],
    ['मलेरिया व डेंग्यू (Malaria / Dengue)', `${malariaCases} / ${dengueCases}`, 'रक्त नमुने तपासणी', 'कीटक नियंत्रण सुरू'],
    ['एकूण नोंदवलेले संशयित रुग्ण', patients.length, `एकूण TCL परिसर: ${tclDone}`, `प्रा.आ.के. संदर्भ (Referred): ${referred}`],
    ['', '', '', ''],
    ['५. राष्ट्रीय आरोग्य कार्यक्रम आकडेवारी (NTEP, NLEP, NPCB)', '', '', ''],
    ['कार्यक्रम नाव', 'संशयित रुग्ण', 'उपचाराखालील / शस्त्रक्रिया', 'तपशीलवार लाईनलिस्ट पत्रक'],
    ['क्षयरोग निर्मूलन (TB - NTEP)', survey.tbSuspected, `उपचाराखालील: ${survey.tbUnderTreatment}`, 'पहा पत्रक: ३_क्षयरुग्ण_लाईनलिस्ट'],
    ['कुष्ठरोग निर्मूलन (Leprosy - NLEP)', survey.leprosySuspected, `उपचाराखालील: ${survey.leprosyUnderTreatment}`, 'पहा पत्रक: ४_कुष्ठरुग्ण_लाईनलिस्ट'],
    ['अंधत्व नियंत्रण (Cataract - NPCB)', survey.cataractSuspected, `शस्त्रक्रिया पूर्ण: ${survey.cataractOperated}`, 'पहा पत्रक: ५_मोतीबिंदू_लाईनलिस्ट'],
    ['गावातील सामाजिक आकडेवारी', survey.villageMarriages, 'गावात झालेली एकूण लग्ने', 'नवीन नोंद'],
    ['रक्त तपासणी आकडेवारी', survey.bloodSamplesTaken, 'एकूण घेतलेले रक्तनमुने', 'नवीन नोंद'],
    ['', '', '', ''],
    ['अहवाल सादरकर्ता (आरोग्य सेवक / सेविका)', '', 'तपासणी व पडताळणी (वैद्यकीय अधिकारी)', ''],
    [`${config.workerName} (${config.workerDesignation})`, '', 'वैद्यकीय अधिकारी (MBBS / BAMS)', ''],
    [`आरोग्य उपकेंद्र ${config.subCentreName}, प्रा.आ.के. ${config.phcName}`, '', `प्राथमिक आरोग्य केंद्र ${config.phcName}, ता. ${config.taluka}`, ''],
  ];

  const wsSurvey = XLSX.utils.aoa_to_sheet(surveySheetData);
  wsSurvey['!cols'] = [{ wch: 40 }, { wch: 28 }, { wch: 40 }, { wch: 32 }];
  wsSurvey['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
    { s: { r: 10, c: 0 }, e: { r: 10, c: 3 } },
    { s: { r: 19, c: 0 }, e: { r: 19, c: 3 } },
    { s: { r: 27, c: 0 }, e: { r: 27, c: 3 } },
    { s: { r: 38, c: 0 }, e: { r: 38, c: 3 } },
    // Signatures
    { s: { r: 44, c: 0 }, e: { r: 44, c: 1 } },
    { s: { r: 44, c: 2 }, e: { r: 44, c: 3 } },
    { s: { r: 45, c: 0 }, e: { r: 45, c: 1 } },
    { s: { r: 45, c: 2 }, e: { r: 45, c: 3 } },
    { s: { r: 46, c: 0 }, e: { r: 46, c: 1 } },
    { s: { r: 46, c: 2 }, e: { r: 46, c: 3 } },
  ];

  // Set Row Heights for Summary Sheet
  const surveyRowHeights: { hpt: number }[] = [];
  surveySheetData.forEach((_, idx) => {
    if (idx === 0) surveyRowHeights.push({ hpt: 30 });
    else if (idx === 1) surveyRowHeights.push({ hpt: 22 });
    else if (idx === 2) surveyRowHeights.push({ hpt: 20 });
    else if ([3, 9, 18, 26, 37, 43].includes(idx)) surveyRowHeights.push({ hpt: 8 });
    else if ([4, 10, 19, 27, 38].includes(idx)) surveyRowHeights.push({ hpt: 22 });
    else if ([11, 20, 28, 39].includes(idx)) surveyRowHeights.push({ hpt: 24 });
    else if ([44, 45, 46].includes(idx)) surveyRowHeights.push({ hpt: 22 });
    else surveyRowHeights.push({ hpt: 20 });
  });
  wsSurvey['!rows'] = surveyRowHeights;

  // Apply Styling to Sheet 1 Cells
  // Row 0: Title Banner
  styleRange(wsSurvey, 0, 0, 0, 3, TITLE_BANNER_STYLE('1A4A72'));
  // Row 1: Subtitle
  styleRange(wsSurvey, 1, 0, 1, 3, SUBTITLE_BANNER_STYLE('285B88'));
  // Row 2: Meta Bar
  styleRange(wsSurvey, 2, 0, 2, 3, META_BANNER_STYLE);

  // Section 1: SubCentre Info
  styleRange(wsSurvey, 4, 0, 4, 3, SECTION_HEADER_STYLE('334155'));
  for (let r = 5; r <= 8; r++) {
    styleCell(wsSurvey, r, 0, KEY_CELL_STYLE);
    styleCell(wsSurvey, r, 1, DATA_CELL_STYLE(false, 'left', true));
    styleCell(wsSurvey, r, 2, KEY_CELL_STYLE);
    styleCell(wsSurvey, r, 3, DATA_CELL_STYLE(false, 'left', true));
  }

  // Section 2: Vector Survey
  styleRange(wsSurvey, 10, 0, 10, 3, SECTION_HEADER_STYLE('1E3A8A'));
  for (let c = 0; c < 4; c++) {
    styleCell(wsSurvey, 11, c, TABLE_HEADER_STYLE('2563EB'));
  }
  for (let r = 12; r <= 17; r++) {
    const isEven = r % 2 === 0;
    styleCell(wsSurvey, r, 0, DATA_CELL_STYLE(isEven, 'left'));
    styleCell(wsSurvey, r, 1, DATA_CELL_STYLE(isEven, 'center', true));
    styleCell(wsSurvey, r, 2, DATA_CELL_STYLE(isEven, 'left', true));
    if (r === 15) {
      // Risk level cell
      const isHigh = indices.riskLevel.includes('High') || indices.riskLevel.includes('अतिसंवेदनशील');
      const isMod = indices.riskLevel.includes('Moderate') || indices.riskLevel.includes('मध्यम');
      const bg = isHigh ? 'FEE2E2' : isMod ? 'FEF3C7' : 'D1FAE5';
      const fontColor = isHigh ? '991B1B' : isMod ? '92400E' : '065F46';
      styleCell(wsSurvey, r, 3, DATA_CELL_STYLE(false, 'center', true, bg, fontColor));
    } else {
      styleCell(wsSurvey, r, 3, DATA_CELL_STYLE(isEven, 'center', true));
    }
  }

  // Section 3: Water Surveillance
  styleRange(wsSurvey, 19, 0, 19, 3, SECTION_HEADER_STYLE('065F46'));
  for (let c = 0; c < 4; c++) {
    styleCell(wsSurvey, 20, c, TABLE_HEADER_STYLE('047857'));
  }
  for (let r = 21; r <= 25; r++) {
    const isEven = r % 2 === 0;
    styleCell(wsSurvey, r, 0, DATA_CELL_STYLE(isEven, 'left'));
    styleCell(wsSurvey, r, 1, DATA_CELL_STYLE(isEven, 'center', true));
    styleCell(wsSurvey, r, 2, DATA_CELL_STYLE(isEven, 'center', true));
    styleCell(wsSurvey, r, 3, DATA_CELL_STYLE(isEven, 'left'));
  }

  // Section 4: Waterborne Diseases
  styleRange(wsSurvey, 27, 0, 27, 3, SECTION_HEADER_STYLE('9A3412'));
  for (let c = 0; c < 4; c++) {
    styleCell(wsSurvey, 28, c, TABLE_HEADER_STYLE('C2410C'));
  }
  for (let r = 29; r <= 36; r++) {
    const isEven = r % 2 === 0;
    if (r === 36) {
      // Total summary row
      styleRange(wsSurvey, r, 0, r, 3, DATA_CELL_STYLE(false, 'center', true, 'FEF3C7', '92400E'));
      styleCell(wsSurvey, r, 0, DATA_CELL_STYLE(false, 'left', true, 'FEF3C7', '92400E'));
    } else {
      styleCell(wsSurvey, r, 0, DATA_CELL_STYLE(isEven, 'left', true));
      styleCell(wsSurvey, r, 1, DATA_CELL_STYLE(isEven, 'center', true));
      styleCell(wsSurvey, r, 2, DATA_CELL_STYLE(isEven, 'center'));
      styleCell(wsSurvey, r, 3, DATA_CELL_STYLE(isEven, 'center'));
    }
  }

  // Section 5: National Health Programs
  styleRange(wsSurvey, 38, 0, 38, 3, SECTION_HEADER_STYLE('581C87'));
  for (let c = 0; c < 4; c++) {
    styleCell(wsSurvey, 39, c, TABLE_HEADER_STYLE('7E22CE'));
  }
  for (let r = 40; r <= 42; r++) {
    const isEven = r % 2 === 0;
    styleCell(wsSurvey, r, 0, DATA_CELL_STYLE(isEven, 'left', true));
    styleCell(wsSurvey, r, 1, DATA_CELL_STYLE(isEven, 'center', true));
    styleCell(wsSurvey, r, 2, DATA_CELL_STYLE(isEven, 'center', true));
    styleCell(wsSurvey, r, 3, DATA_CELL_STYLE(isEven, 'left'));
  }

  // Signature Block
  for (let r = 44; r <= 46; r++) {
    styleRange(wsSurvey, r, 0, r, 1, SIGNATURE_CELL_STYLE('center'));
    styleRange(wsSurvey, r, 2, r, 3, SIGNATURE_CELL_STYLE('center'));
  }

  XLSX.utils.book_append_sheet(wb, wsSurvey, '१_मासिक_प्रगती_अहवाल');

  // =========================================================================
  // Sheet 2: जलजन्य व सांधेदुखी रुग्ण नोंदवही (Waterborne Patient Register)
  // =========================================================================
  const patientHeaders = [
    'अ.क्र.',
    'नोंदणी क्र.',
    'नोंदणी तारीख',
    'रुग्णाचे संपूर्ण नाव',
    'वय',
    'लिंग',
    'गाव / वस्ती',
    'मोबाईल क्र.',
    'लक्षणे',
    'संशयित आजार',
    'TCL क्लोरीनेशन',
    'TCL ठिकाण / मात्रा',
    'रक्त / स्टूल नमुना',
    'चाचणी निकाल (RDT)',
    'दिलेले औषधोपचार',
    'रेफर केले का?',
    'संदर्भ रुग्णालय',
    'सद्यस्थिती',
    'शेरा',
  ];

  const patientRows = patients.map((p, idx) => [
    idx + 1,
    p.regNo,
    p.date,
    p.name,
    p.age,
    p.gender,
    p.village,
    p.contact,
    Array.isArray(p.symptoms) ? p.symptoms.join(', ') : '',
    p.suspectedDisease,
    p.tclStatus || 'नाही',
    p.tclDetails || '-',
    p.bloodSlideTaken ? 'होय' : 'नाही',
    p.rdtResult || '-',
    p.treatment,
    p.referred ? 'होय' : 'नाही',
    p.referralCenter || '-',
    p.status,
    p.remarks || '',
  ]);

  const patientSheetData: (string | number)[][] = [
    [
      `महाराष्ट्र शासन | उपकेंद्र: ${config.subCentreName} - जलजन्य, सांधेदुखी व संशयित आजार रुग्ण नोंदवही (${config.reportingMonth})`,
      ...Array(18).fill(''),
    ],
    [
      `प्रा.आ.केंद्र: ${config.phcName} | तालुका: ${config.taluka} | जिल्हा: ${config.district} | आरोग्य सेवक: ${config.workerName} | एकूण रुग्ण: ${patients.length} | TCL परिसर: ${tclDone}`,
      ...Array(18).fill(''),
    ],
    patientHeaders,
    ...(patientRows.length > 0
      ? patientRows
      : [['चालू महिन्यात जलजन्य आजाराचा कोणताही रुग्ण नोंदवला गेला नाही / निरंक (NIL)', ...Array(18).fill('')]]),
  ];

  const wsPatients = XLSX.utils.aoa_to_sheet(patientSheetData);
  wsPatients['!cols'] = autoFitColumns(patientSheetData, 12, 45);
  wsPatients['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 18 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 18 } },
  ];
  if (patientRows.length === 0) {
    wsPatients['!merges'].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 18 } });
  }

  // Row heights
  wsPatients['!rows'] = [
    { hpt: 30 },
    { hpt: 22 },
    { hpt: 28 },
    ...Array(Math.max(patients.length, 1)).fill({ hpt: 22 }),
  ];

  // Apply Styling for Sheet 2
  styleRange(wsPatients, 0, 0, 0, 18, TITLE_BANNER_STYLE('1A4A72'));
  styleRange(wsPatients, 1, 0, 1, 18, META_BANNER_STYLE);
  for (let c = 0; c <= 18; c++) {
    styleCell(wsPatients, 2, c, TABLE_HEADER_STYLE('1F497D'));
  }

  if (patients.length > 0) {
    patients.forEach((p, idx) => {
      const r = idx + 3;
      const isEven = idx % 2 === 0;
      // Normal columns
      styleCell(wsPatients, r, 0, DATA_CELL_STYLE(isEven, 'center'));
      styleCell(wsPatients, r, 1, DATA_CELL_STYLE(isEven, 'center', true));
      styleCell(wsPatients, r, 2, DATA_CELL_STYLE(isEven, 'center'));
      styleCell(wsPatients, r, 3, DATA_CELL_STYLE(isEven, 'left', true));
      styleCell(wsPatients, r, 4, DATA_CELL_STYLE(isEven, 'center'));
      styleCell(wsPatients, r, 5, DATA_CELL_STYLE(isEven, 'center'));
      styleCell(wsPatients, r, 6, DATA_CELL_STYLE(isEven, 'left'));
      styleCell(wsPatients, r, 7, DATA_CELL_STYLE(isEven, 'center'));
      styleCell(wsPatients, r, 8, DATA_CELL_STYLE(isEven, 'left'));

      // Disease highlight (col 9)
      let disBg = isEven ? 'FFFFFF' : 'F8FAFC';
      let disColor = '0F172A';
      if (p.suspectedDisease === 'कॉलरा') {
        disBg = 'FEE2E2';
        disColor = '991B1B';
      } else if (p.suspectedDisease === 'गॅस्ट्रो') {
        disBg = 'FEF3C7';
        disColor = '92400E';
      } else if (p.suspectedDisease === 'मेंदुज्वर') {
        disBg = 'F3E8FF';
        disColor = '6B21A8';
      } else if (p.suspectedDisease === 'अतिसार' || p.suspectedDisease === 'हगवण') {
        disBg = 'E0F2FE';
        disColor = '075985';
      }
      styleCell(wsPatients, r, 9, DATA_CELL_STYLE(false, 'center', true, disBg, disColor));

      // TCL (col 10)
      const tclBg = p.tclStatus === 'होय' ? 'D1FAE5' : 'F1F5F9';
      const tclColor = p.tclStatus === 'होय' ? '065F46' : '64748B';
      styleCell(wsPatients, r, 10, DATA_CELL_STYLE(false, 'center', true, tclBg, tclColor));
      styleCell(wsPatients, r, 11, DATA_CELL_STYLE(isEven, 'left'));
      styleCell(wsPatients, r, 12, DATA_CELL_STYLE(isEven, 'center'));
      styleCell(wsPatients, r, 13, DATA_CELL_STYLE(isEven, 'center'));
      styleCell(wsPatients, r, 14, DATA_CELL_STYLE(isEven, 'left'));

      // Referred (col 15)
      const refBg = p.referred ? 'FEE2E2' : 'F1F5F9';
      const refColor = p.referred ? '991B1B' : '64748B';
      styleCell(wsPatients, r, 15, DATA_CELL_STYLE(false, 'center', true, refBg, refColor));
      styleCell(wsPatients, r, 16, DATA_CELL_STYLE(isEven, 'left'));

      // Status (col 17)
      let statusBg = 'F1F5F9';
      let statusColor = '334155';
      if (p.status === 'पूर्ण बरा झाला') {
        statusBg = 'D1FAE5';
        statusColor = '065F46';
      } else if (p.status === 'रेफर केले') {
        statusBg = 'FEE2E2';
        statusColor = '991B1B';
      } else if (p.status === 'उपचार चालू') {
        statusBg = 'DBEAFE';
        statusColor = '1E40AF';
      }
      styleCell(wsPatients, r, 17, DATA_CELL_STYLE(false, 'center', true, statusBg, statusColor));
      styleCell(wsPatients, r, 18, DATA_CELL_STYLE(isEven, 'left'));
    });
    wsPatients['!autofilter'] = { ref: `A3:S${patients.length + 3}` };
  } else {
    styleRange(wsPatients, 3, 0, 3, 18, DATA_CELL_STYLE(false, 'center', true, 'F8FAFC', '64748B'));
  }

  XLSX.utils.book_append_sheet(wb, wsPatients, '२_जलजन्य_रुग्ण_नोंदवही');

  // =========================================================================
  // Sheet 3: क्षयरुग्ण लाईनलिस्ट (TB Linelist - NTEP)
  // =========================================================================
  const tbHeaders = [
    'अ.क्र.',
    'निक्षय आयडी / नोंदणी क्र.',
    'नोंदणी तारीख',
    'रुग्णाचे नाव',
    'वय',
    'लिंग',
    'गाव / वस्ती',
    'मोबाईल क्र.',
    'टीबी प्रकार (Pulmonary/Extra)',
    'रुग्ण स्थिती / श्रेणी',
    'डॉट्स उपचार सुरु तारीख',
    'डॉट्स प्रदाता नाव',
    'HIV तपासणी निकाल',
    'निक्षय बँक जोडली का?',
    'शेरा',
  ];

  const tbRows = tbPatients.map((p, idx) => [
    idx + 1,
    p.regNo,
    p.date,
    p.name,
    p.age,
    p.gender,
    p.village,
    p.contact,
    p.tbType,
    p.category,
    p.treatmentStartDate || '-',
    p.dotsProvider || '-',
    p.hivStatus || '-',
    p.bankDetailsAdded || 'नाही',
    p.remarks || '',
  ]);

  const tbSheetData: (string | number)[][] = [
    [
      `राष्ट्रीय क्षयरोग निर्मूलन कार्यक्रम (NTEP) - उपकेंद्र ${config.subCentreName} क्षयरुग्ण लाईनलिस्ट (${config.reportingMonth})`,
      ...Array(14).fill(''),
    ],
    [
      `प्रा.आ.केंद्र: ${config.phcName} | तालुका: ${config.taluka} | आरोग्य सेवक: ${config.workerName} | एकूण टीबी रुग्ण: ${tbPatients.length}`,
      ...Array(14).fill(''),
    ],
    tbHeaders,
    ...(tbRows.length > 0
      ? tbRows
      : [['सध्या उपकेंद्रात संशयित किंवा उपचाराखालील क्षयरुग्ण नोंद नाही / निरंक (NIL)', ...Array(14).fill('')]]),
  ];

  const wsTb = XLSX.utils.aoa_to_sheet(tbSheetData);
  wsTb['!cols'] = autoFitColumns(tbSheetData, 12, 38);
  wsTb['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
  ];
  if (tbRows.length === 0) {
    wsTb['!merges'].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 14 } });
  }

  wsTb['!rows'] = [
    { hpt: 30 },
    { hpt: 22 },
    { hpt: 28 },
    ...Array(Math.max(tbPatients.length, 1)).fill({ hpt: 22 }),
  ];

  styleRange(wsTb, 0, 0, 0, 14, TITLE_BANNER_STYLE('1E3A8A'));
  styleRange(wsTb, 1, 0, 1, 14, SUBTITLE_BANNER_STYLE('DBEAFE'));
  // Change text color for subtitle banner to dark blue
  for (let c = 0; c <= 14; c++) {
    styleCell(wsTb, 1, c, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1E3A8A' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'DBEAFE' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: BORDER_THIN,
    });
    styleCell(wsTb, 2, c, TABLE_HEADER_STYLE('1D4ED8'));
  }

  if (tbPatients.length > 0) {
    tbPatients.forEach((_, idx) => {
      const r = idx + 3;
      const isEven = idx % 2 === 0;
      for (let c = 0; c <= 14; c++) {
        const align = [0, 1, 2, 4, 5, 7, 10, 12, 13].includes(c) ? 'center' : 'left';
        const isBold = [1, 3, 8, 9].includes(c);
        styleCell(wsTb, r, c, DATA_CELL_STYLE(isEven, align, isBold));
      }
    });
    wsTb['!autofilter'] = { ref: `A3:O${tbPatients.length + 3}` };
  } else {
    styleRange(wsTb, 3, 0, 3, 14, DATA_CELL_STYLE(false, 'center', true, 'F8FAFC', '64748B'));
  }

  XLSX.utils.book_append_sheet(wb, wsTb, '३_क्षयरुग्ण_लाईनलिस्ट');

  // =========================================================================
  // Sheet 4: कुष्ठरुग्ण लाईनलिस्ट (Leprosy Linelist - NLEP)
  // =========================================================================
  const leprosyHeaders = [
    'अ.क्र.',
    'नोंदणी क्र.',
    'शोधमोहीम / तपासणी तारीख',
    'रुग्णाचे नाव',
    'वय',
    'लिंग',
    'गाव / वस्ती',
    'मोबाईल क्र.',
    'कुष्ठरोग प्रकार (PB/MB)',
    'उपचार स्थिती',
    'चट्टे संख्या',
    'चट्टा कोठे आहे (स्थान)',
    'व्यंगत्व श्रेणी (Grade)',
    'MDT उपचार सुरु तारीख',
    'शेरा',
  ];

  const leprosyRows = leprosyPatients.map((p, idx) => [
    idx + 1,
    p.regNo,
    p.date,
    p.name,
    p.age,
    p.gender,
    p.village,
    p.contact,
    p.leprosyType,
    p.category,
    p.lesionsCount,
    p.lesionLocation || '',
    p.deformityGrade,
    p.mdtStartDate || '-',
    p.remarks || '',
  ]);

  const leprosySheetData: (string | number)[][] = [
    [
      `राष्ट्रीय कुष्ठरोग निर्मूलन कार्यक्रम (NLEP) - उपकेंद्र ${config.subCentreName} कुष्ठरुग्ण लाईनलिस्ट (${config.reportingMonth})`,
      ...Array(14).fill(''),
    ],
    [
      `प्रा.आ.केंद्र: ${config.phcName} | तालुका: ${config.taluka} | आरोग्य सेवक: ${config.workerName} | एकूण कुष्ठरुग्ण: ${leprosyPatients.length}`,
      ...Array(14).fill(''),
    ],
    leprosyHeaders,
    ...(leprosyRows.length > 0
      ? leprosyRows
      : [['सध्या उपकेंद्रात कुष्ठरुग्ण नोंद नाही / निरंक (NIL)', ...Array(14).fill('')]]),
  ];

  const wsLeprosy = XLSX.utils.aoa_to_sheet(leprosySheetData);
  wsLeprosy['!cols'] = autoFitColumns(leprosySheetData, 12, 36);
  wsLeprosy['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
  ];
  if (leprosyRows.length === 0) {
    wsLeprosy['!merges'].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 14 } });
  }

  wsLeprosy['!rows'] = [
    { hpt: 30 },
    { hpt: 22 },
    { hpt: 28 },
    ...Array(Math.max(leprosyPatients.length, 1)).fill({ hpt: 22 }),
  ];

  styleRange(wsLeprosy, 0, 0, 0, 14, TITLE_BANNER_STYLE('065F46'));
  for (let c = 0; c <= 14; c++) {
    styleCell(wsLeprosy, 1, c, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '065F46' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'D1FAE5' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: BORDER_THIN,
    });
    styleCell(wsLeprosy, 2, c, TABLE_HEADER_STYLE('047857'));
  }

  if (leprosyPatients.length > 0) {
    leprosyPatients.forEach((_, idx) => {
      const r = idx + 3;
      const isEven = idx % 2 === 0;
      for (let c = 0; c <= 14; c++) {
        const align = [0, 1, 2, 4, 5, 7, 8, 9, 10, 12].includes(c) ? 'center' : 'left';
        const isBold = [1, 3, 8, 9].includes(c);
        styleCell(wsLeprosy, r, c, DATA_CELL_STYLE(isEven, align, isBold));
      }
    });
    wsLeprosy['!autofilter'] = { ref: `A3:O${leprosyPatients.length + 3}` };
  } else {
    styleRange(wsLeprosy, 3, 0, 3, 14, DATA_CELL_STYLE(false, 'center', true, 'F8FAFC', '64748B'));
  }

  XLSX.utils.book_append_sheet(wb, wsLeprosy, '४_कुष्ठरुग्ण_लाईनलिस्ट');

  // =========================================================================
  // Sheet 5: मोतीबिंदू लाईनलिस्ट (Cataract Linelist - NPCB)
  // =========================================================================
  const cataractHeaders = [
    'अ.क्र.',
    'नोंदणी क्र.',
    'तपासणी तारीख',
    'रुग्णाचे नाव',
    'वय',
    'लिंग',
    'गाव / वस्ती',
    'मोबाईल क्र.',
    'बाधित डोळा',
    'दृष्टीदोष',
    'तपासणी ठिकाण / शिबिर',
    'शस्त्रक्रिया स्थिती',
    'शस्त्रक्रिया दिनांक',
    'रुग्णालय नाव',
    'शेरा',
  ];

  const cataractRows = cataractPatients.map((p, idx) => [
    idx + 1,
    p.regNo,
    p.date,
    p.name,
    p.age,
    p.gender,
    p.village,
    p.contact,
    p.affectedEye,
    p.visualAcuity,
    p.screeningSite,
    p.surgeryStatus,
    p.surgeryDate || '-',
    p.hospitalName || '-',
    p.remarks || '',
  ]);

  const cataractSheetData: (string | number)[][] = [
    [
      `राष्ट्रीय अंधत्व नियंत्रण कार्यक्रम (NPCB) - उपकेंद्र ${config.subCentreName} मोतीबिंदू तपासणी व शस्त्रक्रिया लाईनलिस्ट (${config.reportingMonth})`,
      ...Array(14).fill(''),
    ],
    [
      `प्रा.आ.केंद्र: ${config.phcName} | तालुका: ${config.taluka} | आरोग्य सेवक: ${config.workerName} | एकूण मोतीबिंदू रुग्ण: ${cataractPatients.length}`,
      ...Array(14).fill(''),
    ],
    cataractHeaders,
    ...(cataractRows.length > 0
      ? cataractRows
      : [['सध्या उपकेंद्रात मोतीबिंदू शस्त्रक्रिया प्रलंबित रुग्ण नाहीत / निरंक (NIL)', ...Array(14).fill('')]]),
  ];

  const wsCataract = XLSX.utils.aoa_to_sheet(cataractSheetData);
  wsCataract['!cols'] = autoFitColumns(cataractSheetData, 12, 38);
  wsCataract['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
  ];
  if (cataractRows.length === 0) {
    wsCataract['!merges'].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 14 } });
  }

  wsCataract['!rows'] = [
    { hpt: 30 },
    { hpt: 22 },
    { hpt: 28 },
    ...Array(Math.max(cataractPatients.length, 1)).fill({ hpt: 22 }),
  ];

  styleRange(wsCataract, 0, 0, 0, 14, TITLE_BANNER_STYLE('78350F'));
  for (let c = 0; c <= 14; c++) {
    styleCell(wsCataract, 1, c, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '78350F' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FEF3C7' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: BORDER_THIN,
    });
    styleCell(wsCataract, 2, c, TABLE_HEADER_STYLE('92400E'));
  }

  if (cataractPatients.length > 0) {
    cataractPatients.forEach((p, idx) => {
      const r = idx + 3;
      const isEven = idx % 2 === 0;
      for (let c = 0; c <= 14; c++) {
        const align = [0, 1, 2, 4, 5, 7, 8, 9, 11, 12].includes(c) ? 'center' : 'left';
        const isBold = [1, 3, 11].includes(c);
        if (c === 11) {
          // Surgery status badge
          const isOperated = p.surgeryStatus.includes('ऑपरेशन झाले') || p.surgeryStatus.includes('शस्त्रक्रिया पूर्ण');
          const surgBg = isOperated ? 'D1FAE5' : 'FEF3C7';
          const surgColor = isOperated ? '065F46' : '92400E';
          styleCell(wsCataract, r, c, DATA_CELL_STYLE(false, 'center', true, surgBg, surgColor));
        } else {
          styleCell(wsCataract, r, c, DATA_CELL_STYLE(isEven, align, isBold));
        }
      }
    });
    wsCataract['!autofilter'] = { ref: `A3:O${cataractPatients.length + 3}` };
  } else {
    styleRange(wsCataract, 3, 0, 3, 14, DATA_CELL_STYLE(false, 'center', true, 'F8FAFC', '64748B'));
  }

  XLSX.utils.book_append_sheet(wb, wsCataract, '५_मोतीबिंदू_लाईनलिस्ट');

  const deathHeaders = ['अ.क्र.', 'मृत्यू दिनांक', 'मृत व्यक्तीचे नाव', 'वय', 'लिंग', 'गाव / वस्ती', 'मृत्यू गावात/गावाबाहेर', 'मृत्यूचे ठिकाण', 'मृत्यूचे कारण', 'शेरा'];
  const deathRows = deaths.map((record, index) => [index + 1, record.date, record.name || (record as DeathRecord & { deceasedName?: string; deceased_name?: string; personName?: string; fullName?: string }).deceasedName || (record as DeathRecord & { deceased_name?: string }).deceased_name || (record as DeathRecord & { personName?: string }).personName || (record as DeathRecord & { fullName?: string }).fullName || 'नाव उपलब्ध नाही', record.age, record.gender, record.village, record.place, record.deathPlace, record.cause, record.remarks || '']);
  const deathSheetData = [
    [`मृत्यू नोंदणी लाईनलिस्ट - ${config.reportingMonth}`, ...Array(deathHeaders.length - 1).fill('')],
    [`उपकेंद्र: ${config.subCentreName} | एकूण मृत्यू नोंदी: ${deaths.length}`, ...Array(deathHeaders.length - 1).fill('')],
    deathHeaders,
    ...(deathRows.length ? deathRows : [['सध्या मृत्यूची नोंद उपलब्ध नाही.', ...Array(deathHeaders.length - 1).fill('')]]),
  ];
  const wsDeaths = XLSX.utils.aoa_to_sheet(deathSheetData);
  wsDeaths['!cols'] = autoFitColumns(deathSheetData, 12, 34);
  wsDeaths['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: deathHeaders.length - 1 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: deathHeaders.length - 1 } }];
  styleRange(wsDeaths, 0, 0, 0, deathHeaders.length - 1, TITLE_BANNER_STYLE('7F1D1D'));
  styleRange(wsDeaths, 1, 0, 1, deathHeaders.length - 1, META_BANNER_STYLE);
  styleRange(wsDeaths, 2, 0, 2, deathHeaders.length - 1, TABLE_HEADER_STYLE('991B1B'));
  for (let row = 3; row < deathSheetData.length; row++) styleRange(wsDeaths, row, 0, row, deathHeaders.length - 1, DATA_CELL_STYLE((row - 3) % 2 === 0));
  XLSX.utils.book_append_sheet(wb, wsDeaths, '६_मृत्यू_लाईनलिस्ट');

  // =========================================================================
  // Generate & Trigger Download of Styled Excel File
  // =========================================================================
  const cleanSubCentre = config.subCentreName ? config.subCentreName.replace(/[\s/\\:]+/g, '_') : 'SubCentre';
  const cleanMonth = config.reportingMonth ? config.reportingMonth.replace(/[\s/\\:]+/g, '_') : 'Month';
  const fileName = `Arogya_Sevak_Masik_Ahwal_${cleanSubCentre}_${cleanMonth}.xlsx`;

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  await saveBlob(blob, fileName);
}


export function generateWhatsAppSummary(
  config: SubCentreConfig,
  survey: ContainerSurveyData,
  patients: PatientRecord[],
  tbPatients: TbPatientRecord[] = [],
  leprosyPatients: LeprosyPatientRecord[] = [],
  cataractPatients: CataractPatientRecord[] = [],
  deaths: DeathRecord[] = []
  ): string {
  const indices = calculateIndices(survey);
  const totalPatients = patients.length;
  const choleraCases = patients.filter((p) => p.suspectedDisease === 'कॉलरा').length;
  const gastroCases = patients.filter((p) => p.suspectedDisease === 'गॅस्ट्रो').length;
  const diarrheaCases = patients.filter((p) => p.suspectedDisease === 'अतिसार').length;
  const dysenteryCases = patients.filter((p) => p.suspectedDisease === 'हगवण').length;
  const encephalitisCases = patients.filter((p) => p.suspectedDisease === 'मेंदुज्वर').length;
  const jointPainCases = patients.filter((p) => p.suspectedDisease === 'सांधेदुखी').length;
  const tclDone = patients.filter((p) => p.tclStatus === 'होय').length;
  const referred = patients.filter((p) => p.referred).length;

  return `*${config.stateDepartment}*
*मासिक अहवाल - ${config.reportingMonth}*
📍 उपकेंद्र: ${config.subCentreName} (${config.phcName})
👨‍⚕️ आरोग्य सेवक: ${config.workerName}

📊 *कंटेनर सर्वेक्षण (Vector Indices):*
- तपासलेली घरे: ${survey.inspHouses} | दूषित घरे: ${survey.posHouses}
- तपासलेली भांडी: ${survey.inspCont} | दूषित भांडी: ${survey.posCont}
- *HI:* ${indices.hi}% | *CI:* ${indices.ci}% | *BI:* ${indices.bi}
- *जोखीम पातळी:* ${indices.riskLevel}

💍 *गावातील सामाजिक आकडेवारी:*
- गावात झालेली एकूण लग्ने: *${survey.villageMarriages}*

🩸 *रक्त तपासणी आकडेवारी:*
- एकूण घेतलेले रक्तनमुने: *${survey.bloodSamplesTaken}*

💧 *पाणी, मीठ व TCL तपासणी:*
- पाणी जैविक पाठवले: *${survey.waterBioSentStatus}* (${survey.waterBioSent} नमुने)
- पाणी रासायनिक पाठवले: *${survey.waterChemSentStatus}* (${survey.waterChemSent} नमुने)
- मीठ नमुना पाठवला: *${survey.saltSampleSentStatus}* (${survey.saltSampleSent} नमुने)
- TCL वापर: *${survey.tclUsedKg} किलो* | ओटी टेस्ट: *${survey.chlorineTests}*

🩺 *राष्ट्रीय आरोग्य कार्यक्रम आकडेवारी:*
• *क्षयरोग (TB):* एकूण: ${survey.tbTotal} | संशयित: ${survey.tbSuspected} | उपचाराखालील: ${survey.tbUnderTreatment}
• *कुष्ठरोग (Leprosy):* संशयित: ${survey.leprosySuspected} | उपचाराखालील: ${survey.leprosyUnderTreatment}
• *मोतीबिंदू (Cataract):* संशयित: ${survey.cataractSuspected} | ऑपरेशन झालेले: ${survey.cataractOperated}

📋 *तपशीलवार लाईनलिस्ट (Line-lists):*
- क्षयरुग्ण नोंदणी (TB Linelist): *${tbPatients.length} रुग्ण*
- कुष्ठरुग्ण नोंदणी (Leprosy Linelist): *${leprosyPatients.length} रुग्ण*
- मोतीबिंदू नोंदणी (Cataract Linelist): *${cataractPatients.length} रुग्ण*
- मृत्यू नोंदणी (Death Linelist): *${deaths.length} नोंदी*
${deaths.map((death, index) => `  ${index + 1}. ${death.date} - ${death.name}, ${death.place}, कारण: ${death.cause}`).join('\\n')}

👥 *जलजन्य व सांधेदुखी रुग्ण नोंदणी सारांश (एकूण: ${totalPatients}):*
- कॉलरा: ${choleraCases} | गॅस्ट्रो: ${gastroCases} | अतिसार: ${diarrheaCases}
- हगवण: ${dysenteryCases} | मेंदुज्वर: ${encephalitisCases} | सांधेदुखी: ${jointPainCases}
- TCL क्लोरीनेशन केलेले रुग्ण परिसर: ${tclDone}
- प्राथमिक आरोग्य केंद्रास रेफर: ${referred}

(स्मार्ट रिपोर्टिंग ॲपद्वारे पाठवले)`;
}
