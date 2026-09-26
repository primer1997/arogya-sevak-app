import React, { useState } from 'react';
import { AnimatedNumber } from './AnimatedNumber';
import { LeprosyPatientRecord } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Activity,
  Phone,
  MapPin,
  X,
  ShieldAlert,
} from 'lucide-react';
import { NumberInput } from './common/NumberInput';
import { toEnglishDigits } from '../utils/dateUtils';

interface LeprosyLinelistTabProps {
  patients: LeprosyPatientRecord[];
  onAddPatient: (patient: LeprosyPatientRecord) => void;
  onUpdatePatient: (patient: LeprosyPatientRecord) => void;
  onDeletePatient: (id: string) => void;
}

export function LeprosyLinelistTab({
  patients,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
}: LeprosyLinelistTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<LeprosyPatientRecord | null>(null);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<LeprosyPatientRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<LeprosyPatientRecord>>({
    regNo: '',
    date: new Date().toISOString().split('T')[0],
    name: '',
    age: 40,
    gender: 'पुरुष',
    village: '',
    contact: '',
    leprosyType: 'PB (Pauci-Bacillary)',
    category: 'उपचाराखालील (Under Treatment)',
    lesionsCount: 2,
    lesionLocation: '',
    deformityGrade: 'Grade 0 (व्यंग नाही)',
    mdtStartDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const openAddModal = () => {
    setEditingPatient(null);
    setFormData({
      regNo: `NLEP-26-${Math.floor(100 + Math.random() * 899)}`,
      date: new Date().toISOString().split('T')[0],
      name: '',
      age: 40,
      gender: 'पुरुष',
      village: '',
      contact: '',
      leprosyType: 'PB (Pauci-Bacillary)',
      category: 'उपचाराखालील (Under Treatment)',
      lesionsCount: 2,
      lesionLocation: '',
      deformityGrade: 'Grade 0 (व्यंग नाही)',
      mdtStartDate: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: LeprosyPatientRecord) => {
    setEditingPatient(p);
    setFormData({ ...p });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingPatient) {
      const updated: LeprosyPatientRecord = {
        ...editingPatient,
        regNo: formData.regNo || editingPatient.regNo,
        date: formData.date || editingPatient.date,
        name: formData.name,
        age: Number(formData.age) || 0,
        gender: formData.gender || 'पुरुष',
        village: formData.village || '',
        contact: formData.contact || '',
        leprosyType: formData.leprosyType || 'PB (Pauci-Bacillary)',
        category: formData.category || 'उपचाराखालील (Under Treatment)',
        lesionsCount: Number(formData.lesionsCount) || 0,
        lesionLocation: formData.lesionLocation || '',
        deformityGrade: formData.deformityGrade || 'Grade 0 (व्यंग नाही)',
        mdtStartDate: formData.mdtStartDate || '-',
        remarks: formData.remarks || '',
      };
      onUpdatePatient(updated);
    } else {
      const newRecord: LeprosyPatientRecord = {
        id: 'lep-' + Date.now(),
        regNo: formData.regNo || `NLEP-26-${Math.floor(100 + Math.random() * 899)}`,
        date: formData.date || new Date().toISOString().split('T')[0],
        name: formData.name,
        age: Number(formData.age) || 0,
        gender: formData.gender || 'पुरुष',
        village: formData.village || '',
        contact: formData.contact || '',
        leprosyType: formData.leprosyType || 'PB (Pauci-Bacillary)',
        category: formData.category || 'उपचाराखालील (Under Treatment)',
        lesionsCount: Number(formData.lesionsCount) || 0,
        lesionLocation: formData.lesionLocation || '',
        deformityGrade: formData.deformityGrade || 'Grade 0 (व्यंग नाही)',
        mdtStartDate: formData.mdtStartDate || '-',
        remarks: formData.remarks || '',
      };
      onAddPatient(newRecord);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDeletePatient(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Filtered List
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contact.includes(searchTerm);

    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesType = typeFilter === 'all' || p.leprosyType === typeFilter;
    return matchesSearch && matchesCat && matchesType;
  });

  // Metrics
  const totalCount = patients.length;
  const underTreatmentCount = patients.filter((p) => p.category === 'उपचाराखालील (Under Treatment)').length;
  const suspectedCount = patients.filter((p) => p.category === 'संशयित (Suspected)').length;
  const pbCount = patients.filter((p) => p.leprosyType === 'PB (Pauci-Bacillary)').length;
  const mbCount = patients.filter((p) => p.leprosyType === 'MB (Multi-Bacillary)').length;

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs animate-fade-up" style={{ animationDelay: '0ms' }}>
          <div className="text-xs text-slate-500 font-medium">एकूण कुष्ठरुग्ण नोंदणी</div>
          <div className="text-xl sm:text-2xl font-black text-purple-800 mt-0.5"><AnimatedNumber value={totalCount} /></div>
          <div className="text-[11px] text-slate-400">NLEP रजिस्टर</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-xs bg-emerald-50/20 animate-fade-up" style={{ animationDelay: '70ms' }}>
          <div className="text-xs text-emerald-800 font-bold">उपचाराखालील (MDT)</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5"><AnimatedNumber value={underTreatmentCount} /></div>
          <div className="text-[11px] text-emerald-600">नियमित औषध चालू</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-amber-200 shadow-xs bg-amber-50/20 animate-fade-up" style={{ animationDelay: '140ms' }}>
          <div className="text-xs text-amber-800 font-bold">संशयित रुग्ण (Suspected)</div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5"><AnimatedNumber value={suspectedCount} /></div>
          <div className="text-[11px] text-amber-600">PHC तपासणी प्रलंबित</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-indigo-200 shadow-xs bg-indigo-50/20 animate-fade-up" style={{ animationDelay: '210ms' }}>
          <div className="text-xs text-indigo-800 font-bold">PB (Pauci-Bacillary)</div>
          <div className="text-xl sm:text-2xl font-black text-indigo-700 mt-0.5"><AnimatedNumber value={pbCount} /></div>
          <div className="text-[11px] text-indigo-600">१ ते ५ डाग असणारे</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-xs bg-rose-50/20 col-span-2 sm:col-span-1 animate-fade-up" style={{ animationDelay: '280ms' }}>
          <div className="text-xs text-rose-800 font-bold">MB (Multi-Bacillary)</div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 mt-0.5"><AnimatedNumber value={mbCount} /></div>
          <div className="text-[11px] text-rose-600">६ किंवा जास्त डाग</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-2.5 w-full items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="नाव, कुष्ठरोग नोंदणी क्र., गाव किंवा मोबाईल शोधा..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#1a4a72] outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs py-1.5 px-2.5 rounded-lg outline-none font-medium"
            >
              <option value="all">सर्व स्थिती</option>
              <option value="उपचाराखालील (Under Treatment)">उपचाराखालील</option>
              <option value="संशयित (Suspected)">संशयित</option>
              <option value="उपचार पूर्ण (RFT)">उपचार पूर्ण (RFT)</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs py-1.5 px-2.5 rounded-lg outline-none font-medium"
            >
              <option value="all">सर्व प्रकार (PB/MB)</option>
              <option value="PB (Pauci-Bacillary)">PB</option>
              <option value="MB (Multi-Bacillary)">MB</option>
            </select>
          </div>
        </div>

        <button
          id="add-leprosy-patient-btn"
          type="button"
          onClick={openAddModal}
          className="w-full md:w-auto px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन कुष्ठरुग्ण नोंदवा</span>
        </button>
      </div>

      {/* Leprosy Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5">नोंदणी क्र. / तारीख</th>
                <th className="p-2.5">रुग्णाचे नाव व वय/लिंग</th>
                <th className="p-2.5">गाव व संपर्क</th>
                <th className="p-2.5">कुष्ठरोग प्रकार</th>
                <th className="p-2.5">चट्टे संख्या</th>
                <th className="p-2.5">व्यंग प्रत (Grade)</th>
                <th className="p-2.5">सद्यस्थिती व MDT</th>
                <th className="p-2.5">शेरा</th>
                <th className="p-2.5 text-center whitespace-nowrap">कृती (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                    कोणतेही कुष्ठरुग्ण रेकॉर्ड आढळले नाही. नवीन नोंदणीसाठी वरील बटण दाबा.
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
                        <span>{p.contact}</span>
                      </div>
                    </td>

                    <td className="p-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.leprosyType.startsWith('MB')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {p.leprosyType}
                      </span>
                    </td>

                    <td className="p-2.5">
                      <span className="font-semibold text-slate-900">{p.lesionsCount} चट्टे</span>
                      {p.lesionLocation ? (
                        <div className="text-[11px] text-slate-500">{p.lesionLocation}</div>
                      ) : null}
                    </td>

                    <td className="p-2.5">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {p.deformityGrade}
                      </span>
                    </td>

                    <td className="p-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          p.category === 'उपचार पूर्ण (RFT)'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : p.category === 'उपचाराखालील (Under Treatment)'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.category}
                      </span>
                      {p.mdtStartDate && p.mdtStartDate !== '-' && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          MDT: {p.mdtStartDate}
                        </div>
                      )}
                    </td>

                    <td className="p-2.5 text-slate-600 max-w-[150px]">
                      <div className="text-[11px] truncate">{p.remarks || '-'}</div>
                    </td>

                    {/* Action Column: Edit and Delete */}
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#1a4a72] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer"
                          title="माहिती एडिट करा"
                        >
                          <Edit2 className="w-3 h-3" />
                          एडिट
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="रेकॉर्ड हटवा"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Delete Confirmation Modal (Guaranteed to work in iframe - No window.confirm) */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="कुष्ठरुग्ण नोंद हटवण्याची खात्री करा"
        itemName={deleteTarget?.name || ''}
        itemDetails={deleteTarget ? `नोंदणी क्र.: ${deleteTarget.regNo} | गाव: ${deleteTarget.village}` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Add / Edit Leprosy Patient Modal */}
      {isModalOpen && (
        <div
          id="leprosy-patient-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-purple-700 to-purple-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-200" />
                <h3 className="font-bold text-base sm:text-lg">
                  {editingPatient ? 'कुष्ठरुग्ण माहिती संपादित करा (Edit)' : 'नवीन कुष्ठरुग्ण नोंदणी (New Leprosy Patient)'}
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

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    कुष्ठरोग नोंदणी क्र. *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.regNo || ''}
                    onChange={(e) => setFormData({ ...formData, regNo: toEnglishDigits(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="उदा. NLEP-26-101"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    शोधमोहीम / तपासणी तारीख *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    रुग्णाचे पूर्ण नाव *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="उदा. भाऊराव सखाराम गिते"
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
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">लिंग *</label>
                  <select
                    value={formData.gender || 'पुरुष'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none"
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
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="उदा. पठारे वस्ती"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">मोबाईल संपर्क क्र.</label>
                  <input
                    type="text"
                    value={formData.contact || ''}
                    onChange={(e) => setFormData({ ...formData, contact: toEnglishDigits(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="10 अंकी मोबाईल क्र."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">कुष्ठरोग प्रकार (PB/MB) *</label>
                  <select
                    value={formData.leprosyType || 'PB (Pauci-Bacillary)'}
                    onChange={(e) => setFormData({ ...formData, leprosyType: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                  >
                    <option value="PB (Pauci-Bacillary)">PB (Pauci-Bacillary - १ ते ५ चट्टे)</option>
                    <option value="MB (Multi-Bacillary)">MB (Multi-Bacillary - ६ किंवा जास्त चट्टे)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">उपचार स्थिती *</label>
                  <select
                    value={formData.category || 'उपचाराखालील (Under Treatment)'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                  >
                    <option value="उपचाराखालील (Under Treatment)">उपचाराखालील (Under Treatment)</option>
                    <option value="संशयित (Suspected)">संशयित (Suspected)</option>
                    <option value="उपचार पूर्ण (RFT)">उपचार पूर्ण (RFT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    त्वचेवरील चट्टे / डागांची संख्या *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formData.lesionsCount || ''}
                    onChange={(e) => setFormData({ ...formData, lesionsCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    चट्टा कोठे आहे? (शरीरावरील स्थान)
                  </label>
                  <input
                    type="text"
                    value={formData.lesionLocation || ''}
                    onChange={(e) => setFormData({ ...formData, lesionLocation: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="उदा. पाठीवर, डाव्या हातावर, चेहऱ्यावर..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">व्यंग प्रत (Deformity Grade) *</label>
                  <select
                    value={formData.deformityGrade || 'Grade 0 (व्यंग नाही)'}
                    onChange={(e) => setFormData({ ...formData, deformityGrade: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                  >
                    <option value="Grade 0 (व्यंग नाही)">Grade 0 (व्यंग नाही)</option>
                    <option value="Grade 1 (संवेदना नष्ट)">Grade 1 (संवेदना नष्ट - Loss of Sensation)</option>
                    <option value="Grade 2 (दिसणारे व्यंग)">Grade 2 (दिसणारे व्यंग - Visible Deformity)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    MDT औषधोपचार सुरुवात तारीख
                  </label>
                  <input
                    type="text"
                    value={formData.mdtStartDate || ''}
                    onChange={(e) => setFormData({ ...formData, mdtStartDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="YYYY-MM-DD किंवा -"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">विशेष शेरा / टीप</label>
                  <input
                    type="text"
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="उदा. पाठीवर व हातावर चट्टे, नियमित MDT चालू..."
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
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
                    className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-colors"
                  >
                    {editingPatient ? 'बदल जतन करा (Save Changes)' : 'नोंद साठवा (Save Record)'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
