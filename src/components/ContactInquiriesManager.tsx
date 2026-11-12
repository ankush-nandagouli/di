import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, Calendar, Clock, CheckCircle, AlertCircle, 
  Trash2, Search, Filter, MessageSquare, ExternalLink, RefreshCw,
  Archive, Eye, User
} from 'lucide-react';
import { ContactInquiry } from '../types';
import { DakshyamDatabase } from '../utils/db';
import { notifySuccess, notifyError } from '../utils/toast';

interface ContactInquiriesManagerProps {
  theme?: 'dark' | 'light';
  onRefresh?: () => void;
}

export default function ContactInquiriesManager({ theme = 'dark', onRefresh }: ContactInquiriesManagerProps) {
  const isLight = theme === 'light';
  const [inquiries, setInquiries] = useState<ContactInquiry[]>(() => DakshyamDatabase.getContactInquiries());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'replied' | 'archived'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sync from server / local storage
  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/contact-inquiries');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.inquiries)) {
          DakshyamDatabase.saveContactInquiries(data.inquiries);
          setInquiries(data.inquiries);
          return;
        }
      }
    } catch {
      // Fallback to local store
    } finally {
      setIsLoading(false);
    }
    setInquiries(DakshyamDatabase.getContactInquiries());
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const handleUpdateStatus = (id: string, newStatus: ContactInquiry['status']) => {
    DakshyamDatabase.updateContactInquiry(id, { status: newStatus });
    setInquiries(DakshyamDatabase.getContactInquiries());
    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry(prev => prev ? { ...prev, status: newStatus } : null);
    }
    notifySuccess(`Inquiry marked as ${newStatus}`);
    if (onRefresh) onRefresh();
  };

  const handleSaveNotes = (id: string) => {
    DakshyamDatabase.updateContactInquiry(id, { notes: noteInput });
    setInquiries(DakshyamDatabase.getContactInquiries());
    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry(prev => prev ? { ...prev, notes: noteInput } : null);
    }
    notifySuccess('Inquiry notes saved.');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this contact inquiry record?')) {
      DakshyamDatabase.deleteContactInquiry(id);
      setInquiries(DakshyamDatabase.getContactInquiries());
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(null);
      }
      notifySuccess('Inquiry removed from list.');
      if (onRefresh) onRefresh();
    }
  };

  const filteredInquiries = inquiries.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const unreadCount = inquiries.filter(i => i.status === 'new').length;

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* Top Banner & Metric strip */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#0d1f38]/60 border-blue-900/40 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                isLight ? 'bg-blue-100 text-blue-950' : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                Inquiries & Form Submissions
              </span>
              {unreadCount > 0 && (
                <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse">
                  {unreadCount} New
                </span>
              )}
            </div>
            <h2 className={`text-base sm:text-lg font-black uppercase tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Contact Us Submissions & Inquiries
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Every message submitted via the public Contact Us page appears here with automated admin notifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadInquiries}
              disabled={isLoading}
              className={`p-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100' : 'bg-blue-950/60 border-blue-800/40 text-sky-300 hover:bg-blue-900/60'
              }`}
              title="Refresh Inquiries"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sender name, email, or message keyword..."
            className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none border font-sans ${
              isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-950' : 'bg-[#071326] border-blue-900/40 text-white focus:border-sky-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 font-mono text-3xs">
          {(['all', 'new', 'read', 'replied', 'archived'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl border uppercase font-bold cursor-pointer transition-all shrink-0 ${
                statusFilter === tab
                  ? (isLight ? 'bg-blue-950 text-white border-blue-950' : 'bg-white text-[#0a192f] border-white')
                  : (isLight ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' : 'bg-[#0a192f] text-slate-400 border-blue-900/40 hover:text-white')
              }`}
            >
              {tab === 'all' && `All (${inquiries.length})`}
              {tab === 'new' && `New (${inquiries.filter(i => i.status === 'new').length})`}
              {tab === 'read' && 'Read'}
              {tab === 'replied' && 'Replied'}
              {tab === 'archived' && 'Archived'}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries List & Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Cards List */}
        <div className={`space-y-3 ${selectedInquiry ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {filteredInquiries.length === 0 ? (
            <div className={`p-10 rounded-2xl border text-center space-y-2 ${
              isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#0d1f38]/40 border-blue-900/30 text-slate-400'
            }`}>
              <MessageSquare className="w-8 h-8 mx-auto opacity-50" />
              <p className="text-xs font-mono">No contact inquiries found matching the criteria.</p>
            </div>
          ) : (
            filteredInquiries.map((inq) => {
              const isSelected = selectedInquiry?.id === inq.id;
              return (
                <div
                  key={inq.id}
                  onClick={() => {
                    setSelectedInquiry(inq);
                    setNoteInput(inq.notes || '');
                    if (inq.status === 'new') {
                      handleUpdateStatus(inq.id, 'read');
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? (isLight ? 'bg-blue-50/70 border-blue-900/40 shadow-xs' : 'bg-blue-950/40 border-sky-400/60 shadow-[0_0_15px_rgba(56,189,248,0.15)]')
                      : (isLight ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs' : 'bg-[#0d1f38]/60 border-blue-900/40 hover:border-blue-700/60')
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        inq.status === 'new'
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                          : inq.status === 'replied'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : inq.status === 'archived'
                          ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          : 'bg-blue-500/20 text-sky-400 border border-blue-500/30'
                      }`}>
                        {inq.status}
                      </span>
                      <span className={`text-xs font-black uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {inq.name}
                      </span>
                      <span className="text-slate-500 text-xs font-mono">• {inq.email}</span>
                      {inq.phone && (
                        <span className="text-slate-400 text-2xs font-mono">({inq.phone})</span>
                      )}
                    </div>

                    <span className="text-3xs font-mono text-slate-400">
                      {new Date(inq.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className={`text-2xs font-mono font-bold ${isLight ? 'text-blue-950' : 'text-sky-300'}`}>
                      Subject: {inq.subject}
                    </div>
                    <p className={`text-xs line-clamp-2 leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {inq.message}
                    </p>
                  </div>

                  {inq.notes && (
                    <div className={`mt-2 text-3xs font-mono px-2 py-1 rounded border inline-block ${
                      isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/30 border-amber-500/20 text-amber-300'
                    }`}>
                      Note: {inq.notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Detailed Inquiry View Drawer */}
        {selectedInquiry && (
          <div className={`p-5 rounded-2xl border space-y-4 h-fit sticky top-24 ${
            isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-[#0d1f38]/90 border-blue-800/40 shadow-xl'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-500/10">
              <div>
                <span className="text-[9px] font-mono uppercase text-slate-500">Inquiry ID: {selectedInquiry.id}</span>
                <h3 className={`text-sm font-black uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {selectedInquiry.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-xs font-mono text-slate-400 hover:text-white p-1"
              >
                ✕ Close
              </button>
            </div>

            {/* Sender Meta details */}
            <div className={`p-3 rounded-xl border space-y-2 text-xs font-mono ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-black/30 border-blue-950 text-slate-300'
            }`}>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedInquiry.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <a href={`mailto:${selectedInquiry.email}`} className="text-sky-500 hover:underline">
                  {selectedInquiry.email}
                </a>
              </div>
              {selectedInquiry.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${selectedInquiry.phone}`} className="text-emerald-500 hover:underline">
                    {selectedInquiry.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-3xs text-slate-500 pt-1 border-t border-slate-500/10">
                <Clock className="w-3 h-3" />
                <span>Received: {new Date(selectedInquiry.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Full Message Body */}
            <div className="space-y-1.5">
              <label className="text-3xs font-mono uppercase font-bold text-slate-500 block">
                Full Message Text
              </label>
              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed font-sans whitespace-pre-wrap select-text ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#071326] border-blue-900/40 text-slate-200'
              }`}>
                {selectedInquiry.message}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-500/10">
              <label className="text-3xs font-mono uppercase font-bold text-slate-500 block">
                Update Status
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleUpdateStatus(selectedInquiry.id, 'new')}
                  className={`px-2.5 py-1 rounded-lg text-3xs font-mono font-bold border cursor-pointer ${
                    selectedInquiry.status === 'new'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-transparent text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  New
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedInquiry.id, 'read')}
                  className={`px-2.5 py-1 rounded-lg text-3xs font-mono font-bold border cursor-pointer ${
                    selectedInquiry.status === 'read'
                      ? 'bg-blue-500/20 text-sky-400 border-blue-500/40'
                      : 'bg-transparent text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Read
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedInquiry.id, 'replied')}
                  className={`px-2.5 py-1 rounded-lg text-3xs font-mono font-bold border cursor-pointer ${
                    selectedInquiry.status === 'replied'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-transparent text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Replied
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedInquiry.id, 'archived')}
                  className={`px-2.5 py-1 rounded-lg text-3xs font-mono font-bold border cursor-pointer ${
                    selectedInquiry.status === 'archived'
                      ? 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                      : 'bg-transparent text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Archive
                </button>
              </div>
            </div>

            {/* Email quick reply button */}
            <div>
              <a
                href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)} - Dakshyam Innovations`}
                onClick={() => handleUpdateStatus(selectedInquiry.id, 'replied')}
                className={`w-full py-2 px-3 rounded-xl font-mono text-2xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                  isLight ? 'bg-blue-950 text-white border-blue-950 hover:bg-blue-900' : 'bg-white text-[#0a192f] border-white hover:bg-slate-100'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open Mail Client to Reply</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>

            {/* Internal Admin Note */}
            <div className="space-y-1.5 pt-2">
              <label className="text-3xs font-mono uppercase font-bold text-slate-500 block">
                Internal Administrative Notes
              </label>
              <textarea
                rows={2}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="e.g. Assigned to Anand Gautam for school robotics demo..."
                className={`w-full rounded-xl p-2.5 text-xs focus:outline-none border font-sans resize-none ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#071326] border-blue-900/40 text-white'
                }`}
              />
              <button
                onClick={() => handleSaveNotes(selectedInquiry.id)}
                className={`text-3xs font-mono font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-blue-950 text-sky-300 border-blue-800 hover:bg-blue-900'
                }`}
              >
                Save Notes
              </button>
            </div>

            {/* Delete button */}
            <div className="pt-2 border-t border-slate-500/10">
              <button
                onClick={() => handleDelete(selectedInquiry.id)}
                className="text-3xs font-mono text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete this inquiry record
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
