import React, { useState } from 'react';
import { AnimatedNumber } from './AnimatedNumber';
import {
  PatientRecord,
  DiseaseType,
  TbPatientRecord,
  LeprosyPatientRecord,
  CataractPatientRecord,
  DeathRecord,
} from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { TbLinelistTab } from './TbLinelistTab';
import { LeprosyLinelistTab } from './LeprosyLinelistTab';
import { CataractLinelistTab } from './CataractLinelistTab';
import { DeathLinelistTab } from './DeathLinelistTab';
import {
  UserPlus,
  Search,
  Filter,
  Trash2,
  Phone,
  MapPin,
  X,
  Save,
  Check,
  Droplets,
  HeartPulse,
  Activity,
  Eye,
  CheckCircle,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';
import { NumberInput } from './common/NumberInput';
import { toEnglishDigits } from '../utils/dateUtils';

interface PatientEntryTabProps {
  patients: PatientRecord[];
  onAddPatient: (patient: PatientRecord) => void;
  onUpdatePatient: (patient: PatientRecord) => void;
  onDeletePatient: (id: string) => void;

  // New Linelists
  tbPatients: TbPatientRecord[];
  onAddTbPatient: (patient: TbPatientRecord) => void;
  onUpdateTbPatient: (patient: TbPatientRecord) => void;
  onDeleteTbPatient: (id: string) => void;

  leprosyPatients: LeprosyPatientRecord[];
  onAddLeprosyPatient: (patient: LeprosyPatientRecord) => void;
  onUpdateLeprosyPatient: (patient: LeprosyPatientRecord) => void;
  onDeleteLeprosyPatient: (id: string) => void;

  cataractPatients: CataractPatientRecord[];
  onAddCataractPatient: (patient: CataractPatientRecord) => void;
  onUpdateCataractPatient: (patient: CataractPatientRecord) => void;
  onDeleteCataractPatient: (id: string) => void;
  deaths: DeathRecord[];
  onAddDeath: (record: DeathRecord) => void;
  onUpdateDeath: (record: DeathRecord) => void;
  onDeleteDeath: (id: string) => void;
}

const COMMON_SYMPTOMS = [
  'पातळ संडास / जुलाब',
  'रक्तमिश्रित संडास (हगवण)',
  'उलट्या',
  'तीव्र ताप',
  'पोटदुखी / मुरडा',
  'मान ताठरणे (मेंदुज्वर)',
  'तीव्र सांधेदुखी व अंगदुखी',
  'डोकेदुखी व अस्वस्थता',
  'अशक्तपणा / निर्जलीकरण',
  'थंडी वाजणे',
];

const DISEASE_OPTIONS: DiseaseType[] = [
  'कॉलरा',
  'गॅस्ट्रो',
  'अतिसार',
  'हगवण',
  'मेंदुज्वर',
  'सांधेदुखी',
  'मलेरिया',
  'डेंग्यू',
  'इतर आजार',
];

export const PatientEntryTab: React.FC<PatientEntryTabProps> = ({
  patients,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
  tbPatients,
  onAddTbPatient,
  onUpdateTbPatient,
  onDeleteTbPatient,
  leprosyPatients,
  onAddLeprosyPatient,
  onUpdateLeprosyPatient,
  onDeleteLeprosyPatient,
  cataractPatients,
  onAddCataractPatient,
  onUpdateCataractPatient,
  onDeleteCataractPatient,
  deaths,
  onAddDeath,
  onUpdateDeath,
  onDeleteDeath,
}) => {
  // Sub-Tab selection: Waterborne, TB, Leprosy, Cataract
  const [activeSubTab, setActiveSubTab] = useState<'waterborne' | 'tb' | 'leprosy' | 'cataract' | 'death'>(
    'waterborne'
  );

  // Waterborne state
  const [searchTerm, setSearchTerm] = useState('');
  const [diseaseFilter, setDiseaseFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);

  // Delete modal state for waterborne
  const [deleteTarget, setDeleteTarget] = useState<PatientRecord | null>(null);

  // Form State for Waterborne
  const [formData, setFormData] = useState<Partial<PatientRecord>>({
    date: new Date().toISOString().split('T')[0],
    name: '',
    age: 30,
    gender: 'पुरुष',
    village: 'वडगाव गुप्ता गावठाण',
    contact: '',
    symptoms: ['पातळ संडास / जुलाब'],
    suspectedDisease: 'गॅस्ट्रो',
    tclStatus: 'होय',
    tclDetails: 'पिण्याच्या पाण्याच्या भांड्यात TCL वापर व उकळलेले पाणी',
    bloodSlideTaken: false,
    rdtResult: 'निगेटिव्ह',
    treatment: 'ORS द्रावण, Zinc गोळ्या, भरपूर द्रवपदार्थ व विश्रांती',
    referred: false,
    referralCenter: 'नागापूर प्राथमिक आरोग्य केंद्र',
    status: 'उपचार चालू',
    remarks: '',
  });

  const openAddModal = () => {
    setEditingPatient(null);
    const count = patients.length + 1;
    const formattedNo = `VG-26/08-${count < 10 ? '0' + count : count}`;
    setFormData({
      regNo: formattedNo,
      date: new Date().toISOString().split('T')[0],
      name: '',
      age: 28,
      gender: 'पुरुष',
      village: 'वडगाव गुप्ता गावठाण',
      contact: '',
      symptoms: ['पातळ संडास / जुलाब'],
      suspectedDisease: 'गॅस्ट्रो',
      tclStatus: 'होय',
      tclDetails: 'पिण्याच्या पाण्याच्या भांड्यात TCL वापर व उकळलेले पाणी',
      bloodSlideTaken: false,
      rdtResult: 'निगेटिव्ह',
      treatment: 'ORS द्रावण, Zinc गोळ्या, भरपूर द्रवपदार्थ',
      referred: false,
      referralCenter: 'नागापूर प्राथमिक आरोग्य केंद्र',
      status: 'उपचार चालू',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (patient: PatientRecord) => {
    setEditingPatient(patient);
    setFormData({ ...patient });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingPatient) {
      onUpdatePatient({
        ...editingPatient,
        ...formData,
      } as PatientRecord);
    } else {
      const newRecord: PatientRecord = {
        id: 'pt-' + Date.now(),
        regNo: formData.regNo || `VG-26/08-${patients.length + 1}`,
        date: formData.date || new Date().toISOString().split('T')[0],
        name: formData.name,
        age: formData.age || 0,
        gender: formData.gender || 'पुरुष',
        village: formData.village || '',
        contact: formData.contact || '',
        symptoms: formData.symptoms || [],
        suspectedDisease: formData.suspectedDisease || 'गॅस्ट्रो',
        tclStatus: formData.tclStatus || 'होय',
        tclDetails: formData.tclDetails || '',
        bloodSlideTaken: formData.bloodSlideTaken || false,
        rdtResult: formData.rdtResult || 'चाचणी केली नाही',
        treatment: formData.treatment || '',
        referred: formData.referred || false,
        referralCenter: formData.referred ? formData.referralCenter : '',
        status: formData.status || 'उपचार चालू',
        remarks: formData.remarks || '',
      };
      onAddPatient(newRecord);
    }
    setIsModalOpen(false);
  };

  const toggleSymptom = (sym: string) => {
    const current = formData.symptoms || [];
    if (current.includes(sym)) {
      setFormData({ ...formData, symptoms: current.filter((s) => s !== sym) });
    } else {
      setFormData({ ...formData, symptoms: [...current, sym] });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDeletePatient(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Filtered Patient List for Waterborne
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contact.includes(searchTerm);

    const matchesDisease = diseaseFilter === 'all' || p.suspectedDisease === diseaseFilter;
    return matchesSearch && matchesDisease;
  });

  // Summary Metrics
  const totalCount = patients.length;
  const choleraCount = patients.filter((p) => p.suspectedDisease === 'कॉलरा').length;
  const gastroCount = patients.filter((p) => p.suspectedDisease === 'गॅस्ट्रो').length;
  const diarrheaCount = patients.filter((p) => p.suspectedDisease === 'अतिसार').length;
  const dysenteryCount = patients.filter((p) => p.suspectedDisease === 'हगवण').length;
  const encephalitisCount = patients.filter((p) => p.suspectedDisease === 'मेंदुज्वर').length;
  const jointPainCount = patients.filter((p) => p.suspectedDisease === 'सांधेदुखी').length;

  return (
    <div className="space-y-4 pb-6">
      {/* Linelist Sub-Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-1.5 flex flex-wrap sm:flex-nowrap sm:overflow-x-auto gap-1.5">
        <button
          type="button"
          id="subtab-waterborne-btn"
          onClick={() => setActiveSubTab('waterborne')}
          className={`pressable min-w-0 flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'waterborne'
              ? 'bg-[#1a4a72] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Droplets className="w-4 h-4 shrink-0" />
          <span>जलजन्य, सांधेदुखी व साथरोग</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeSubTab === 'waterborne' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {patients.length}
          </span>
        </button>

        <button
          type="button"
          id="subtab-tb-btn"
          onClick={() => setActiveSubTab('tb')}
          className={`pressable min-w-0 flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'tb'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <HeartPulse className="w-4 h-4 shrink-0" />
          <span>क्षयरुग्ण (TB) लाईनलिस्ट</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeSubTab === 'tb' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {tbPatients.length}
          </span>
        </button>

        <button
          type="button"
          id="subtab-leprosy-btn"
          onClick={() => setActiveSubTab('leprosy')}
          className={`pressable min-w-0 flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'leprosy'
              ? 'bg-purple-800 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>कुष्ठरुग्ण लाईनलिस्ट</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeSubTab === 'leprosy' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
            }`}
          >
            {leprosyPatients.length}
          </span>
        </button>

        <button
          type="button"
          id="subtab-cataract-btn"
          onClick={() => setActiveSubTab('cataract')}
          className={`pressable min-w-0 flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'cataract'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-4 h-4 shrink-0" />
          <span>मोतीबिंदू लाईनलिस्ट</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeSubTab === 'cataract' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {cataractPatients.length}
          </span>
        </button>

        <button type="button" id="subtab-death-btn" onClick={() => setActiveSubTab('death')} className={`pressable min-w-0 flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeSubTab === 'death' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
          <span className="text-base leading-none">†</span><span>मृत्यू लाईनलिस्ट</span><span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeSubTab === 'death' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>{deaths.length}</span>
        </button>
      </div>

      {activeSubTab === 'death' && (
        <div key={activeSubTab} className="animate-fade-up">
          <DeathLinelistTab records={deaths} onAdd={onAddDeath} onUpdate={onUpdateDeath} onDelete={onDeleteDeath} />
        </div>
      )}

      {/* Sub-tab 1: TB Linelist */}
      {activeSubTab === 'tb' && (
        <div key={activeSubTab} className="animate-fade-up">
        <TbLinelistTab
          patients={tbPatients}
          onAddPatient={onAddTbPatient}
          onUpdatePatient={onUpdateTbPatient}
          onDeletePatient={onDeleteTbPatient}
        />
        </div>
      )}

      {/* Sub-tab 2: Leprosy Linelist */}
      {activeSubTab === 'leprosy' && (
        <div key={activeSubTab} className="animate-fade-up">
        <LeprosyLinelistTab
          patients={leprosyPatients}
          onAddPatient={onAddLeprosyPatient}
          onUpdatePatient={onUpdateLeprosyPatient}
          onDeletePatient={onDeleteLeprosyPatient}
        />
        </div>
      )}

      {/* Sub-tab 3: Cataract Linelist */}
      {activeSubTab === 'cataract' && (
        <div key={activeSubTab} className="animate-fade-up">
        <CataractLinelistTab
          patients={cataractPatients}
          onAddPatient={onAddCataractPatient}
          onUpdatePatient={onUpdateCataractPatient}
          onDeletePatient={onDeleteCataractPatient}
        />
        </div>
      )}

  {/* Sub-tab 4: Waterborne & Outbreak Linelist */}
  {activeSubTab === 'waterborne' && (
        <div key={activeSubTab} className="space-y-4 animate-fade-up">
          {/* Top Metrics Row - 7 Disease Categories with quick filter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <button
              type="button"
              onClick={() => setDiseaseFilter('all')}
              style={{ animationDelay: '0ms' }}
              className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer animate-fade-up ${
                diseaseFilter === 'all'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">एकूण रुग्ण</div>
              <div className="text-xl font-black mt-0.5"><AnimatedNumber value={totalCount} /></div>
              <div className="text-[10px] opacity-70">सर्व नोंदी</div>
            </button>

            <button
              type="button"
              onClick={() => setDiseaseFilter(diseaseFilter === 'कॉलरा' ? 'all' : 'कॉलरा')}
              style={{ animationDelay: '60ms' }}
              className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer animate-fade-up ${
                diseaseFilter === 'कॉलरा'
                  ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                  : 'bg-white text-slate-700 border-rose-200 hover:border-rose-300'
              }`}
            >
              <div className="text-[11px] font-bold text-rose-700">कॉलरा</div>
              <div className="text-xl font-black text-rose-800 mt-0.5"><AnimatedNumber value={choleraCount} /></div>
              <div className="text-[10px] text-rose-600">Cholera</div>
            </button>

            <button
              type="button"
              onClick={() => setDiseaseFilter(diseaseFilter === 'गॅस्ट्रो' ? 'all' : 'गॅस्ट्रो')}
              style={{ animationDelay: '120ms' }}
              className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer animate-fade-up ${
                diseaseFilter === 'गॅस्ट्रो'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-700 border-amber-200 hover:border-amber-300'
              }`}
            >
              <div className="text-[11px] font-bold text-amber-700">गॅस्ट्रो</div>
              <div className="text-xl font-black text-amber-800 mt-0.5"><AnimatedNumber value={gastroCount} /></div>
              <div className="text-[10px] text-amber-600">Gastro</div>
            </button>

            <button
              type="button"
              onClick={() => setDiseaseFilter(diseaseFilter === 'अतिसार' ? 'all' : 'अतिसार')}
              style={{ animationDelay: '180ms' }}
              className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer animate-fade-up ${
                diseaseFilter === 'अतिसार'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-white text-slate-700 border-sky-200 hover:border-sky-300'
              }`}
            >
              <div className="text-[11px] font-bold text-sky-700">अतिसार</div>
              <div className="text-xl font-black text-sky-800 mt-0.5"><AnimatedNumber value={diarrheaCount} /></div>
              <div className="text-[10px] text-sky-600">Diarrhea</div>
            </button>

            <button
              type="button"
              onClick={() => setDiseaseFilter(diseaseFilter === 'हगवण' ? 'all' : 'हगवण')}
              style={{ animationDelay: '240ms' }}
              className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer animate-fade-up ${
                diseaseFilter === 'हगवण'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                  : 'bg-white text-slate-700 border-orange-200 hover:border-orange-300'
              }`}
            >
              <div className="text-[11px] font-bold text-orange-700">हगवण</div>
              <div className="text-xl font-black text-orange-800 mt-0.5"><AnimatedNumber value={dysenteryCount} /></div>
              <div className="text-[10px] text-orange-600">Dysentery</div>
            </button>

            <button
              type="button"
              onClick={() => setDiseaseFilter(diseaseFilter === 'मेंदुज्वर' ? 'all' : 'मेंदुज्वर')}
              style={{ animationDelay: '300ms' }}
              className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer animate-fade-up ${
                diseaseFilter === 'मेंदुज्वर'
                  ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-purple-200 hover:border-purple-300'
              }`}
            >
              <div className="text-[11px] font-bold text-purple-700">मेंदुज्वर</div>
              <div className="text-xl font-black text-purple-800 mt-0.5"><AnimatedNumber value={encephalitisCount} /></div>
              <div className="text-[10px] text-purple-600">Encephalitis</div>
            </button>

            <button
              type="button"
              onClick={() => setDiseaseFilter(diseaseFilter === 'सांधेदुखी' ? 'all' : 'सांधेदुखी')}
              style={{ animationDelay: '360ms' }}
              className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer animate-fade-up ${
                diseaseFilter === 'सांधेदुखी'
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-white text-slate-700 border-teal-200 hover:border-teal-300'
              }`}
            >
              <div className="text-[11px] font-bold text-teal-700">सांधेदुखी</div>
              <div className="text-xl font-black text-teal-800 mt-0.5"><AnimatedNumber value={jointPainCount} /></div>
              <div className="text-[10px] text-teal-600">Joint Pain / चिका</div>
            </button>
          </div>

          {/* Search, Filter and Add Button */}
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-1 flex-wrap gap-2.5 w-full items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="नाव, नोंद क्र., गाव किंवा मोबाईल शोधा..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#1a4a72] outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={diseaseFilter}
                  onChange={(e) => setDiseaseFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-700 text-xs py-1.5 px-2.5 rounded-lg outline-none font-medium"
                >
                  <option value="all">सर्व आजार</option>
                  {DISEASE_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              id="add-patient-btn"
              onClick={openAddModal}
              className="w-full md:w-auto px-4 py-2 bg-[#1a4a72] hover:bg-[#123653] text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>नवीन रुग्ण नोंदवा (जलजन्य / सांधेदुखी)</span>
            </button>
          </div>

          {/* Patient Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-2.5 text-center w-10">#</th>
                    <th className="p-2.5">नोंदणी क्र. / तारीख</th>
                    <th className="p-2.5">रुग्णाचे नाव व वय/लिंग</th>
                    <th className="p-2.5">गाव व संपर्क</th>
                    <th className="p-2.5">संशयित आजार</th>
                    <th className="p-2.5">लक्षणे</th>
                    <th className="p-2.5">सद्यस्थिती व उपचार</th>
                    <th className="p-2.5 text-center whitespace-nowrap">कृती (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        कोणतेही रुग्ण रेकॉर्ड आढळले नाही. नवीन रुग्ण नोंदवण्यासाठी वरील बटण दाबा.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>

                        <td className="p-2.5">
                          <span className="font-bold text-slate-900 font-mono block">{p.regNo}</span>
                          <span className="text-[10px] text-slate-400 block">{p.date}</span>
                        </td>

                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {p.age} वर्षे | {p.gender}
                          </div>
                        </td>

                        <td className="p-2.5">
                          <div className="flex items-center gap-1 text-slate-700">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{p.village}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{p.contact || '-'}</span>
                          </div>
                        </td>

                        <td className="p-2.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
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
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {p.suspectedDisease}
                          </span>
                        </td>

                        <td className="p-2.5 text-slate-600 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {p.symptoms.map((s, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="p-2.5 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                              p.status === 'पूर्ण बरा झाला'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.status === 'रेफर केले'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {p.status}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5 max-w-[140px] truncate">
                            {p.treatment}
                          </div>
                        </td>

                        {/* Action Column: Edit and Delete with Custom Modal */}
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#1a4a72] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer"
                              title="Edit patient record"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(p)}
                              className="px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded transition-colors cursor-pointer"
                              title="हटवा"
                            >
                              हटवा
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delete Confirmation Modal for Waterborne Patient (100% reliable in iframe) */}
          <ConfirmDeleteModal
            isOpen={Boolean(deleteTarget)}
            title="रुग्ण नोंद हटवण्याची खात्री करा"
            itemName={deleteTarget?.name || ''}
            itemDetails={deleteTarget ? `नोंदणी क्र.: ${deleteTarget.regNo} | आजार: ${deleteTarget.suspectedDisease}` : ''}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
          />

          {/* Modal for Waterborne Add/Edit */}
          {isModalOpen && (
            <div
              id="waterborne-modal"
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden animate-scale-in">
                <div className="px-5 py-4 bg-[#1a4a72] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-base sm:text-lg">
                      {editingPatient ? 'रुग्ण माहिती संपादित करा (Edit)' : 'नवीन रुग्ण नोंदणी (New Registration)'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">नोंदणी क्र. *</label>
                      <input
                        type="text"
                        required
                        value={formData.regNo || ''}
                        onChange={(e) => setFormData({ ...formData, regNo: toEnglishDigits(e.target.value) })}
                        placeholder="उदा. WB-01"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:ring-1 focus:ring-[#1a4a72] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">तारीख *</label>
                      <input
                        type="date"
                        required
                        value={formData.date || ''}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#1a4a72] outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">रुग्णाचे पूर्ण नाव *</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="उदा. रमेश मारुती शिंदे"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#1a4a72] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">वय (वर्षे) *</label>
                      <NumberInput
                        value={formData.age || 0}
                        onChange={(val) => setFormData({ ...formData, age: val })}
                        min={1}
                        max={120}
                        showStepButtons={true}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#1a4a72] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">लिंग *</label>
                      <select
                        value={formData.gender || 'पुरुष'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#1a4a72] outline-none"
                      >
                        <option value="पुरुष">पुरुष</option>
                        <option value="स्त्री">स्त्री</option>
                        <option value="इतर">इतर</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">गाव / वस्ती *</label>
                      <input
                        type="text"
                        required
                        value={formData.village || ''}
                        onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#1a4a72] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">मोबाईल संपर्क क्र.</label>
                      <input
                        type="text"
                        value={formData.contact || ''}
                        onChange={(e) => setFormData({ ...formData, contact: toEnglishDigits(e.target.value) })}
                        placeholder="10 अंकी मोबाईल क्र."
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:ring-1 focus:ring-[#1a4a72] outline-none"
                      />
                    </div>

                    {/* Suspected Disease */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">संशयित आजार *</label>
                      <select
                        value={formData.suspectedDisease || 'गॅस्ट्रो'}
                        onChange={(e) => setFormData({ ...formData, suspectedDisease: e.target.value as any })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-[#1a4a72] focus:ring-1 focus:ring-[#1a4a72] outline-none"
                      >
                        {DISEASE_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Symptoms Multi-Check */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">लक्षणे (Symptoms)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {COMMON_SYMPTOMS.map((sym) => {
                        const isChecked = formData.symptoms?.includes(sym);
                        return (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => toggleSymptom(sym)}
                            className={`p-2 rounded-lg text-left text-xs flex items-center justify-between border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span>{sym}</span>
                            {isChecked && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">दिलेले औषधोपचार</label>
                      <input
                        type="text"
                        value={formData.treatment || ''}
                        onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                        placeholder="उदा. ORS, Zinc गोळ्या, सिप्रोफ्लोक्सॅसिन"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#1a4a72] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">सद्यस्थिती *</label>
                      <select
                        value={formData.status || 'उपचार चालू'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#1a4a72] outline-none"
                      >
                        <option value="उपचार चालू">उपचार चालू</option>
                        <option value="पूर्ण बरा झाला">पूर्ण बरा झाला</option>
                        <option value="रेफर केले">रेफर केले</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">टिप्पणी / शेरा</label>
                      <input
                        type="text"
                        value={formData.remarks || ''}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        placeholder="अतिरिक्त शेरा / पाठपुरावा नोंद"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#1a4a72] outline-none"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    {editingPatient ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          setDeleteTarget(editingPatient);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        हे रेकॉर्ड हटवा
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        रद्द करा
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-[#1a4a72] text-white hover:bg-[#123653] rounded-lg shadow-sm"
                      >
                        <Save className="w-4 h-4" />
                        {editingPatient ? 'बदल जतन करा' : 'माहिती सेव्ह करा'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
