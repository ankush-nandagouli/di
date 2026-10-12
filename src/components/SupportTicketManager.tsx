import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LifeBuoy, Plus, AlertCircle, CheckCircle2, Clock, Send, 
  MessageSquare, Trash2, Filter, Search, ShieldCheck, ChevronRight,
  Sparkles, Check, RefreshCw, X, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from '../types';
import { DakshyamDatabase } from '../utils/db';
import { notifySuccess, notifyError, notifyInfo } from '../utils/toast';

interface SupportTicketManagerProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'trainer' | 'admin';
  };
  theme?: 'light' | 'dark';
  isAdminView?: boolean;
}

export default function SupportTicketManager({
  currentUser,
  theme = 'dark',
  isAdminView = false
}: SupportTicketManagerProps) {
  const isLight = theme === 'light';

  const [tickets, setTickets] = useState<SupportTicket[]>(() => DakshyamDatabase.getTickets());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TicketCategory>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TicketPriority>('ALL');

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('BUG');
  const [priority, setPriority] = useState<TicketPriority>('NORMAL');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Response & Resolution State
  const [adminResponseText, setAdminResponseText] = useState('');
  const [newStatus, setNewStatus] = useState<TicketStatus>('RESOLVED');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Load tickets on mount & sync
  const refreshTickets = () => {
    try {
      const data = DakshyamDatabase.getTickets();
      setTickets(data);
      if (selectedTicket) {
        const updated = data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.warn('Failed to refresh tickets:', err);
    }
  };

  useEffect(() => {
    refreshTickets();
    const interval = setInterval(refreshTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filtered tickets
  const filteredTickets = tickets.filter(ticket => {
    // If not admin view, only show tickets created by current user
    if (!isAdminView && ticket.userEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
      return false;
    }

    if (statusFilter !== 'ALL' && ticket.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && ticket.category !== categoryFilter) return false;
    if (priorityFilter !== 'ALL' && ticket.priority !== priorityFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchSubject = ticket.subject.toLowerCase().includes(q);
      const matchDesc = ticket.description.toLowerCase().includes(q);
      const matchId = ticket.id.toLowerCase().includes(q);
      const matchUser = ticket.userName.toLowerCase().includes(q) || ticket.userEmail.toLowerCase().includes(q);
      return matchSubject || matchDesc || matchId || matchUser;
    }

    return true;
  });

  // Handle ticket creation
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      notifyError('Please enter a ticket subject and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTicket = DakshyamDatabase.createTicket({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: currentUser.role,
        category,
        priority,
        subject: subject.trim(),
        description: description.trim()
      });

      notifySuccess(`Support Ticket [${newTicket.id}] logged successfully! Dakshyam administrators have been notified.`);
      setSubject('');
      setDescription('');
      setCategory('BUG');
      setPriority('NORMAL');
      setIsCreateModalOpen(false);
      refreshTickets();
      setSelectedTicket(newTicket);
    } catch {
      notifyError('Failed to log ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Admin Resolution / Response
  const handleAdminUpdateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsUpdatingStatus(true);
    try {
      const updates: Partial<SupportTicket> = {
        status: newStatus,
        adminResponse: adminResponseText.trim() || selectedTicket.adminResponse
      };

      DakshyamDatabase.updateTicket(selectedTicket.id, updates);
      notifySuccess(`Ticket [${selectedTicket.id}] updated to ${newStatus}.`);
      refreshTickets();
    } catch {
      notifyError('Failed to update ticket status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Ticket Deletion (Admin only or user if closed)
  const handleDeleteTicket = (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this support ticket?')) return;
    try {
      DakshyamDatabase.deleteTicket(id);
      notifySuccess(`Ticket [${id}] removed.`);
      if (selectedTicket?.id === id) setSelectedTicket(null);
      refreshTickets();
    } catch {
      notifyError('Failed to delete ticket.');
    }
  };

  // KPI calculations
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const underReviewCount = tickets.filter(t => t.status === 'UNDER_REVIEW').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isLight 
          ? 'bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 border-blue-900/15' 
          : 'bg-gradient-to-br from-[#0a192f] via-[#0d223d] to-[#0a192f] border-blue-800/40'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
            isLight ? 'bg-amber-100/70 border-amber-300 text-amber-900' : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
          }`}>
            <LifeBuoy className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-sky-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {isAdminView ? 'Administration Center' : 'Candidate & Staff Services'}
            </span>
            <h2 className={`text-xl sm:text-2xl font-black uppercase font-mono tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Support Tickets & Bug Reports
            </h2>
            <p className={`text-xs mt-0.5 max-w-xl ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {isAdminView 
                ? 'Review user bug reports, system errors, and improvement recommendations with official administrative responses.'
                : 'Report any problems, software bugs, or recommend new features. Our administrative engineering team will review and resolve.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={refreshTickets}
            className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-blue-900/40 hover:bg-white/5 text-slate-300'
            }`}
            title="Refresh tickets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-all ${
              isLight 
                ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-blue-950/20' 
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-cyan-500/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Ticket</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-mono">
        <div className={`p-4 rounded-2xl border ${
          isLight ? 'bg-white border-blue-900/10' : 'bg-[#0d1f38] border-blue-900/30'
        }`}>
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Logged</div>
          <div className="text-2xl font-black mt-1 text-sky-400">{totalCount}</div>
        </div>
        <div className={`p-4 rounded-2xl border ${
          isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-500/30'
        }`}>
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500">Open Tickets</div>
          <div className="text-2xl font-black mt-1 text-amber-400">{openCount}</div>
        </div>
        <div className={`p-4 rounded-2xl border ${
          isLight ? 'bg-purple-50/60 border-purple-200' : 'bg-purple-950/20 border-purple-500/30'
        }`}>
          <div className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Under Review</div>
          <div className="text-2xl font-black mt-1 text-purple-400">{underReviewCount}</div>
        </div>
        <div className={`p-4 rounded-2xl border ${
          isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/30'
        }`}>
          <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">Resolved</div>
          <div className="text-2xl font-black mt-1 text-emerald-400">{resolvedCount}</div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#071326] border-blue-900/30'
      }`}>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by ID, title, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none ${
              isLight 
                ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-900' 
                : 'bg-[#0a192f] border-blue-900/40 text-white focus:border-cyan-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={`px-3 py-2 rounded-xl border text-2xs uppercase font-bold focus:outline-none cursor-pointer ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-[#0a192f] border-blue-900/40 text-slate-200'
            }`}
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className={`px-3 py-2 rounded-xl border text-2xs uppercase font-bold focus:outline-none cursor-pointer ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-[#0a192f] border-blue-900/40 text-slate-200'
            }`}
          >
            <option value="ALL">Category: All</option>
            <option value="BUG">Bug / Error</option>
            <option value="RECOMMENDATION">Recommendation</option>
            <option value="ACCOUNT">Account Issue</option>
            <option value="COURSE">Course Inquiry</option>
            <option value="CERTIFICATE">Certificate</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className={`px-3 py-2 rounded-xl border text-2xs uppercase font-bold focus:outline-none cursor-pointer ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-[#0a192f] border-blue-900/40 text-slate-200'
            }`}
          >
            <option value="ALL">Priority: All</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* TICKETS LIST & DETAIL SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: TICKET LIST */}
        <div className={`space-y-3 ${selectedTicket ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          {filteredTickets.length === 0 ? (
            <div className={`p-10 rounded-2xl border text-center space-y-3 ${
              isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#071326] border-blue-900/25 text-slate-400'
            }`}>
              <LifeBuoy className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
              <p className="font-mono text-xs font-bold uppercase tracking-wider">
                No Support Tickets Found
              </p>
              <p className="text-3xs text-slate-500 max-w-sm mx-auto">
                {isAdminView 
                  ? 'No registered tickets match your current filters. New submissions from students and trainers will appear here.'
                  : 'You have not logged any support tickets yet. Click "Generate New Ticket" to report an error or suggest improvements.'}
              </p>
            </div>
          ) : (
            filteredTickets.map(ticket => {
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <div
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setNewStatus(ticket.status);
                    setAdminResponseText(ticket.adminResponse || '');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                    isSelected
                      ? (isLight 
                          ? 'bg-blue-50/90 border-blue-900 shadow-md ring-1 ring-blue-900/20' 
                          : 'bg-[#0f2442] border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/30')
                      : (isLight 
                          ? 'bg-white border-slate-200 hover:border-blue-900/30 hover:bg-slate-50' 
                          : 'bg-[#081528] border-blue-900/25 hover:border-blue-700 hover:bg-[#0c1f38]')
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-sky-400">
                          {ticket.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase tracking-wider border ${
                          ticket.status === 'RESOLVED'
                            ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30')
                            : ticket.status === 'UNDER_REVIEW'
                            ? (isLight ? 'bg-purple-50 text-purple-800 border-purple-300' : 'bg-purple-500/15 text-purple-400 border-purple-500/30')
                            : ticket.status === 'CLOSED'
                            ? (isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-700/20 text-slate-400 border-slate-600')
                            : (isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/15 text-amber-400 border-amber-500/30')
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider ${
                          ticket.priority === 'URGENT'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : ticket.priority === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <h4 className={`text-xs font-black line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {ticket.subject}
                      </h4>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'rotate-90 text-sky-400' : 'text-slate-500'}`} />
                  </div>

                  <p className={`text-3xs line-clamp-2 mt-2 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {ticket.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-500/10">
                    <span className="truncate max-w-[160px]">
                      👤 {ticket.userName} ({ticket.userRole})
                    </span>
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: SELECTED TICKET DETAIL & ADMIN RESOLUTION CONSOLE */}
        {selectedTicket && (
          <div className="lg:col-span-7 space-y-4">
            <div className={`p-6 sm:p-7 rounded-3xl border shadow-xl relative transition-all text-left space-y-5 ${
              isLight ? 'bg-white border-blue-900/15 text-slate-800' : 'bg-[#0a1a30] border-blue-800/40 text-white'
            }`}>
              <div className="flex items-start justify-between gap-4 border-b border-slate-500/15 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-400/30 text-sky-400 font-mono text-2xs font-bold">
                      {selectedTicket.id}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-2xs font-mono font-black uppercase tracking-wider border ${
                      selectedTicket.status === 'RESOLVED'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : selectedTicket.status === 'UNDER_REVIEW'
                        ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                        : selectedTicket.status === 'CLOSED'
                        ? 'bg-slate-700/20 text-slate-400 border-slate-600'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-500/10 text-slate-300">
                      Category: {selectedTicket.category}
                    </span>
                  </div>
                  <h3 className={`text-base sm:text-lg font-black uppercase font-mono tracking-tight mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {selectedTicket.subject}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 cursor-pointer transition-all"
                    title="Delete ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 rounded-xl text-slate-400 hover:bg-white/10 border border-slate-500/20 cursor-pointer"
                    title="Close details"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* SENDER INFO BANNER */}
              <div className={`p-4 rounded-2xl border text-xs font-mono grid grid-cols-1 sm:grid-cols-2 gap-3 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#071326] border-blue-900/30 text-slate-300'
              }`}>
                <div>
                  <span className="text-slate-400 block text-3xs uppercase">Submitted By:</span>
                  <strong className={isLight ? 'text-blue-950' : 'text-white'}>{selectedTicket.userName}</strong>
                  <span className="text-slate-400 text-3xs block">({selectedTicket.userEmail})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-3xs uppercase">Account Role & Date:</span>
                  <strong className="uppercase">{selectedTicket.userRole}</strong>
                  <span className="text-slate-400 text-3xs block">Logged: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* TICKET DESCRIPTION */}
              <div className="space-y-2">
                <span className="text-2xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  Detailed Issue / Recommendation Description:
                </span>
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed font-mono whitespace-pre-wrap ${
                  isLight ? 'bg-slate-50/70 border-slate-200 text-slate-800' : 'bg-[#071326]/70 border-blue-900/30 text-sky-100'
                }`}>
                  {selectedTicket.description}
                </div>
              </div>

              {/* CURRENT ADMINISTRATIVE RESPONSE (IF ANY) */}
              {selectedTicket.adminResponse && (
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  isLight ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Official Administrative Resolution Note:</span>
                  </div>
                  <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.adminResponse}
                  </p>
                  {selectedTicket.resolvedAt && (
                    <span className="text-3xs font-mono opacity-80 block">
                      Resolved on: {new Date(selectedTicket.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {/* ADMIN EDIT / RESPONSE FORM (Only visible to admin) */}
              {isAdminView ? (
                <form onSubmit={handleAdminUpdateTicket} className={`p-5 rounded-2xl border space-y-4 pt-4 ${
                  isLight ? 'bg-blue-50/60 border-blue-900/15' : 'bg-[#071326] border-blue-900/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 text-sky-400">
                      <MessageSquare className="w-4 h-4" /> Administrative Action & Response Desk
                    </h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-3xs font-mono uppercase text-slate-400">
                      Update Ticket Status:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-2xs">
                      {(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'] as TicketStatus[]).map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setNewStatus(st)}
                          className={`py-2 px-3 rounded-xl border font-bold uppercase transition-all cursor-pointer ${
                            newStatus === st
                              ? (isLight ? 'bg-blue-950 text-white border-blue-950' : 'bg-cyan-500 text-slate-950 border-cyan-400 font-black')
                              : (isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-[#0a192f] border-blue-900/40 text-slate-300 hover:bg-white/5')
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-3xs font-mono uppercase text-slate-400">
                      Administrator Resolution / Public Feedback to User:
                    </label>
                    <textarea
                      rows={3}
                      value={adminResponseText}
                      onChange={(e) => setAdminResponseText(e.target.value)}
                      placeholder="Explain the fix, deployment update, or acknowledgment to the user..."
                      className={`w-full p-3 rounded-xl border text-xs font-mono focus:outline-none ${
                        isLight 
                          ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-900' 
                          : 'bg-[#0a192f] border-blue-900/40 text-white focus:border-cyan-400'
                      }`}
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isUpdatingStatus}
                      className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                        isLight 
                          ? 'bg-blue-950 hover:bg-blue-900 text-white' 
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isUpdatingStatus ? 'Applying Updates...' : 'Commit Status & Send Response'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-3xs font-mono text-slate-400 text-right">
                  Status updates and administrative resolutions are managed by Dakshyam Innovations Platform Engineers.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: GENERATE NEW SUPPORT TICKET */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`border p-6 sm:p-7 max-w-xl w-full relative z-10 space-y-5 rounded-3xl shadow-2xl text-left ${
                isLight ? 'bg-white border-blue-900/15 text-slate-900' : 'bg-[#0d1f38] border-blue-800/40 text-white'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-500/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isLight ? 'bg-blue-50 border-blue-300 text-blue-950' : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                  }`}>
                    <LifeBuoy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase font-mono">
                      Log Support Ticket or Report
                    </h3>
                    <p className="text-3xs text-slate-400 font-mono">
                      Logged under: {currentUser.name} ({currentUser.email})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="block text-3xs uppercase tracking-wider text-slate-400 font-bold">
                    Ticket Subject / Short Summary *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Issue generating course certificate / Workshop video buffering"
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-900' 
                        : 'bg-[#071326] border-blue-900/40 text-white focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-3xs uppercase tracking-wider text-slate-400 font-bold">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border uppercase font-bold focus:outline-none cursor-pointer ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-800' 
                          : 'bg-[#071326] border-blue-900/40 text-white'
                      }`}
                    >
                      <option value="BUG">Bug / Software Glitch</option>
                      <option value="RECOMMENDATION">Feature Recommendation</option>
                      <option value="ACCOUNT">Account & Authentication</option>
                      <option value="COURSE">Course & Enrollment</option>
                      <option value="CERTIFICATE">Certificate Verification</option>
                      <option value="OTHER">General Feedback</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-3xs uppercase tracking-wider text-slate-400 font-bold">
                      Priority Level *
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border uppercase font-bold focus:outline-none cursor-pointer ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-800' 
                          : 'bg-[#071326] border-blue-900/40 text-white'
                      }`}
                    >
                      <option value="NORMAL">Normal Priority</option>
                      <option value="LOW">Low / Cosmetic</option>
                      <option value="HIGH">High / Impeding</option>
                      <option value="URGENT">Urgent / Blocker</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-3xs uppercase tracking-wider text-slate-400 font-bold">
                    Detailed Problem Description / Recommendations *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details: What happened? What device or browser were you using? How can this feature be improved?"
                    className={`w-full p-3.5 rounded-xl border focus:outline-none ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-900' 
                        : 'bg-[#071326] border-blue-900/40 text-white focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-500/20 text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider shadow-lg cursor-pointer ${
                      isLight 
                        ? 'bg-blue-950 hover:bg-blue-900 text-white' 
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
