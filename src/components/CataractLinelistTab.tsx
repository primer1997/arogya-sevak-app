import React, { useState } from 'react';
import { AnimatedNumber } from './AnimatedNumber';
import { CataractPatientRecord } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  X,
  Hospital,
} from 'lucide-react';
import { NumberInput } from './common/NumberInput';
import { toEnglishDigits } from '../utils/dateUtils';

interface CataractLinelistTabProps {
  patients: CataractPatientRecord[];
  onAddPatient: (patient: CataractPatientRecord) => void;
  onUpdatePatient: (patient: CataractPatientRecord) => void;
  onDeletePatient: (id: string) => void;
}

export function CataractLinelistTab({
  patients,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
}: CataractLinelistTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eyeFilter, setEyeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<CataractPatientRecord | null>(null);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<CataractPatientRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CataractPatientRecord>>({
    regNo: '',
    date: new Date().toISOString().split('T')[0],
    name: '',
    age: 65,
    gender: 'पुरुष',
    village: '',
    contact: '',
    affectedEye: 'दोन्ही डोळे',
    visualAcuity: '< 6/60',
    screeningSite: 'उपकेंद्र नेत्र तपासणी शिबिर',
    surgeryStatus: 'संशयित / प्रलंबित',
    surgeryDate: '',
    hospitalName: 'जिल्हा सामान्य रुग्णालय',
    remarks: '',
  });

  const openAddModal = () => {
    setEditingPatient(null);
    setFormData({
      regNo: `CAT-26-${Math.floor(10 + Math.random() * 89)}`,
      date: new Date().toISOString().split('T')[0],
      name: '',
      age: 65,
      gender: 'पुरुष',
      village: '',
      contact: '',
      affectedEye: 'दोन्ही डोळे',
      visualAcuity: '< 6/60',
      screeningSite: 'उपकेंद्र नेत्र तपासणी शिबिर',
      surgeryStatus: 'संशयित / प्रलंबित',
      surgeryDate: '',
      hospitalName: 'जिल्हा सामान्य रुग्णालय',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: CataractPatientRecord) => {
    setEditingPatient(p);
    setFormData({ ...p });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingPatient) {
      const updated: CataractPatientRecord = {
        ...editingPatient,
        regNo: formData.regNo || editingPatient.regNo,
        date: formData.date || editingPatient.date,
        name: formData.name,
        age: Number(formData.age) || 0,
        gender: formData.gender || 'पुरुष',
        village: formData.village || '',
        contact: formData.contact || '',
        affectedEye: formData.affectedEye || 'दोन्ही डोळे',
        visualAcuity: formData.visualAcuity || '< 6/60',
        screeningSite: formData.screeningSite || '',
        surgeryStatus: formData.surgeryStatus || 'संशयित / प्रलंबित',
        surgeryDate: formData.surgeryDate || '',
        hospitalName: formData.hospitalName || '',
        remarks: formData.remarks || '',
      };
      onUpdatePatient(updated);
    } else {
      const newRecord: CataractPatientRecord = {
        id: 'cat-' + Date.now(),
        regNo: formData.regNo || `CAT-26-${Math.floor(10 + Math.random() * 89)}`,
        date: formData.date || new Date().toISOString().split('T')[0],
        name: formData.name,
        age: Number(formData.age) || 0,
        gender: formData.gender || 'पुरुष',
        village: formData.village || '',
        contact: formData.contact || '',
        affectedEye: formData.affectedEye || 'दोन्ही डोळे',
        visualAcuity: formData.visualAcuity || '< 6/60',
        screeningSite: formData.screeningSite || '',
        surgeryStatus: formData.surgeryStatus || 'संशयित / प्रलंबित',
        surgeryDate: formData.surgeryDate || '',
        hospitalName: formData.hospitalName || '',
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

    const matchesStatus = statusFilter === 'all' || p.surgeryStatus === statusFilter;
    const matchesEye = eyeFilter === 'all' || p.affectedEye === eyeFilter;
    return matchesSearch && matchesStatus && matchesEye;
  });

  // Metrics
  const totalCount = patients.length;
  const operatedCount = patients.filter((p) => p.surgeryStatus === 'शस्त्रक्रिया पूर्ण झाली').length;
  const pendingCount = patients.filter((p) => p.surgeryStatus === 'संशयित / प्रलंबित').length;
  const bothEyesCount = patients.filter((p) => p.affectedEye === 'दोन्ही डोळे').length;
  const seniorCount = patients.filter((p) => p.age >= 60).length;

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs animate-fade-up" style={{ animationDelay: '0ms' }}>
          <div className="text-xs text-slate-500 font-medium">एकूण तपासलेले मोतीबिंदू</div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5"><AnimatedNumber value={totalCount} /></div>
          <div className="text-[11px] text-slate-400">NPCB लाईनलिस्ट</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-xs bg-emerald-50/20 animate-fade-up" style={{ animationDelay: '70ms' }}>
          <div className="text-xs text-emerald-800 font-bold">शस्त्रक्रिया पूर्ण (Operated)</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5"><AnimatedNumber value={operatedCount} /></div>
          <div className="text-[11px] text-emerald-600">यशस्वी ऑपरेशन व लेन्स</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-amber-200 shadow-xs bg-amber-50/20 animate-fade-up" style={{ animationDelay: '140ms' }}>
          <div className="text-xs text-amber-800 font-bold">संशयित / प्रलंबित (Pending)</div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5"><AnimatedNumber value={pendingCount} /></div>
          <div className="text-[11px] text-amber-600">शिबिरासाठी नोंद केलेले</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-blue-200 shadow-xs bg-blue-50/20 animate-fade-up" style={{ animationDelay: '210ms' }}>
          <div className="text-xs text-blue-800 font-bold">दोन्ही डोळे बाधित</div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-0.5"><AnimatedNumber value={bothEyesCount} /></div>
          <div className="text-[11px] text-blue-600">प्राधान्य रुग्ण</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs col-span-2 sm:col-span-1 animate-fade-up" style={{ animationDelay: '280ms' }}>
          <div className="text-xs text-slate-700 font-bold">ज्येष्ठ नागरिक (६०+)</div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5"><AnimatedNumber value={seniorCount} /></div>
          <div className="text-[11px] text-slate-500">वृद्ध रुग्ण संख्या</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-2.5 w-full items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="नाव, मोतीबिंदू नोंद क्र., गाव किंवा मोबाईल शोधा..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#1a4a72] outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs py-1.5 px-2.5 rounded-lg outline-none font-medium"
            >
              <option value="all">सर्व स्थिती</option>
              <option value="शस्त्रक्रिया पूर्ण झाली">शस्त्रक्रिया पूर्ण</option>
              <option value="संशयित / प्रलंबित">संशयित / प्रलंबित</option>
              <option value="शस्त्रक्रियेस नकार / अनफिट">नकार / अनफिट</option>
            </select>

            <select
              value={eyeFilter}
              onChange={(e) => setEyeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs py-1.5 px-2.5 rounded-lg outline-none font-medium"
            >
              <option value="all">सर्व डोळे</option>
              <option value="दोन्ही डोळे">दोन्ही डोळे</option>
              <option value="उजवा डोळा">उजवा डोळा</option>
              <option value="डावा डोळा">डावा डोळा</option>
            </select>
          </div>
        </div>

        <button
          id="add-cataract-patient-btn"
          type="button"
          onClick={openAddModal}
          className="w-full md:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन मोतीबिंदू रुग्ण नोंदवा</span>
        </button>
      </div>

      {/* Cataract Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5">नोंदणी क्र. / तारीख</th>
                <th className="p-2.5">रुग्णाचे नाव व वय/लिंग</th>
                <th className="p-2.5">गाव व संपर्क</th>
                <th className="p-2.5">बाधित डोळा</th>
                <th className="p-2.5">दृष्टीदोष</th>
                <th className="p-2.5">तपासणी ठिकाण</th>
                <th className="p-2.5">शस्त्रक्रिया स्थिती</th>
                <th className="p-2.5">रुग्णालय व शेरा</th>
                <th className="p-2.5 text-center whitespace-nowrap">कृती (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                    कोणतेही मोतीबिंदू रुग्ण रेकॉर्ड आढळले नाही. नवीन नोंदणीसाठी वरील बटण दाबा.
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
                          p.affectedEye === 'दोन्ही डोळे'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {p.affectedEye}
                      </span>
                    </td>

                    <td className="p-2.5">
                      <span className="font-medium text-slate-800">{p.visualAcuity}</span>
                    </td>

                    <td className="p-2.5 text-slate-600">
                      <div className="text-[11px]">{p.screeningSite}</div>
                    </td>

                    <td className="p-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          p.surgeryStatus === 'शस्त्रक्रिया पूर्ण झाली'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.surgeryStatus === 'संशयित / प्रलंबित'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {p.surgeryStatus}
                      </span>
                      {p.surgeryDate && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          दिनांक: {p.surgeryDate}
                        </div>
                      )}
                    </td>

                    <td className="p-2.5 text-slate-600 max-w-[170px]">
                      {p.hospitalName && (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700 truncate">
                          <Hospital className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{p.hospitalName}</span>
                        </div>
                      )}
                      {p.remarks && <div className="text-[10px] text-slate-400 truncate">{p.remarks}</div>}
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
        title="मोतीबिंदू रुग्ण नोंद हटवण्याची खात्री करा"
        itemName={deleteTarget?.name || ''}
        itemDetails={deleteTarget ? `नोंदणी क्र.: ${deleteTarget.regNo} | गाव: ${deleteTarget.village}` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Add / Edit Cataract Patient Modal */}
      {isModalOpen && (
        <div
          id="cataract-patient-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-base sm:text-lg">
                  {editingPatient ? 'मोतीबिंदू रुग्ण माहिती संपादित करा (Edit)' : 'नवीन मोतीबिंदू रुग्ण नोंदणी (New Cataract Patient)'}
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
                    मोतीबिंदू नोंदणी क्र. *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.regNo || ''}
                    onChange={(e) => setFormData({ ...formData, regNo: toEnglishDigits(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:ring-1 focus:ring-amber-500 outline-none"
                    placeholder="उदा. CAT-26-01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    तपासणी तारीख *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-amber-500 outline-none"
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
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                    placeholder="उदा. मारुती बाजीराव वाघ"
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
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">लिंग *</label>
                  <select
                    value={formData.gender || 'पुरुष'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-amber-500 outline-none"
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
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                    placeholder="उदा. वडगाव गुप्ता गावठाण"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">मोबाईल संपर्क क्र.</label>
                  <input
                    type="text"
                    value={formData.contact || ''}
                    onChange={(e) => setFormData({ ...formData, contact: toEnglishDigits(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:ring-1 focus:ring-amber-500 outline-none"
                    placeholder="10 अंकी मोबाईल क्र."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">बाधित डोळा *</label>
                  <select
                    value={formData.affectedEye || 'दोन्ही डोळे'}
                    onChange={(e) => setFormData({ ...formData, affectedEye: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    <option value="दोन्ही डोळे">दोन्ही डोळे (Both Eyes)</option>
                    <option value="उजवा डोळा">उजवा डोळा (Right Eye)</option>
                    <option value="डावा डोळा">डावा डोळा (Left Eye)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">दृष्टीदोष (Visual Acuity) *</label>
                  <input
                    type="text"
                    required
                    value={formData.visualAcuity || ''}
                    onChange={(e) => setFormData({ ...formData, visualAcuity: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                    placeholder="उदा. < 6/60, बोटे मोजणे, प्रकाशाची जाणीव"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">तपासणी ठिकाण *</label>
                  <input
                    type="text"
                    required
                    value={formData.screeningSite || ''}
                    onChange={(e) => setFormData({ ...formData, screeningSite: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                    placeholder="उदा. उपकेंद्र नेत्र तपासणी शिबिर / PHC"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">शस्त्रक्रिया स्थिती *</label>
                  <select
                    value={formData.surgeryStatus || 'संशयित / प्रलंबित'}
                    onChange={(e) => setFormData({ ...formData, surgeryStatus: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    <option value="संशयित / प्रलंबित">संशयित / प्रलंबित (Pending Surgery)</option>
                    <option value="शस्त्रक्रिया पूर्ण झाली">शस्त्रक्रिया पूर्ण झाली (Operated)</option>
                    <option value="शस्त्रक्रियेस नकार / अनफिट">शस्त्रक्रियेस नकार / अनफिट (Unfit / Refused)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    शस्त्रक्रिया दिनांक (झाली असल्यास)
                  </label>
                  <input
                    type="text"
                    value={formData.surgeryDate || ''}
                    onChange={(e) => setFormData({ ...formData, surgeryDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                    placeholder="YYYY-MM-DD किंवा प्रलंबित"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    शस्त्रक्रिया रुग्णालय नाव (Hospital Name)
                  </label>
                  <input
                    type="text"
                    value={formData.hospitalName || ''}
                    onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                    placeholder="उदा. जिल्हा सामान्य रुग्णालय अहमदनगर / लायन्स ट्रस्ट नेत्र रुग्णालय"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">विशेष शेरा / टीप</label>
                  <input
                    type="text"
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                    placeholder="उदा. IOL लेन्स यशस्वी, चष्मा दिला..."
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
                    className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
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
