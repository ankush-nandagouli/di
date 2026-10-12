import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserCheck, ShieldAlert, Plus, Search, Trash2, 
  CheckCircle2, Clock, Mail, Phone, Building2, Copy, Check,
  Download, Filter, Shield, Award, UserPlus, X, RefreshCw
} from 'lucide-react';
import { DakshyamDatabase } from '../utils/db';
import { notifySuccess, notifyError, notifyInfo } from '../utils/toast';

interface AdminAccountsManagerProps {
  theme?: 'light' | 'dark';
  onRefresh?: () => void;
  onCreateTrainerClick?: () => void;
}

export default function AdminAccountsManager({
  theme = 'dark',
  onRefresh,
  onCreateTrainerClick
}: AdminAccountsManagerProps) {
  const isLight = theme === 'light';

  const [accounts, setAccounts] = useState(() => DakshyamDatabase.getAllRegisteredAccounts());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'student' | 'trainer' | 'admin'>('ALL');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Create Trainer Modal state inside Accounts Manager
  const [isCreateTrainerOpen, setIsCreateTrainerOpen] = useState(false);
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPassword, setTrainerPassword] = useState('');
  const [trainerPhone, setTrainerPhone] = useState('');
  const [trainerInstitution, setTrainerInstitution] = useState('');
  const [trainerSpecialization, setTrainerSpecialization] = useState('Robotics & Embedded Systems');
  const [autoApprove, setAutoApprove] = useState(true);
  const [isSubmittingTrainer, setIsSubmittingTrainer] = useState(false);

  const refreshAccounts = () => {
    try {
      const data = DakshyamDatabase.getAllRegisteredAccounts();
      setAccounts(data);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Failed to refresh accounts:', err);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleDeleteAccount = (id: string, role: 'student' | 'trainer' | 'admin', name: string) => {
    if (role === 'admin') {
      notifyError('Administrative root account cannot be removed.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete account for "${name}" (${role.toUpperCase()})?`)) {
      return;
    }

    try {
      const success = DakshyamDatabase.deleteAccount(id, role);
      if (success) {
        notifySuccess(`Account for ${name} removed from database.`);
        refreshAccounts();
      } else {
        notifyError('Could not delete account.');
      }
    } catch {
      notifyError('Error removing user account.');
    }
  };

  const handleToggleTrainerApproval = (id: string, currentStatus: boolean | undefined) => {
    try {
      const trainers = DakshyamDatabase.getTrainers();
      const updated = trainers.map(t => {
        if (t.id === id) {
          return { ...t, isApproved: !currentStatus };
        }
        return t;
      });
      DakshyamDatabase.saveTrainers(updated);
      notifySuccess(`Trainer authorization status toggled.`);
      refreshAccounts();
    } catch {
      notifyError('Failed to update trainer status.');
    }
  };

  const handleCreateTrainerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerName.trim() || !trainerEmail.trim() || !trainerPassword.trim()) {
      notifyError('Please fill out Name, Email, and Password for the trainer.');
      return;
    }

    setIsSubmittingTrainer(true);
    try {
      // 1. Try server register endpoint
      let createdOnServer = false;
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trainerName.trim(),
            email: trainerEmail.trim(),
            password: trainerPassword,
            role: 'trainer',
            profile: {
              phone: trainerPhone.trim(),
              institution: trainerInstitution.trim() || 'Dakshyam Engineering Faculty',
              specialization: trainerSpecialization
            }
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          createdOnServer = true;
        }
      } catch {}

      // 2. Also ensure local database records
      const existingTrainers = DakshyamDatabase.getTrainers();
      const newTrainerObj = {
        id: `usr-trn-${Date.now().toString(36)}`,
        name: trainerName.trim(),
        email: trainerEmail.trim().toLowerCase(),
        role: 'trainer' as const,
        createdAt: new Date().toISOString().split('T')[0],
        isApproved: autoApprove,
        profile: {
          phone: trainerPhone.trim(),
          institution: trainerInstitution.trim() || 'Dakshyam Engineering Faculty',
          specialization: trainerSpecialization
        }
      };

      const updatedTrainers = [newTrainerObj, ...existingTrainers.filter(t => t.email.toLowerCase() !== newTrainerObj.email)];
      DakshyamDatabase.saveTrainers(updatedTrainers);

      DakshyamDatabase.logEvent(
        'Trainer Created by Admin',
        `Admin created new trainer account ${trainerName.trim()} (${trainerEmail.trim()}) with specialization ${trainerSpecialization}. Auto-approved: ${autoApprove}`,
        'admin@dakshyam.com',
        'admin',
        'SUCCESS',
        'SYSTEM'
      );

      notifySuccess(`Trainer account for ${trainerName.trim()} created successfully!`);
      setTrainerName('');
      setTrainerEmail('');
      setTrainerPassword('');
      setTrainerPhone('');
      setTrainerInstitution('');
      setIsCreateTrainerOpen(false);
      refreshAccounts();
    } catch (err: any) {
      notifyError('Failed to create trainer account.');
    } finally {
      setIsSubmittingTrainer(false);
    }
  };

  const exportAccountsCSV = () => {
    try {
      const headers = ['ID', 'Role', 'Name', 'Email', 'Phone', 'Institution', 'Registration Date', 'Status'];
      const rows = accounts.map(a => [
        `"${a.id}"`,
        `"${a.role}"`,
        `"${a.name}"`,
        `"${a.email}"`,
        `"${a.phone || ''}"`,
        `"${a.institution || ''}"`,
        `"${a.createdAt || ''}"`,
        `"${a.isApproved ? 'Approved/Active' : 'Pending'}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `dakshyam_registered_accounts_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notifySuccess('Accounts directory exported as CSV.');
    } catch {
      notifyError('Failed to export CSV.');
    }
  };

  // Filter accounts
  const filtered = accounts.filter(acc => {
    if (roleFilter !== 'ALL' && acc.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = acc.name.toLowerCase().includes(q);
      const matchEmail = acc.email.toLowerCase().includes(q);
      const matchId = acc.id.toLowerCase().includes(q);
      const matchPhone = (acc.phone || '').toLowerCase().includes(q);
      const matchInst = (acc.institution || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchId || matchPhone || matchInst;
    }
    return true;
  });

  const totalCount = accounts.length;
  const studentCount = accounts.filter(a => a.role === 'student').length;
  const trainerCount = accounts.filter(a => a.role === 'trainer').length;
  const adminCount = accounts.filter(a => a.role === 'admin').length;

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
            isLight ? 'bg-blue-100/70 border-blue-300 text-blue-950' : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
          }`}>
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-sky-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Administrative Identity & Access Registry
            </span>
            <h2 className={`text-xl sm:text-2xl font-black uppercase font-mono tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Registered Accounts Directory
            </h2>
            <p className={`text-xs mt-0.5 max-w-xl ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Centralized visibility of all student learners, vocational trainers, and platform administrators registered across Dakshyam Innovations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={refreshAccounts}
            className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-blue-900/40 hover:bg-white/5 text-slate-300'
            }`}
            title="Refresh accounts directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={exportAccountsCSV}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-blue-900/40 hover:bg-white/5 text-slate-300'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateTrainerOpen(true)}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-all ${
              isLight 
                ? 'bg-blue-950 hover:bg-blue-900 text-white shadow-blue-950/20' 
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-cyan-500/20'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Create Trainer</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-mono">
        <div 
          onClick={() => setRoleFilter('ALL')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            roleFilter === 'ALL'
              ? (isLight ? 'bg-blue-50 border-blue-900 ring-1 ring-blue-900/20' : 'bg-cyan-500/10 border-cyan-400 ring-1 ring-cyan-400/30')
              : (isLight ? 'bg-white border-slate-200' : 'bg-[#0d1f38] border-blue-900/30')
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Accounts</div>
          <div className="text-2xl font-black mt-1 text-sky-400">{totalCount}</div>
        </div>

        <div 
          onClick={() => setRoleFilter('student')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            roleFilter === 'student'
              ? (isLight ? 'bg-blue-50 border-blue-900 ring-1 ring-blue-900/20' : 'bg-blue-500/15 border-blue-400 ring-1 ring-blue-400/30')
              : (isLight ? 'bg-white border-slate-200' : 'bg-[#0d1f38] border-blue-900/30')
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Students</div>
          <div className="text-2xl font-black mt-1 text-blue-400">{studentCount}</div>
        </div>

        <div 
          onClick={() => setRoleFilter('trainer')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            roleFilter === 'trainer'
              ? (isLight ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500/20' : 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/30')
              : (isLight ? 'bg-white border-slate-200' : 'bg-[#0d1f38] border-blue-900/30')
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500">Trainers</div>
          <div className="text-2xl font-black mt-1 text-amber-400">{trainerCount}</div>
        </div>

        <div 
          onClick={() => setRoleFilter('admin')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            roleFilter === 'admin'
              ? (isLight ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500/20' : 'bg-purple-500/15 border-purple-400 ring-1 ring-purple-400/30')
              : (isLight ? 'bg-white border-slate-200' : 'bg-[#0d1f38] border-blue-900/30')
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Administrators</div>
          <div className="text-2xl font-black mt-1 text-purple-400">{adminCount}</div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#071326] border-blue-900/30'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search accounts by name, email, phone, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none ${
              isLight 
                ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-900' 
                : 'bg-[#0a192f] border-blue-900/40 text-white focus:border-cyan-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'student', 'trainer', 'admin'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl border text-2xs uppercase font-bold whitespace-nowrap transition-all cursor-pointer ${
                roleFilter === r
                  ? (isLight ? 'bg-blue-950 text-white border-blue-950' : 'bg-cyan-500 text-slate-950 border-cyan-400 font-black')
                  : (isLight ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-[#0a192f] border-blue-900/40 text-slate-300 hover:bg-white/5')
              }`}
            >
              {r === 'ALL' ? 'All Roles' : `${r}s`}
            </button>
          ))}
        </div>
      </div>

      {/* ACCOUNTS DIRECTORY TABLE / CARDS */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className={`p-10 rounded-2xl border text-center space-y-2 ${
            isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#071326] border-blue-900/25 text-slate-400'
          }`}>
            <Users className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
            <p className="font-mono text-xs font-bold uppercase">No matching registered accounts</p>
            <p className="text-3xs text-slate-500">Try modifying your search or role filter.</p>
          </div>
        ) : (
          filtered.map((acc) => {
            const isCopying = copiedEmail === acc.email;
            return (
              <div
                key={acc.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-left ${
                  isLight 
                    ? 'bg-white border-slate-200 hover:border-blue-900/30 hover:shadow-xs' 
                    : 'bg-[#081528] border-blue-900/25 hover:border-blue-700 hover:bg-[#0c1f38]'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 uppercase border ${
                    acc.role === 'admin'
                      ? (isLight ? 'bg-purple-100 border-purple-300 text-purple-900' : 'bg-purple-500/20 border-purple-500/40 text-purple-300')
                      : acc.role === 'trainer'
                      ? (isLight ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-amber-500/20 border-amber-500/40 text-amber-300')
                      : (isLight ? 'bg-blue-100 border-blue-300 text-blue-900' : 'bg-blue-500/20 border-blue-500/40 text-blue-300')
                  }`}>
                    {acc.name.substring(0, 2)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {acc.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase tracking-wider border ${
                        acc.role === 'admin'
                          ? (isLight ? 'bg-purple-50 text-purple-900 border-purple-200' : 'bg-purple-500/15 text-purple-300 border-purple-500/30')
                          : acc.role === 'trainer'
                          ? (isLight ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-amber-500/15 text-amber-300 border-amber-500/30')
                          : (isLight ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-blue-500/15 text-blue-300 border-blue-500/30')
                      }`}>
                        {acc.role}
                      </span>
                      {acc.role === 'trainer' && (
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase border ${
                          acc.isApproved
                            ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30')
                            : (isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/15 text-amber-400 border-amber-500/30')
                        }`}>
                          {acc.isApproved ? '✓ Approved' : '⚠ Pending Approval'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-3xs font-mono text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-sky-400" />
                        <span>{acc.email}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(acc.email)}
                          className="hover:text-white cursor-pointer ml-0.5"
                          title="Copy email"
                        >
                          {isCopying ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </span>

                      {acc.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{acc.phone}</span>
                        </span>
                      )}

                      {acc.institution && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-purple-400" />
                          <span>{acc.institution}</span>
                        </span>
                      )}

                      <span>ID: {acc.id}</span>
                      {acc.createdAt && <span>Joined: {acc.createdAt}</span>}
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 self-end md:self-center font-mono">
                  {acc.role === 'trainer' && (
                    <button
                      type="button"
                      onClick={() => handleToggleTrainerApproval(acc.id, acc.isApproved)}
                      className={`px-3 py-1.5 rounded-xl border text-3xs font-bold uppercase transition-all cursor-pointer ${
                        acc.isApproved
                          ? (isLight ? 'border-amber-300 text-amber-800 hover:bg-amber-50' : 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10')
                          : (isLight ? 'bg-emerald-700 text-white' : 'bg-emerald-500 text-slate-950 font-black')
                      }`}
                    >
                      {acc.isApproved ? 'Revoke Access' : '✓ Authorize ID'}
                    </button>
                  )}

                  {acc.role !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(acc.id, acc.role, acc.name)}
                      className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 cursor-pointer transition-all"
                      title="Permanently Delete Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE TRAINER MODAL */}
      <AnimatePresence>
        {isCreateTrainerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateTrainerOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`border p-6 sm:p-7 max-w-lg w-full relative z-10 space-y-5 rounded-3xl shadow-2xl text-left ${
                isLight ? 'bg-white border-blue-900/15 text-slate-900' : 'bg-[#0d1f38] border-blue-800/40 text-white'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-500/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  }`}>
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase font-mono">
                      Create New Trainer Account
                    </h3>
                    <p className="text-3xs text-slate-400 font-mono">
                      Direct administrative provisioning with immediate portal authorization.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateTrainerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTrainerSubmit} className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="block text-3xs uppercase tracking-wider text-slate-400 font-bold">
                    Full Name of Trainer *
                  </label>
                  <input
                    type="text"
                    required
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
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
                      Trainer Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={trainerEmail}
                      onChange={(e) => setTrainerEmail(e.target.value)}
                      placeholder="trainer@dakshyam.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-900' 
                          : 'bg-[#071326] border-blue-900/40 text-white focus:border-cyan-400'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-3xs uppercase tracking-wider text-slate-400 font-bold">
                      Initial Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={trainerPassword}
                      onChange={(e) => setTrainerPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-900' 
                          : 'bg-[#071326] border-blue-900/40 text-white focus:border-cyan-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-3xs uppercase tracking-wider text-slate-400 font-bold">
                      WhatsApp / Phone Node
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={trainerPhone}
                      onChange={(e) => setTrainerPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit number"
                      className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-900' 
                          : 'bg-[#071326] border-blue-900/40 text-white focus:border-cyan-400'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-3xs uppercase tracking-wider text-slate-400 font-bold">
                      Domain Specialization
                    </label>
                    <select
                      value={trainerSpecialization}
                      onChange={(e) => setTrainerSpecialization(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border uppercase font-bold focus:outline-none cursor-pointer ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-800' 
                          : 'bg-[#071326] border-blue-900/40 text-white'
                      }`}
                    >
                      <option value="Robotics & Embedded Systems">Robotics & Embedded Systems</option>
                      <option value="AI & Machine Learning">AI & Machine Learning</option>
                      <option value="IoT & Industrial Automation">IoT & Industrial Automation</option>
                      <option value="Full Stack Web & Cloud">Full Stack Web & Cloud</option>
                      <option value="Drone Technology & Avionics">Drone Technology & Avionics</option>
                      <option value="NEP STEM Hands-on Innovation">NEP STEM Hands-on Innovation</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-3xs uppercase tracking-wider text-slate-400 font-bold">
                    Institution / University / Affiliation
                  </label>
                  <input
                    type="text"
                    value={trainerInstitution}
                    onChange={(e) => setTrainerInstitution(e.target.value)}
                    placeholder="e.g. Government Engineering College / Dakshyam Faculty"
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-900' 
                        : 'bg-[#071326] border-blue-900/40 text-white focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="autoApproveToggle"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="autoApproveToggle" className="text-3xs font-mono text-slate-300 cursor-pointer">
                    Grant immediate ID authorization (Bypasses verification queue)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateTrainerOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-500/20 text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTrainer}
                    className={`px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider shadow-lg cursor-pointer ${
                      isLight 
                        ? 'bg-blue-950 hover:bg-blue-900 text-white' 
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black'
                    }`}
                  >
                    {isSubmittingTrainer ? 'Provisioning...' : 'Provision Trainer'}
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
