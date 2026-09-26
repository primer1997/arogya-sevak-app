import React, { useState } from 'react';
import { AnimatedNumber } from './AnimatedNumber';
import { DeathRecord } from '../types';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';

interface Props { records: DeathRecord[]; onAdd: (record: DeathRecord) => void; onUpdate: (record: DeathRecord) => void; onDelete: (id: string) => void; }

const blank = (): Partial<DeathRecord> => ({ date: new Date().toISOString().split('T')[0], name: '', age: 0, gender: 'पुरुष', village: '', place: 'गावात', deathPlace: '', cause: '', remarks: '' });
const getDeathName = (record: DeathRecord) => {
  const legacy = record as DeathRecord & { deceasedName?: string; deceased_name?: string; personName?: string; fullName?: string };
  return String(record.name || legacy.deceasedName || legacy.deceased_name || legacy.personName || legacy.fullName || '').trim() || 'नाव उपलब्ध नाही';
};

export function DeathLinelistTab({ records, onAdd, onUpdate, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<DeathRecord | null>(null);
  const [form, setForm] = useState<Partial<DeathRecord>>(blank());
  const filtered = records.filter((r) => [getDeathName(r), r.village, r.cause, r.deathPlace].some((value) => String(value || '').toLowerCase().includes(search.toLowerCase())));
  const update = (key: keyof DeathRecord, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const openAdd = () => { setEditing(null); setForm(blank()); setIsOpen(true); };
  const openEdit = (record: DeathRecord) => { setEditing(record); setForm(record); setIsOpen(true); };
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!form.name?.trim() || !form.date || !form.cause?.trim()) return; const record: DeathRecord = { id: editing?.id ?? `death-${Date.now()}`, date: form.date, name: form.name.trim(), age: Number(form.age) || 0, gender: form.gender || 'पुरुष', village: form.village?.trim() || '', place: form.place || 'गावात', deathPlace: form.deathPlace?.trim() || '', cause: form.cause.trim(), remarks: form.remarks?.trim() || '' }; editing ? onUpdate(record) : onAdd(record); setIsOpen(false); };
  return <div className="space-y-4">
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 animate-fade-up" style={{ animationDelay: '0ms' }}>
            <div className="text-xs text-slate-500">एकूण मृत्यू नोंदी</div>
            <div className="text-2xl font-black text-slate-800"><AnimatedNumber value={records.length} /></div>
          </div>
          <div className="bg-white rounded-xl border border-emerald-200 p-4 animate-fade-up" style={{ animationDelay: '70ms' }}>
            <div className="text-xs text-emerald-700">गावात झालेले मृत्यू</div>
            <div className="text-2xl font-black text-emerald-700"><AnimatedNumber value={records.filter((r) => r.place === 'गावात').length} /></div>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-4 animate-fade-up" style={{ animationDelay: '140ms' }}>
            <div className="text-xs text-amber-700">गावाबाहेर झालेले मृत्यू</div>
            <div className="text-2xl font-black text-amber-700"><AnimatedNumber value={records.filter((r) => r.place === 'गावाबाहेर').length} /></div>
          </div>
        </div>
    <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row gap-2 justify-between"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><input aria-label="मृत्यू नोंद शोधा" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="नाव, गाव, मृत्यूचे कारण शोधा..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm" /></div><button type="button" onClick={openAdd} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1a4a72] text-white px-4 py-2 text-sm font-bold"><Plus className="w-4 h-4" />मृत्यू नोंदवा</button></div>
    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-3 text-left">मृत्यू दिनांक</th><th className="p-3 text-left">नाव / वय</th><th className="p-3 text-left">गाव</th><th className="p-3 text-left">मृत्यू कोठे झाला</th><th className="p-3 text-left">मृत्यूचे कारण</th><th className="p-3">कृती</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id} className="border-t border-slate-100"><td className="p-3 whitespace-nowrap">{r.date}</td><td className="p-3 font-semibold text-slate-900">{getDeathName(r)}<div className="text-xs text-slate-500">{r.age} वर्षे, {r.gender}</div></td><td className="p-3">{r.village || '—'}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${r.place === 'गावात' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{r.place}</span>{r.deathPlace && <div className="text-xs text-slate-500 mt-1">{r.deathPlace}</div>}</td><td className="p-3">{r.cause}</td><td className="p-3"><div className="flex justify-center gap-1"><button type="button" onClick={() => openEdit(r)} aria-label="मृत्यू नोंद संपादित करा" className="p-2 text-blue-700 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button><button type="button" onClick={() => onDelete(r.id)} aria-label="मृत्यू नोंद हटवा" className="p-2 text-red-700 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="p-8 text-center text-slate-500">मृत्यूची नोंद उपलब्ध नाही.</div>}</div>
    {isOpen && <div className="fixed inset-0 z-50 bg-slate-900/50 p-4 flex items-center justify-center animate-fade-in"><form onSubmit={submit} className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4 animate-scale-in"><div className="flex items-center justify-between"><h2 className="text-lg font-black text-[#1a4a72]">{editing ? 'मृत्यू नोंद संपादित करा' : 'मृत्यूची नवीन नोंद'}</h2><button type="button" onClick={() => setIsOpen(false)} aria-label="बंद करा"><X /></button></div><div className="grid sm:grid-cols-2 gap-3">{([['name','मृत व्यक्तीचे नाव','text'],['village','गाव / वस्ती','text'],['deathPlace','मृत्यूचे ठिकाण','text'],['cause','मृत्यूचे कारण','text']] as const).map(([key,label,type]) => <label key={key} className="text-sm font-semibold text-slate-700">{label}<input required={key !== 'village' && key !== 'deathPlace'} type={type} value={String(form[key] ?? '')} onChange={(e) => update(key, e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label>)}<label className="text-sm font-semibold text-slate-700">मृत्यू दिनांक<input required type="date" value={form.date ?? ''} onChange={(e) => update('date', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label><label className="text-sm font-semibold text-slate-700">वय<input type="number" min="0" value={form.age ?? 0} onChange={(e) => update('age', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label><label className="text-sm font-semibold text-slate-700">लिंग<select value={form.gender} onChange={(e) => update('gender', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"><option>पुरुष</option><option>स्त्री</option><option>इतर</option></select></label><label className="text-sm font-semibold text-slate-700">मृत्यूचे ठिकाण<select value={form.place} onChange={(e) => update('place', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"><option>गावात</option><option>गावाबाहेर</option></select></label><label className="text-sm font-semibold text-slate-700 sm:col-span-2">शेरा<textarea value={form.remarks ?? ''} onChange={(e) => update('remarks', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" rows={2} /></label></div><button type="submit" className="w-full rounded-lg bg-[#1a4a72] text-white py-2.5 font-bold">नोंद जतन करा</button></form></div>}
  </div>;
}
