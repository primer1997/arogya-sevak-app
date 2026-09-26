import React, { useState } from 'react';
import { AnimatedNumber } from './AnimatedNumber';
import { TbPatientRecord } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  HeartPulse,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  MapPin,
  X,
  CreditCard,
} from 'lucide-react';
import { NumberInput } from './common/NumberInput';
import { toEnglishDigits } from '../utils/dateUtils';

interface TbLinelistTabProps {
  patients: TbPatientRecord[];
  onAddPatient: (patient: TbPatientRecord) => void;
  onUpdatePatient: (patient: TbPatientRecord) => void;
  onDeletePatient: (id: string) => void;
}

export function TbLinelistTab({
  patients,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
}: TbLinelistTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<TbPatientRecord | null>(null);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<TbPatientRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<TbPatientRecord>>({
    regNo: '',
    date: new Date().toISOString().split('T')[0],
    name: '',
    age: 35,
    gender: 'पुरुष',
    village: '',
    contact: '',
    tbType: 'फुफ्फुसीय (Pulmonary)',
    category: 'उपचाराखालील (Under Treatment)',
    treatmentStartDate: new Date().toISOString().split('T')[0],
    dotsProvider: 'आरोग्य सेवक / आशा कार्यकर्ती',
    hivStatus: 'निगेटिव्ह',
    bankDetailsAdded: 'होय',
    remarks: '',
  });

  const openAddModal = () => {
    setEditingPatient(null);
    setFormData({
      regNo: `NK-26-${Math.floor(8000 + Math.random() * 1999)}`,
      date: new Date().toISOString().split('T')[0],
      name: '',
      age: 35,
      gender: 'पुरुष',
      village: '',
      contact: '',
      tbType: 'फुफ्फुसीय (Pulmonary)',
      category: 'उपचाराखालील (Under Treatment)',
      treatmentStartDate: new Date().toISOString().split('T')[0],
      dotsProvider: 'आरोग्य सेवक / आशा कार्यकर्ती',
      hivStatus: 'निगेटिव्ह',
      bankDetailsAdded: 'होय',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: TbPatientRecord) => {
    setEditingPatient(p);
    setFormData({ ...p });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingPatient) {
      const updated: TbPatientRecord = {
        ...editingPatient,
        regNo: formData.regNo || editingPatient.regNo,
        date: formData.date || editingPatient.date,
        name: formData.name,
        age: Number(formData.age) || 0,
        gender: formData.gender || 'पुरुष',
        village: formData.village || '',
        contact: formData.contact || '',
        tbType: formData.tbType || 'फुफ्फुसीय (Pulmonary)',
        category: formData.category || 'उपचाराखालील (Under Treatment)',
        treatmentStartDate: formData.treatmentStartDate || '-',
        dotsProvider: formData.dotsProvider || '',
        hivStatus: formData.hivStatus || 'निगेटिव्ह',
        bankDetailsAdded: formData.bankDetailsAdded || 'नाही',
        remarks: formData.remarks || '',
      };
      onUpdatePatient(updated);
    } else {
      const newRecord: TbPatientRecord = {
        id: 'tb-' + Date.now(),
        regNo: formData.regNo || `NK-26-${Math.floor(8000 + Math.random() * 1999)}`,
        date: formData.date || new Date().toISOString().split('T')[0],
        name: formData.name,
        age: Number(formData.age) || 0,
        gender: formData.gender || 'पुरुष',
        village: formData.village || '',
        contact: formData.contact || '',
        tbType: formData.tbType || 'फुफ्फुसीय (Pulmonary)',
        category: formData.category || 'उपचाराखालील (Under Treatment)',
        treatmentStartDate: formData.treatmentStartDate || '-',
        dotsProvider: formData.dotsProvider || '',
        hivStatus: formData.hivStatus || 'निगेटिव्ह',
        bankDetailsAdded: formData.bankDetailsAdded || 'नाही',
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
    const matchesType = typeFilter === 'all' || p.tbType === typeFilter;
    return matchesSearch && matchesCat && matchesType;
  });

  // Metrics
  const totalTb = patients.length;
  const underTreatmentCount = patients.filter((p) => p.category === 'उपचाराखालील (Under Treatment)').length;
  const suspectedCount = patients.filter((p) => p.category === 'संशयित (Suspected)').length;
  const curedCount = patients.filter((p) => p.category === 'उपचार पूर्ण (Cured)').length;
  const bankAddedCount = patients.filter((p) => p.bankDetailsAdded === 'होय').length;

  // संशयित स्थितीत उपचार-संबंधित फील्ड्स निष्क्रिय होतात
  const isSuspected = (formData.category || 'उपचाराखालील (Under Treatment)') === 'संशयित (Suspected)';

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs animate-fade-up" style={{ animationDelay: '0ms' }}>
          <div className="text-xs text-slate-500 font-medium">एकूण क्षयरुग्ण नोंदणी</div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 mt-0.5"><AnimatedNumber value={totalTb} /></div>
          <div className="text-[11px] text-slate-400">निक्षय पोर्टल ट्रॅकिंग</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-xs bg-emerald-50/20 animate-fade-up" style={{ animationDelay: '70ms' }}>
          <div className="text-xs text-emerald-800 font-bold">उपचाराखालील (DOTS)</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5"><AnimatedNumber value={underTreatmentCount} /></div>
          <div className="text-[11px] text-emerald-600">औषध सुरू असलेले</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-amber-200 shadow-xs bg-amber-50/20 animate-fade-up" style={{ animationDelay: '140ms' }}>
          <div className="text-xs text-amber-800 font-bold">संशयित रुग्ण (Suspected)</div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5"><AnimatedNumber value={suspectedCount} /></div>
          <div className="text-[11px] text-amber-600">थुंकी/CBNAAT तपासणी</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-blue-200 shadow-xs bg-blue-50/20 animate-fade-up" style={{ animationDelay: '210ms' }}>
          <div className="text-xs text-blue-800 font-bold">उपचार पूर्ण (Cured)</div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-0.5"><AnimatedNumber value={curedCount} /></div>
          <div className="text-[11px] text-blue-600">मुक्त झालेले</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-purple-200 shadow-xs bg-purple-50/20 col-span-2 sm:col-span-1 animate-fade-up" style={{ animationDelay: '280ms' }}>
          <div className="text-xs text-purple-800 font-bold">निक्षय पोषण बँक जोडली</div>
          <div className="text-xl sm:text-2xl font-black text-purple-700 mt-0.5"><AnimatedNumber value={bankAddedCount} /></div>
          <div className="text-[11px] text-purple-600">आर्थिक सहाय्य लाभार्थी</div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Add Button */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-2.5 w-full items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="नाव, निक्षय क्र., गाव किंवा मोबाईल शोधा..."
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
              <option value="उपचार पूर्ण (Cured)">उपचार पूर्ण</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs py-1.5 px-2.5 rounded-lg outline-none font-medium"
            >
              <option value="all">सर्व प्रकार</option>
              <option value="फुफ्फुसीय (Pulmonary)">फुफ्फुसीय</option>
              <option value="फुफ्फुसेतर (Extra-Pulmonary)">फुफ्फुसेतर</option>
            </select>
          </div>
        </div>

        <button
          id="add-tb-patient-btn"
          type="button"
          onClick={openAddModal}
          className="w-full md:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन क्षयरुग्ण नोंदवा</span>
        </button>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5">निक्षय आयडी / नोंदणी</th>
                <th className="p-2.5">रुग्णाचे नाव व वय/लिंग</th>
                <th className="p-2.5">गाव व संपर्क</th>
                <th className="p-2.5">टीबी प्रकार</th>
                <th className="p-2.5">सद्यस्थिती</th>
                <th className="p-2.5">डॉट्स प्रदाता</th>
                <th className="p-2.5">निक्षय पोषण</th>
                <th className="p-2.5 text-center whitespace-nowrap">कृती (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    कोणतेही क्षयरुग्ण रेकॉर्ड आढळले नाही. नवीन रुग्ण नोंदवण्यासाठी वरील बटण दाबा.
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
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {p.tbType}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">HIV: {p.hivStatus}</div>
                    </td>

                    <td className="p-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          p.category === 'उपचार पूर्ण (Cured)'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : p.category === 'उपचाराखालील (Under Treatment)'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.category}
                      </span>
                      {p.treatmentStartDate && p.treatmentStartDate !== '-' && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          सुरुवात: {p.treatmentStartDate}
                        </div>
                      )}
                    </td>

                    <td className="p-2.5 text-slate-700">
                      <div className="text-xs font-medium">{p.dotsProvider}</div>
                      {p.remarks && (
                        <div className="text-[10px] text-slate-400 max-w-[150px] truncate">
                          {p.remarks}
                        </div>
                      )}
                    </td>

                    <td className="p-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          p.bankDetailsAdded === 'होय'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <CreditCard className="w-3 h-3" />
                        बँक: {p.bankDetailsAdded}
                      </span>
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
        title="क्षयरुग्ण नोंद हटवण्याची खात्री करा"
        itemName={deleteTarget?.name || ''}
        itemDetails={deleteTarget ? `निक्षय आयडी: ${deleteTarget.regNo} | गाव: ${deleteTarget.village}` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Add / Edit TB Patient Modal */}
      {isModalOpen && (
        <div
          id="tb-patient-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-rose-700 to-rose-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-200" />
                <h3 className="font-bold text-base sm:text-lg">
                  {editingPatient ? 'क्षयरुग्ण माहिती संपादित करा (Edit)' : 'नवीन क्षयरुग्ण नोंदणी (New TB Patient)'}
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
                    निक्षय आयडी / नोंदणी क्र. *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.regNo || ''}
                    onChange={(e) => setFormData({ ...formData, regNo: toEnglishDigits(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:ring-1 focus:ring-rose-500 outline-none"
                    placeholder="उदा. NK-26-8801"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    नोंदणी तारीख *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-rose-500 outline-none"
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
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:ring-1 focus:ring-rose-500 outline-none"
                    placeholder="उदा. सदाशिव विठोबा शिंदे"
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
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">लिंग *</label>
                  <select
                    value={formData.gender || 'पुरुष'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-rose-500 outline-none"
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
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-rose-500 outline-none"
                    placeholder="उदा. शिंदे मळा"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">मोबाईल संपर्क क्र.</label>
                  <input
                    type="text"
                    value={formData.contact || ''}
                    onChange={(e) => setFormData({ ...formData, contact: toEnglishDigits(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:ring-1 focus:ring-rose-500 outline-none"
                    placeholder="10 अंकी मोबाईल क्र."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">टीबी प्रकार *</label>
                  <select
                    value={formData.tbType || 'फुफ्फुसीय (Pulmonary)'}
                    onChange={(e) => setFormData({ ...formData, tbType: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-rose-500 outline-none"
                  >
                    <option value="फुफ्फुसीय (Pulmonary)">फुफ्फुसीय (Pulmonary)</option>
                    <option value="फुफ्फुसेतर (Extra-Pulmonary)">फुफ्फुसेतर (Extra-Pulmonary)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">उपचार स्थिती *</label>
                  <select
                    value={formData.category || 'उपचाराखालील (Under Treatment)'}
                    onChange={(e) => {
                      const v = e.target.value as any;
                      if (v === 'संशयित (Suspected)') {
                        // संशयित रुग्णाला उपचार-संबंधित माहिती लागू नाही — ती रिकामी करा
                        setFormData({ ...formData, category: v, treatmentStartDate: '', dotsProvider: '', hivStatus: 'तपासणी केली नाही / अज्ञात' as any, bankDetailsAdded: 'नाही' as any });
                      } else {
                        setFormData({ ...formData, category: v });
                      }
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-rose-500 outline-none"
                  >
                    <option value="उपचाराखालील (Under Treatment)">उपचाराखालील (Under Treatment)</option>
                    <option value="संशयित (Suspected)">संशयित (Suspected)</option>
                    <option value="उपचार पूर्ण (Cured)">उपचार पूर्ण (Cured)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">स्थिती "संशयित" निवडल्यास खालील उपचार-संबंधित माहिती आपोआप निष्क्रिय होईल.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    डॉट्स उपचार सुरू दिनांक
                  </label>
                  <input
                    type="text"
                    value={formData.treatmentStartDate || ''}
                    onChange={(e) => setFormData({ ...formData, treatmentStartDate: e.target.value })}
                    disabled={isSuspected}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-rose-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    placeholder="YYYY-MM-DD किंवा -"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    डॉट्स प्रदाता (DOTS Provider)
                  </label>
                  <input
                    type="text"
                    value={formData.dotsProvider || ''}
                    onChange={(e) => setFormData({ ...formData, dotsProvider: e.target.value })}
                    disabled={isSuspected}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-rose-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    placeholder="उदा. आशा कार्यकर्ती / आरोग्य सेवक / कुटुंबिय"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">HIV तपासणी स्थिती</label>
                  <select
                    value={formData.hivStatus || 'निगेटिव्ह'}
                    onChange={(e) => setFormData({ ...formData, hivStatus: e.target.value as any })}
                    disabled={isSuspected}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-rose-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <option value="निगेटिव्ह">निगेटिव्ह (Negative)</option>
                    <option value="पॉझिटिव्ह">पॉझिटिव्ह (Positive)</option>
                    <option value="तपासणी केली नाही / अज्ञात">तपासणी केली नाही / अज्ञात</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    निक्षय पोषण योजना - बँक जोडली?
                  </label>
                  <select
                    value={formData.bankDetailsAdded || 'होय'}
                    onChange={(e) => setFormData({ ...formData, bankDetailsAdded: e.target.value as any })}
                    disabled={isSuspected}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-rose-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <option value="होय">होय (बँक तपशील जोडले आहेत)</option>
                    <option value="नाही">नाही (प्रलंबित आहे)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">विशेष शेरा / टीप</label>
                  <input
                    type="text"
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-rose-500 outline-none"
                    placeholder="उदा. २ महिन्यांचा फेझ पूर्ण, वजन सुधारले..."
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
                    className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
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
