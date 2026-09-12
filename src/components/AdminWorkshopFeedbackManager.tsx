import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, FileText, Search, Filter, Trash2, Eye, 
  Share2, Copy, Check, Download, Star, Building2, User, 
  Calendar, MapPin, Sparkles, RefreshCw, Settings, Plus, 
  X, CheckCircle2, AlertCircle, Phone, Mail, Award, Wrench, 
  GraduationCap, BookOpen, ThumbsUp, HelpCircle, ShieldAlert,
  Monitor, Smartphone, Tablet, ExternalLink
} from 'lucide-react';
import { 
  WorkshopFeedbackSubmission, WorkshopFeedbackConfig, 
  WorkshopItem, CustomFeedbackQuestion, ParticipantCategory, UserRole 
} from '../types';
import { WorkshopFeedbackStorage, VERCEL_DOMAIN, getWorkshopShareUrl, toWorkshopSlug } from '../utils/feedbackStorage';
import WorkshopFeedbackForm from './WorkshopFeedbackForm';

interface AdminWorkshopFeedbackManagerProps {
  theme?: 'light' | 'dark';
  currentUserRole?: UserRole;
  onOpenPublicForm?: (workshopId?: string) => void;
}

export default function AdminWorkshopFeedbackManager({
  theme = 'dark',
  currentUserRole = 'admin',
  onOpenPublicForm
}: AdminWorkshopFeedbackManagerProps) {
  const isLight = theme === 'light';
  const isAdmin = currentUserRole === 'admin';

  // Submissions and Config states
  const [submissions, setSubmissions] = useState<WorkshopFeedbackSubmission[]>([]);
  const [config, setConfig] = useState<WorkshopFeedbackConfig>(() => WorkshopFeedbackStorage.getFeedbackConfig());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWorkshopFilter, setSelectedWorkshopFilter] = useState<string>('all');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating-high' | 'rating-low'>('newest');

  // Modals & Previews
  const [selectedSubmission, setSelectedSubmission] = useState<WorkshopFeedbackSubmission | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewWorkshopId, setPreviewWorkshopId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedWorkshopForLink, setSelectedWorkshopForLink] = useState<string>('');

  // Admin config editing temporary state
  const [editingConfig, setEditingConfig] = useState<WorkshopFeedbackConfig>(config);
  const [configSaveStatus, setConfigSaveStatus] = useState<string | null>(null);

  // New workshop form fields
  const [newWsName, setNewWsName] = useState('');
  const [newWsDate, setNewWsDate] = useState('');
  const [newWsVenue, setNewWsVenue] = useState('');
  const [newWsTrainer, setNewWsTrainer] = useState('');
  const [showAddWorkshopForm, setShowAddWorkshopForm] = useState(false);

  // New question form fields
  const [newQuesLabel, setNewQuesLabel] = useState('');
  const [newQuesType, setNewQuesType] = useState<'text' | 'rating' | 'choice' | 'yesno'>('choice');
  const [newQuesRequired, setNewQuesRequired] = useState(false);
  const [newQuesOptions, setNewQuesOptions] = useState('');
  const [showAddQuestionForm, setShowAddQuestionForm] = useState(false);

  // Load submissions from storage & Firestore
  const loadData = async () => {
    setLoading(true);
    const cfg = WorkshopFeedbackStorage.getFeedbackConfig();
    setConfig(cfg);
    setEditingConfig(cfg);
    if (cfg.workshops.length > 0 && !selectedWorkshopForLink) {
      setSelectedWorkshopForLink(cfg.workshops[0].id);
    }

    try {
      const data = await WorkshopFeedbackStorage.fetchFromFirestore();
      setSubmissions(data);
    } catch (e) {
      console.error(e);
      setSubmissions(WorkshopFeedbackStorage.getSubmissions());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Copy share link with canonical Vercel production domain
  const copyShareLink = (wsId?: string, useVercel = true) => {
    const targetId = wsId || selectedWorkshopForLink;
    const targetWs = config.workshops.find(w => w.id === targetId);
    const url = getWorkshopShareUrl(targetWs || targetId, useVercel);
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Delete submission
  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) {
      alert('Only administrators have deletion privileges.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete feedback from ${name}? This action cannot be undone.`)) {
      await WorkshopFeedbackStorage.deleteSubmission(id);
      setSubmissions(prev => prev.filter(s => s.id !== id));
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(null);
      }
    }
  };

  // Filter and Sort submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.participantCategory !== selectedCategory) {
        return false;
      }
      // Workshop filter
      if (selectedWorkshopFilter !== 'all' && item.workshopId !== selectedWorkshopFilter && item.workshopName !== selectedWorkshopFilter) {
        return false;
      }
      // Rating filter
      if (selectedRatingFilter === '5') {
        if (item.overallRating !== 5) return false;
      } else if (selectedRatingFilter === '4plus') {
        if (item.overallRating < 4) return false;
      } else if (selectedRatingFilter === 'low') {
        if (item.overallRating >= 4) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.fullName.toLowerCase().includes(q);
        const matchEmail = item.email.toLowerCase().includes(q);
        const matchPhone = item.phone.toLowerCase().includes(q);
        const matchInst = item.institutionName.toLowerCase().includes(q);
        const matchCity = item.city.toLowerCase().includes(q);
        const matchWorkshop = item.workshopName.toLowerCase().includes(q);
        const matchLearnings = (item.keyLearnings || '').toLowerCase().includes(q);
        const matchRoll = (item.rollOrEmployeeId || '').toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone || matchInst || matchCity || matchWorkshop || matchLearnings || matchRoll;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      }
      if (sortBy === 'rating-high') {
        return b.overallRating - a.overallRating;
      }
      if (sortBy === 'rating-low') {
        return a.overallRating - b.overallRating;
      }
      return 0;
    });
  }, [submissions, searchQuery, selectedCategory, selectedWorkshopFilter, selectedRatingFilter, sortBy]);

  // Aggregate KPI Calculations
  const stats = useMemo(() => {
    const total = submissions.length;
    if (total === 0) {
      return {
        total: 0,
        avgOverall: '0.0',
        avgTrainer: '0.0',
        avgKits: '0.0',
        recommendPct: 0,
        studentCount: 0,
        schoolCount: 0,
        collegeCount: 0,
        otherCount: 0
      };
    }
    const sumOverall = submissions.reduce((acc, s) => acc + s.overallRating, 0);
    const sumTrainer = submissions.reduce((acc, s) => acc + s.trainerKnowledgeRating, 0);
    const sumKits = submissions.reduce((acc, s) => acc + s.practicalHardwareRating, 0);
    const recommendCount = submissions.filter(s => s.recommendDakshyam === 'Yes, Definitely' || s.recommendDakshyam === 'Likely').length;

    return {
      total,
      avgOverall: (sumOverall / total).toFixed(1),
      avgTrainer: (sumTrainer / total).toFixed(1),
      avgKits: (sumKits / total).toFixed(1),
      recommendPct: Math.round((recommendCount / total) * 100),
      studentCount: submissions.filter(s => s.participantCategory === 'student').length,
      schoolCount: submissions.filter(s => s.participantCategory === 'school').length,
      collegeCount: submissions.filter(s => s.participantCategory === 'college').length,
      otherCount: submissions.filter(s => s.participantCategory === 'other').length
    };
  }, [submissions]);

  // Handle saving modified config
  const handleSaveConfig = async () => {
    if (!isAdmin) return;
    const ok = await WorkshopFeedbackStorage.saveFeedbackConfig(editingConfig);
    if (ok) {
      setConfig(editingConfig);
      setConfigSaveStatus('Configuration successfully saved and synced to database.');
      setTimeout(() => setConfigSaveStatus(null), 3000);
    } else {
      setConfigSaveStatus('Failed to save settings.');
    }
  };

  // Add new workshop to config
  const handleAddWorkshop = () => {
    if (!newWsName.trim() || !newWsDate.trim()) {
      alert('Workshop title and date are required.');
      return;
    }
    const newWs: WorkshopItem = {
      id: `WS-${Date.now().toString(36).toUpperCase()}`,
      name: newWsName.trim(),
      date: newWsDate.trim(),
      venue: newWsVenue.trim() || 'Dakshyam Central STEM Lab',
      trainerName: newWsTrainer.trim() || 'Dakshyam Tech Lead',
      isActive: true
    };
    setEditingConfig(prev => ({
      ...prev,
      workshops: [...prev.workshops, newWs]
    }));
    setNewWsName('');
    setNewWsDate('');
    setNewWsVenue('');
    setNewWsTrainer('');
    setShowAddWorkshopForm(false);
  };

  // Add custom question to config
  const handleAddQuestion = () => {
    if (!newQuesLabel.trim()) {
      alert('Question text label is required.');
      return;
    }
    const parsedOptions = newQuesType === 'choice' && newQuesOptions.trim()
      ? newQuesOptions.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const newQ: CustomFeedbackQuestion = {
      id: `q-${Date.now().toString(36)}`,
      label: newQuesLabel.trim(),
      type: newQuesType,
      required: newQuesRequired,
      options: parsedOptions
    };

    setEditingConfig(prev => ({
      ...prev,
      customQuestions: [...(prev.customQuestions || []), newQ]
    }));
    setNewQuesLabel('');
    setNewQuesOptions('');
    setNewQuesRequired(false);
    setShowAddQuestionForm(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4 animate-fadeIn">
      
      {/* CONSOLE HEADER & TOP ACTION BAR */}
      <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden backdrop-blur-xl transition-all ${
        isLight 
          ? 'bg-gradient-to-br from-white via-blue-50/50 to-white border-blue-900/15 text-slate-900' 
          : 'bg-gradient-to-br from-[#0d1f38] via-[#0a192f] to-[#0a192f] border-sky-500/20 text-white'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                isAdmin 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
              }`}>
                {currentUserRole.toUpperCase()} PRIVILEGE LEVEL
              </span>
              <span className="text-slate-400 text-xs font-mono">• Internal Workshop Evaluator</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase font-mono tracking-tight flex items-center gap-2">
              Workshop Participant Feedback & Audit Console
            </h1>
            <p className={`text-xs max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Search, categorize, analyze, and export participant evaluations from students, schools, colleges, and industry attendees.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Refresh Data */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isLight ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700' : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Refresh database records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Copy Shared Form Link */}
            <button
              onClick={() => copyShareLink()}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                linkCopied
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : isLight
                  ? 'bg-blue-50 border-blue-900/20 hover:bg-blue-100 text-blue-950'
                  : 'bg-sky-950/60 border-sky-500/30 hover:border-sky-400 text-sky-300'
              }`}
              title="Copy shareable link for students"
            >
              {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{linkCopied ? 'Link Copied!' : 'Copy Form Link'}</span>
            </button>

            {/* PREVIEW WORKSHOP FORM BUTTON */}
            <button
              onClick={() => {
                setPreviewWorkshopId(selectedWorkshopForLink || (config.workshops[0]?.id || null));
                setShowPreviewModal(true);
              }}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isLight 
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              }`}
              title="Preview interactive workshop feedback form across devices"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Preview Form</span>
            </button>

            {/* Admin Form Configurator */}
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingConfig(config);
                  setIsConfigModalOpen(true);
                }}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isLight 
                    ? 'bg-blue-950 hover:bg-blue-900 text-white' 
                    : 'bg-white hover:bg-slate-100 text-[#0a192f] font-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Modify Form & Workshops</span>
              </button>
            )}
          </div>
        </div>

        {/* QUICK LINK BAR FOR SPECIFIC WORKSHOPS */}
        <div className={`mt-4 pt-3 border-t border-slate-500/15 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs font-mono ${
          isLight ? 'text-slate-700' : 'text-slate-300'
        }`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sky-400 font-bold flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5" /> Shareable Student Link:
            </span>
            <select
              value={selectedWorkshopForLink}
              onChange={(e) => setSelectedWorkshopForLink(e.target.value)}
              className={`px-2.5 py-1 rounded-lg border text-2xs font-mono ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="">-- Any / General Form --</option>
              {config.workshops.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-[11px] px-2.5 py-1 rounded bg-black/40 text-emerald-300 font-mono border border-emerald-500/30 truncate max-w-xs sm:max-w-md">
              {getWorkshopShareUrl(config.workshops.find(w => w.id === selectedWorkshopForLink) || selectedWorkshopForLink, true)}
            </code>
            <button
              onClick={() => copyShareLink(selectedWorkshopForLink, true)}
              className={`px-3 py-1 rounded-lg border text-2xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                linkCopied 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : isLight
                  ? 'bg-blue-900 text-white hover:bg-blue-800'
                  : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
              }`}
            >
              {linkCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{linkCopied ? 'Copied' : 'Copy Vercel Link'}</span>
            </button>
            <button
              onClick={() => {
                setPreviewWorkshopId(selectedWorkshopForLink || null);
                setShowPreviewModal(true);
              }}
              className={`px-2.5 py-1 rounded-lg border text-2xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isLight
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
              }`}
              title="Preview form in interactive modal"
            >
              <Eye className="w-3 h-3 text-amber-400" />
              <span>Preview</span>
            </button>
            {onOpenPublicForm && (
              <button
                onClick={() => onOpenPublicForm(selectedWorkshopForLink)}
                className="text-sky-400 hover:text-sky-300 underline text-2xs cursor-pointer px-1 flex items-center gap-1"
                title="Test form view directly in full screen"
              >
                <span>Full Tab</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STATISTICAL KPI TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Responses */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-blue-900/10' : 'bg-slate-900/60 border-blue-900/25'
        }`}>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Total Audits</span>
          <div className="text-2xl font-black font-mono mt-1 text-sky-400">{stats.total}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Submissions logged</span>
        </div>

        {/* Avg Overall Rating */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-blue-900/10' : 'bg-slate-900/60 border-blue-900/25'
        }`}>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Overall Score</span>
          <div className="text-2xl font-black font-mono mt-1 text-amber-400 flex items-center gap-1">
            {stats.avgOverall} <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Out of 5.0 scale</span>
        </div>

        {/* Trainer Knowledge Score */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-blue-900/10' : 'bg-slate-900/60 border-blue-900/25'
        }`}>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Trainer Clarity</span>
          <div className="text-2xl font-black font-mono mt-1 text-emerald-400">{stats.avgTrainer} ★</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Technical pedagogy</span>
        </div>

        {/* Practical Kits Score */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-blue-900/10' : 'bg-slate-900/60 border-blue-900/25'
        }`}>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Hardware Kits</span>
          <div className="text-2xl font-black font-mono mt-1 text-blue-400">{stats.avgKits} ★</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">ESP32 & sensors setup</span>
        </div>

        {/* Recommendation Rate */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-blue-900/10' : 'bg-slate-900/60 border-blue-900/25'
        }`}>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Recommend Rate</span>
          <div className="text-2xl font-black font-mono mt-1 text-purple-400">{stats.recommendPct}%</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">NPS peer index</span>
        </div>

        {/* Audience Mix */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-blue-900/10' : 'bg-slate-900/60 border-blue-900/25'
        }`}>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Audience Split</span>
          <div className="text-2xs font-mono space-y-0.5 mt-1.5">
            <div className="flex justify-between"><span>Students:</span> <strong className="text-sky-400">{stats.studentCount}</strong></div>
            <div className="flex justify-between"><span>Schools:</span> <strong className="text-emerald-400">{stats.schoolCount}</strong></div>
            <div className="flex justify-between"><span>Colleges:</span> <strong className="text-amber-400">{stats.collegeCount}</strong></div>
          </div>
        </div>

      </div>

      {/* SEARCH, CATEGORIZE & EXPORT CONTROLS BAR */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-4 transition-all ${
        isLight ? 'bg-white border-blue-900/10' : 'bg-slate-900/50 border-blue-900/25'
      }`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by participant name, email, phone, school/college, city, or learnings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-900 focus:bg-white' 
                  : 'bg-[#0f172a] border-slate-700 text-white focus:border-sky-400 focus:bg-black/50'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* EXPORT BUTTONS */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Export Excel */}
            <button
              onClick={() => WorkshopFeedbackStorage.exportToExcel(
                filteredSubmissions, 
                `Dakshyam_Feedback_${selectedCategory}_${Date.now()}.xlsx`
              )}
              className={`px-4 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isLight 
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900' 
                  : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              }`}
              title="Export filtered records to formatted Excel spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Excel (.xlsx)</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={() => WorkshopFeedbackStorage.exportToPdf(
                filteredSubmissions,
                `Category: ${selectedCategory.toUpperCase()} | Workshop: ${selectedWorkshopFilter}`,
                `Dakshyam_Feedback_Report_${Date.now()}.pdf`
              )}
              className={`px-4 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isLight 
                  ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-900' 
                  : 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-500/30 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
              }`}
              title="Download formal evaluation PDF report"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>Export PDF (.pdf)</span>
            </button>
          </div>

        </div>

        {/* CATEGORIZATION FILTERS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-500/10">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>

            {/* Category pills */}
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'student', label: 'Students' },
              { id: 'school', label: 'Schools' },
              { id: 'college', label: 'Colleges' },
              { id: 'other', label: 'Others' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-2xs font-mono px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? (isLight 
                        ? 'bg-blue-950 text-white border-blue-950 font-bold shadow-xs' 
                        : 'bg-sky-500/20 border-sky-400 text-white font-bold')
                    : (isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' 
                        : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800')
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Workshop Dropdown Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400 text-2xs uppercase">Workshop:</span>
              <select
                value={selectedWorkshopFilter}
                onChange={(e) => setSelectedWorkshopFilter(e.target.value)}
                className={`px-2.5 py-1 rounded-lg border text-2xs font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="all">All Workshops</option>
                {config.workshops.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400 text-2xs uppercase">Rating:</span>
              <select
                value={selectedRatingFilter}
                onChange={(e) => setSelectedRatingFilter(e.target.value)}
                className={`px-2.5 py-1 rounded-lg border text-2xs font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars Only ★★★★★</option>
                <option value="4plus">4+ Stars & Above</option>
                <option value="low">Under 3 Stars (Needs Review)</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400 text-2xs uppercase">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-2.5 py-1 rounded-lg border text-2xs font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating-high">Highest Rated</option>
                <option value="rating-low">Lowest Rated</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* FEEDBACK ENTRIES LIST / TABLE */}
      <div className={`rounded-3xl border shadow-sm overflow-hidden transition-all ${
        isLight ? 'bg-white border-blue-900/10' : 'bg-slate-900/40 border-blue-900/25'
      }`}>
        <div className="p-4 border-b border-slate-500/15 flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase text-slate-400">
            Showing {filteredSubmissions.length} of {submissions.length} Total Submissions
          </span>

          {(selectedCategory !== 'all' || selectedWorkshopFilter !== 'all' || selectedRatingFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedWorkshopFilter('all');
                setSelectedRatingFilter('all');
                setSearchQuery('');
              }}
              className="text-2xs font-mono text-sky-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-mono text-sm font-bold uppercase">No Matching Feedback Records Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try modifying your search criteria or resetting filters. You can also share the public link with attendees to collect new evaluations.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-500/10">
            {filteredSubmissions.map((sub) => {
              const dateStr = sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              }) : 'N/A';

              const catBadgeColor = 
                sub.participantCategory === 'student' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' :
                sub.participantCategory === 'school' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                sub.participantCategory === 'college' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                'bg-slate-500/20 text-slate-300 border-slate-500/30';

              return (
                <div 
                  key={sub.id} 
                  className={`p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isLight ? 'hover:bg-slate-50/70' : 'hover:bg-slate-800/30'
                  }`}
                >
                  {/* Left Column: Participant & Workshop Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${catBadgeColor}`}>
                        {sub.participantCategory}
                      </span>
                      <h3 className={`text-sm font-bold font-mono uppercase tracking-wide truncate ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {sub.fullName}
                      </h3>
                      {sub.rollOrEmployeeId && (
                        <span className="text-[11px] font-mono text-slate-400">
                          #{sub.rollOrEmployeeId}
                        </span>
                      )}
                    </div>

                    <p className={`text-xs font-medium truncate ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <strong>{sub.institutionName}</strong> • {sub.city}, {sub.state}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-2xs font-mono text-slate-400">
                      <span className="flex items-center gap-1 text-sky-400">
                        <BookOpen className="w-3 h-3" /> {sub.workshopName}
                      </span>
                      <span>•</span>
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span>{sub.email}</span>
                      <span>•</span>
                      <span>{sub.phone}</span>
                    </div>

                    {/* Learnings Preview */}
                    {sub.keyLearnings && (
                      <p className={`text-2xs italic line-clamp-1 mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        "{sub.keyLearnings}"
                      </p>
                    )}
                  </div>

                  {/* Middle Column: Ratings & Recommendation */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className={`p-2.5 rounded-xl border text-center font-mono ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/70 border-slate-700'
                    }`}>
                      <span className="text-[9px] text-slate-400 block uppercase">Overall</span>
                      <span className="text-sm font-black text-amber-400 flex items-center justify-center gap-0.5">
                        {sub.overallRating}.0 <Star className="w-3 h-3 fill-amber-400" />
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-xl border text-center font-mono text-2xs ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/70 border-slate-700'
                    }`}>
                      <div className="flex justify-between gap-2"><span>Trainer:</span> <strong className="text-emerald-400">{sub.trainerKnowledgeRating}★</strong></div>
                      <div className="flex justify-between gap-2"><span>Hardware:</span> <strong className="text-blue-400">{sub.practicalHardwareRating}★</strong></div>
                    </div>

                    <div className={`p-2.5 rounded-xl border text-center font-mono text-2xs hidden sm:block ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/70 border-slate-700'
                    }`}>
                      <span className="text-[9px] text-slate-400 block uppercase">Recommend</span>
                      <span className="font-bold text-purple-400">{sub.recommendDakshyam}</span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isLight ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                      }`}
                      title="Inspect complete responses and comments"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      <span>View</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(sub.id, sub.fullName)}
                        className="p-2 rounded-xl border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                        title="Delete feedback entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL VIEW MODAL */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-2xl w-full rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto ${
                isLight ? 'bg-white border-blue-900/20 text-slate-900' : 'bg-[#0d1f38] border-sky-500/30 text-white'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-500/15">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-sky-400">
                    Participant Evaluation Audit • {selectedSubmission.id}
                  </span>
                  <h2 className="text-xl font-bold font-mono uppercase">
                    {selectedSubmission.fullName}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 rounded-xl hover:bg-slate-800/40 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Participant & Institution Info */}
              <div className={`p-4 rounded-2xl border grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-slate-800'
              }`}>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Category</span>
                  <span className="font-bold text-sky-400 uppercase">{selectedSubmission.participantCategory}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Role / Grade</span>
                  <span className="font-bold">{selectedSubmission.branchOrGrade || selectedSubmission.designationOrRole || 'Participant'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Roll / ID</span>
                  <span className="font-bold">{selectedSubmission.rollOrEmployeeId || 'N/A'}</span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-[10px] text-slate-400 block uppercase">Institution</span>
                  <span className="font-bold">{selectedSubmission.institutionName} ({selectedSubmission.city}, {selectedSubmission.state})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Email</span>
                  <span>{selectedSubmission.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Phone</span>
                  <span>{selectedSubmission.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Submitted</span>
                  <span>{new Date(selectedSubmission.submittedAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Workshop Metadata */}
              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                isLight ? 'bg-blue-50 border-blue-900/10 text-blue-950' : 'bg-blue-950/40 border-blue-900/30 text-sky-300'
              }`}>
                <span>Workshop: <strong>{selectedSubmission.workshopName}</strong></span>
                <span>Venue: <strong>{selectedSubmission.workshopVenue}</strong></span>
              </div>

              {/* Rating Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div className="p-3 rounded-xl border bg-amber-500/10 border-amber-500/30">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Overall</span>
                  <span className="text-base font-black text-amber-400">{selectedSubmission.overallRating} / 5 ★</span>
                </div>
                <div className="p-3 rounded-xl border bg-slate-800/40 border-slate-700">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Trainer</span>
                  <span className="text-base font-black text-emerald-400">{selectedSubmission.trainerKnowledgeRating} / 5 ★</span>
                </div>
                <div className="p-3 rounded-xl border bg-slate-800/40 border-slate-700">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Hardware Kit</span>
                  <span className="text-base font-black text-blue-400">{selectedSubmission.practicalHardwareRating} / 5 ★</span>
                </div>
                <div className="p-3 rounded-xl border bg-slate-800/40 border-slate-700">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Relevance</span>
                  <span className="text-base font-black text-purple-400">{selectedSubmission.industryRelevanceRating} / 5 ★</span>
                </div>
                <div className="p-3 rounded-xl border bg-slate-800/40 border-slate-700">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Management</span>
                  <span className="text-base font-black text-sky-400">{selectedSubmission.labManagementRating} / 5 ★</span>
                </div>
              </div>

              {/* Qualitative Written Text */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-mono font-bold uppercase text-sky-400 block text-[11px]">
                    Key Practical Learnings:
                  </span>
                  <p className={`p-3 rounded-xl border mt-1 leading-relaxed ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-slate-800'
                  }`}>
                    {selectedSubmission.keyLearnings}
                  </p>
                </div>

                {selectedSubmission.favoriteComponent && (
                  <div>
                    <span className="font-mono font-bold uppercase text-sky-400 block text-[11px]">
                      Favorite Experiment / Module:
                    </span>
                    <p className={`p-3 rounded-xl border mt-1 leading-relaxed ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-slate-800'
                    }`}>
                      {selectedSubmission.favoriteComponent}
                    </p>
                  </div>
                )}

                {selectedSubmission.improvementSuggestions && (
                  <div>
                    <span className="font-mono font-bold uppercase text-sky-400 block text-[11px]">
                      Improvement Suggestions:
                    </span>
                    <p className={`p-3 rounded-xl border mt-1 leading-relaxed ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-slate-800'
                    }`}>
                      {selectedSubmission.improvementSuggestions}
                    </p>
                  </div>
                )}

                {selectedSubmission.futureInterests && selectedSubmission.futureInterests.length > 0 && (
                  <div>
                    <span className="font-mono font-bold uppercase text-sky-400 block text-[11px]">
                      Topics Interested For Future:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedSubmission.futureInterests.map((interest, idx) => (
                        <span key={idx} className="text-2xs font-mono px-2 py-0.5 rounded bg-sky-900/30 text-sky-300 border border-sky-500/20">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSubmission.testimonial && (
                  <div>
                    <span className="font-mono font-bold uppercase text-sky-400 block text-[11px]">
                      Testimonial / Quote:
                    </span>
                    <p className={`p-3 rounded-xl border mt-1 italic text-amber-300 ${
                      isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-500/30'
                    }`}>
                      "{selectedSubmission.testimonial}"
                    </p>
                  </div>
                )}
              </div>

              {/* Close button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-6 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN PRIVILEGES MODAL ("MODIFY WORKSHOP FORM") */}
      <AnimatePresence>
        {isConfigModalOpen && isAdmin && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-3xl w-full rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto ${
                isLight ? 'bg-white border-blue-900/20 text-slate-900' : 'bg-[#0d1f38] border-sky-500/30 text-white'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-500/15">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-400 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" /> Administrator Form Privileges
                  </span>
                  <h2 className="text-xl font-bold font-mono uppercase">
                    Configure Workshops & Feedback Form
                  </h2>
                </div>
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-800/40 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {configSaveStatus && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                  {configSaveStatus}
                </div>
              )}

              {/* FORM STATUS TOGGLE */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-slate-800'
              }`}>
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase">Form Submission Status</h4>
                  <p className="text-[11px] text-slate-400">
                    Toggle whether attendees can currently submit responses via the shared link.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingConfig(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                  className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    editingConfig.isOpen
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-rose-500/20 border-rose-500 text-rose-400'
                  }`}
                >
                  {editingConfig.isOpen ? '✓ FORM IS OPEN' : '✕ FORM IS PAUSED'}
                </button>
              </div>

              {/* FORM TITLE & SUBTITLE */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono font-bold uppercase block mb-1">
                    Form Title
                  </label>
                  <input
                    type="text"
                    value={editingConfig.formTitle}
                    onChange={(e) => setEditingConfig(prev => ({ ...prev, formTitle: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-bold uppercase block mb-1">
                    Instructions / Guidelines Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={editingConfig.formSubtitle}
                    onChange={(e) => setEditingConfig(prev => ({ ...prev, formSubtitle: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* MANAGE WORKSHOPS LIST */}
              <div className="space-y-3 pt-3 border-t border-slate-500/15">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase text-sky-400">
                    Workshop Programs ({editingConfig.workshops.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddWorkshopForm(!showAddWorkshopForm)}
                    className="text-2xs font-mono px-2.5 py-1 rounded-lg border border-sky-500/30 text-sky-300 hover:bg-sky-500/10 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Workshop Program
                  </button>
                </div>

                {/* Add Workshop Form */}
                {showAddWorkshopForm && (
                  <div className={`p-4 rounded-2xl border space-y-3 text-xs font-mono ${
                    isLight ? 'bg-blue-50 border-blue-900/15' : 'bg-slate-900/80 border-slate-700'
                  }`}>
                    <span className="font-bold uppercase text-sky-400 block text-[11px]">New Workshop Session</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Workshop Title *"
                        value={newWsName}
                        onChange={(e) => setNewWsName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 bg-black/40 text-white text-xs"
                      />
                      <input
                        type="date"
                        value={newWsDate}
                        onChange={(e) => setNewWsDate(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 bg-black/40 text-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Venue / Institute Campus"
                        value={newWsVenue}
                        onChange={(e) => setNewWsVenue(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 bg-black/40 text-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Lead Trainer / Instructor"
                        value={newWsTrainer}
                        onChange={(e) => setNewWsTrainer(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 bg-black/40 text-white text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddWorkshopForm(false)}
                        className="px-3 py-1 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddWorkshop}
                        className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Save Workshop
                      </button>
                    </div>
                  </div>
                )}

                {/* Workshops List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editingConfig.workshops.map((ws) => (
                    <div
                      key={ws.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-mono ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <strong className="block truncate">{ws.name}</strong>
                        <span className="text-[10px] text-slate-400">Date: {ws.date} • Venue: {ws.venue}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewWorkshopId(ws.id);
                            setShowPreviewModal(true);
                          }}
                          className="px-2 py-1 rounded text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 cursor-pointer flex items-center gap-1 text-[10px] font-mono border border-amber-500/20"
                          title="Preview feedback form for this workshop"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => copyShareLink(ws.id, true)}
                          className="p-1 rounded text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 cursor-pointer"
                          title="Copy Vercel Share Link for this workshop"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingConfig(prev => ({
                              ...prev,
                              workshops: prev.workshops.map(w => w.id === ws.id ? { ...w, isActive: !w.isActive } : w)
                            }));
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded ${
                            ws.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {ws.isActive ? 'Active' : 'Archived'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (editingConfig.workshops.length <= 1) {
                              alert('At least one workshop is required.');
                              return;
                            }
                            setEditingConfig(prev => ({
                              ...prev,
                              workshops: prev.workshops.filter(w => w.id !== ws.id)
                            }));
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="Remove workshop"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CUSTOM QUESTIONS BUILDER */}
              <div className="space-y-3 pt-3 border-t border-slate-500/15">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase text-sky-400">
                    Custom Questions Builder ({(editingConfig.customQuestions || []).length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddQuestionForm(!showAddQuestionForm)}
                    className="text-2xs font-mono px-2.5 py-1 rounded-lg border border-sky-500/30 text-sky-300 hover:bg-sky-500/10 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Custom Question
                  </button>
                </div>

                {/* Add Question Form */}
                {showAddQuestionForm && (
                  <div className={`p-4 rounded-2xl border space-y-3 text-xs font-mono ${
                    isLight ? 'bg-blue-50 border-blue-900/15' : 'bg-slate-900/80 border-slate-700'
                  }`}>
                    <span className="font-bold uppercase text-sky-400 block text-[11px]">New Question Definition</span>
                    <input
                      type="text"
                      placeholder="Question prompt label (e.g. How was the hardware kit?)"
                      value={newQuesLabel}
                      onChange={(e) => setNewQuesLabel(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-black/40 text-white text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newQuesType}
                        onChange={(e) => setNewQuesType(e.target.value as any)}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 bg-black/40 text-white text-xs"
                      >
                        <option value="choice">Multiple Choice</option>
                        <option value="yesno">Yes / No</option>
                        <option value="text">Short Text Response</option>
                      </select>

                      <label className="flex items-center gap-2 text-2xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newQuesRequired}
                          onChange={(e) => setNewQuesRequired(e.target.checked)}
                          className="rounded"
                        />
                        <span>Mandatory / Required</span>
                      </label>
                    </div>

                    {newQuesType === 'choice' && (
                      <input
                        type="text"
                        placeholder="Comma-separated options (e.g. Too Fast, Balanced, Slow)"
                        value={newQuesOptions}
                        onChange={(e) => setNewQuesOptions(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-black/40 text-white text-xs"
                      />
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddQuestionForm(false)}
                        className="px-3 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Add Question
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing Custom Questions */}
                <div className="space-y-2">
                  {(editingConfig.customQuestions || []).map((q) => (
                    <div
                      key={q.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-mono ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-slate-800'
                      }`}
                    >
                      <div>
                        <strong className="block">{q.label}</strong>
                        <span className="text-[10px] text-slate-400">
                          Type: {q.type.toUpperCase()} • {q.required ? 'Required' : 'Optional'}
                          {q.options ? ` (${q.options.join(', ')})` : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingConfig(prev => ({
                            ...prev,
                            customQuestions: prev.customQuestions.filter(x => x.id !== q.id)
                          }));
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save All Config Changes */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-500/15">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-mono text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  Save Configuration Changes
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INTERACTIVE WORKSHOP FORM PREVIEW MODAL */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto">
            {/* TOP FLOATING CONTROLS BAR */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`w-full max-w-5xl rounded-2xl border p-3 mb-3 flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-xl z-20 shrink-0 ${
                isLight ? 'bg-white/95 border-slate-300 text-slate-900' : 'bg-slate-900/95 border-sky-500/30 text-white'
              }`}
            >
              {/* Left: Branding & Workshop Switcher */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-2xs font-mono font-bold uppercase">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Form Preview</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono">
                  <span className="text-slate-400 hidden sm:inline">Workshop:</span>
                  <select
                    value={previewWorkshopId || ''}
                    onChange={(e) => setPreviewWorkshopId(e.target.value || null)}
                    className={`px-2 py-1 rounded-lg border text-2xs font-mono font-bold max-w-[180px] sm:max-w-xs truncate ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-sky-200'
                    }`}
                  >
                    <option value="">-- General / Any Workshop --</option>
                    {config.workshops.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.date})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Center: Device Viewport Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-black/30 border border-slate-700/60 gap-1 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 text-2xs font-bold transition-all cursor-pointer ${
                    previewDevice === 'desktop' 
                      ? 'bg-sky-500 text-slate-950 shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop View (Full Screen)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 text-2xs font-bold transition-all cursor-pointer ${
                    previewDevice === 'tablet' 
                      ? 'bg-sky-500 text-slate-950 shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tablet View (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 text-2xs font-bold transition-all cursor-pointer ${
                    previewDevice === 'mobile' 
                      ? 'bg-sky-500 text-slate-950 shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile View (390px phone)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Mobile</span>
                </button>
              </div>

              {/* Right: Actions & Close */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyShareLink(previewWorkshopId || '', true)}
                  className={`px-2.5 py-1 rounded-lg border text-2xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    linkCopied 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title="Copy student link for this workshop"
                >
                  {linkCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span className="hidden sm:inline">{linkCopied ? 'Copied' : 'Copy Link'}</span>
                </button>

                {onOpenPublicForm && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPublicForm(previewWorkshopId || undefined);
                      setShowPreviewModal(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-2xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                    title="Open form full screen"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="hidden sm:inline">Open Tab</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 cursor-pointer transition-all"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* PREVIEW VIEWPORT FRAME */}
            <div className="w-full flex-1 flex items-start justify-center pb-8 overflow-y-auto">
              <motion.div
                layout
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className={`w-full transition-all duration-300 ${
                  previewDevice === 'mobile'
                    ? 'max-w-[395px] rounded-[40px] border-4 border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden bg-slate-950 p-2 my-2'
                    : previewDevice === 'tablet'
                    ? 'max-w-[768px] rounded-3xl border-2 border-slate-700/60 shadow-2xl overflow-hidden bg-slate-950 p-3 my-2'
                    : 'max-w-5xl'
                }`}
              >
                {/* Mobile Phone Speaker Notch Simulation */}
                {previewDevice === 'mobile' && (
                  <div className="w-full flex items-center justify-center pb-2 pt-1">
                    <div className="w-24 h-4 bg-slate-800 rounded-full flex items-center justify-center gap-2">
                      <div className="w-8 h-1 bg-slate-700 rounded-full" />
                      <div className="w-2 h-2 bg-slate-700 rounded-full" />
                    </div>
                  </div>
                )}

                {/* Embedded Live Form in Preview Mode */}
                <div className={`overflow-y-auto max-h-[82vh] ${previewDevice === 'mobile' ? 'rounded-2xl' : ''}`}>
                  <WorkshopFeedbackForm
                    theme={theme}
                    preselectedWorkshopId={previewWorkshopId}
                    isPreviewMode={true}
                    onNavigateHome={() => setShowPreviewModal(false)}
                    onClosePreview={() => setShowPreviewModal(false)}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
