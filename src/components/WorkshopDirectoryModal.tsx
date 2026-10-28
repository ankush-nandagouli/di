import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Search, Calendar, MapPin, User, CheckCircle2, 
  Copy, Check, ExternalLink, QrCode, X, Sparkles, Filter, 
  Award, Clock, ArrowRight, Share2, Layers, Download,
  Camera, Video, Edit3, Maximize2, Eye, Rocket
} from 'lucide-react';
import { WorkshopItem } from '../types';
import { notifySuccess, notifyInfo } from '../utils/toast';
import { WorkshopFeedbackStorage, getWorkshopShareUrl, DEFAULT_WORKSHOPS } from '../utils/feedbackStorage';
import WorkshopDetailsModal from './WorkshopDetailsModal';
import WorkshopDirectoryManager from './WorkshopDirectoryManager';

interface WorkshopDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workshops?: WorkshopItem[];
  theme?: 'light' | 'dark';
  selectedWorkshopId?: string | null;
  onSelectWorkshop?: (workshop: WorkshopItem) => void;
  onCopyLink?: (workshopId: string) => void;
  onOpenForm?: (workshopId: string) => void;
  onViewQr?: (workshop: WorkshopItem) => void;
  currentUserRole?: 'admin' | 'trainer' | 'student';
}

export default function WorkshopDirectoryModal({
  isOpen,
  onClose,
  workshops: initialWorkshops,
  theme = 'dark',
  selectedWorkshopId = null,
  onSelectWorkshop,
  onCopyLink,
  onOpenForm,
  onViewQr,
  currentUserRole
}: WorkshopDirectoryModalProps) {
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModalWorkshop, setQrModalWorkshop] = useState<WorkshopItem | null>(null);
  const [selectedDetailWorkshop, setSelectedDetailWorkshop] = useState<WorkshopItem | null>(null);
  const [localWorkshops, setLocalWorkshops] = useState<WorkshopItem[] | null>(null);
  const isStaff = currentUserRole === 'admin' || currentUserRole === 'trainer';
  const [showManagerView, setShowManagerView] = useState(false);

  // Fallback to stored workshops if workshops prop is empty or not provided
  const workshopsList = useMemo(() => {
    if (localWorkshops && localWorkshops.length > 0) {
      return localWorkshops;
    }
    if (initialWorkshops && initialWorkshops.length > 0) {
      return initialWorkshops;
    }
    try {
      const cfg = WorkshopFeedbackStorage.getFeedbackConfig();
      if (cfg && cfg.workshops && cfg.workshops.length > 0) {
        return cfg.workshops;
      }
    } catch {}
    return DEFAULT_WORKSHOPS;
  }, [initialWorkshops, localWorkshops]);

  const handleWorkshopUpdated = (updated: WorkshopItem) => {
    setLocalWorkshops(prev => {
      const base = prev || workshopsList;
      return base.map(w => w.id === updated.id ? updated : w);
    });
    setSelectedDetailWorkshop(updated);
  };

  const handleCreateNewWorkshop = async (targetStatus: 'upcoming' | 'concluded') => {
    try {
      const isUpcoming = targetStatus === 'upcoming';
      const result = await WorkshopFeedbackStorage.createWorkshop(
        {
          name: isUpcoming ? 'Upcoming Engineering Workshop' : 'Concluded Hands-On Workshop',
          date: new Date().toISOString().split('T')[0],
          venue: 'Dakshyam Central STEM & Robotics Lab, Balaghat',
          trainerName: currentUserRole === 'trainer' ? 'Dakshyam Lead Trainer' : 'Anand Gautam & Tech Leads',
          trainerEmail: currentUserRole === 'trainer' ? 'trainer@dakshyam.com' : 'admin@dakshyam.com',
          status: targetStatus,
          isActive: isUpcoming,
          description: isUpcoming 
            ? 'Hands-on practical bootcamp scheduled for the upcoming cohort. All syllabus topics, prerequisites, and equipment details can be fully edited.'
            : 'Concluded practical engineering workshop session with project demonstrations, participant archives, and curriculum records.',
          schedule: '09:30 AM - 04:30 PM (Multi-Day Session)',
          targetAudience: 'Polytechnic, Engineering Undergrads & School STEM Students'
        },
        currentUserRole === 'trainer' ? 'trainer@dakshyam.com' : 'admin@dakshyam.com',
        currentUserRole || 'admin'
      );

      if (result.success && result.workshop) {
        const freshList = WorkshopFeedbackStorage.getFeedbackConfig().workshops;
        setLocalWorkshops(freshList);
        setSelectedDetailWorkshop(result.workshop);
        notifySuccess(`New ${targetStatus} workshop established! You can now edit every field and attach media.`);
      }
    } catch (e: any) {
      notifyInfo('Error initializing workshop: ' + (e?.message || 'Check storage'));
    }
  };

  // Lock background body scroll cleanly while modal is open & prevent scroll chaining
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (qrModalWorkshop) {
          setQrModalWorkshop(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow || '';
      document.body.style.touchAction = previousTouchAction || '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, qrModalWorkshop, onClose]);

  // Filtered workshops list
  const filteredWorkshops = useMemo(() => {
    return workshopsList.filter(ws => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        ws.name.toLowerCase().includes(q) ||
        ws.venue.toLowerCase().includes(q) ||
        (ws.trainerName && ws.trainerName.toLowerCase().includes(q)) ||
        (ws.description && ws.description.toLowerCase().includes(q)) ||
        (ws.id && ws.id.toLowerCase().includes(q)) ||
        (ws.date && ws.date.toLowerCase().includes(q));

      const matchesStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? ws.isActive :
        !ws.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [workshopsList, searchQuery, statusFilter]);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopyLink) {
      onCopyLink(id);
    } else {
      const ws = workshopsList.find(w => w.id === id);
      const url = getWorkshopShareUrl(ws || id, true);
      navigator.clipboard.writeText(url).then(() => {
        notifySuccess('Workshop evaluation link copied to clipboard!');
      }).catch(() => {
        notifyInfo('Link: ' + url);
      });
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenQr = (ws: WorkshopItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewQr) {
      onViewQr(ws);
    } else {
      setQrModalWorkshop(ws);
    }
  };

  const handleSelect = (ws: WorkshopItem) => {
    if (onSelectWorkshop) {
      onSelectWorkshop(ws);
    }
    onClose();
  };

  const handleOpenPublicForm = (wsId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenForm) {
      onOpenForm(wsId);
    } else {
      const ws = workshopsList.find(w => w.id === wsId);
      const url = getWorkshopShareUrl(ws || wsId, false);
      window.location.href = url;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="workshop-directory-modal-title"
        >
          {/* Backdrop Overlay with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Card Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 w-full max-w-4xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
              isLight 
                ? 'bg-white border-blue-900/15 text-slate-900 shadow-slate-900/20' 
                : 'bg-[#0a192f] border-blue-500/30 text-white shadow-black/80'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER BAR */}
            <div className={`p-4 sm:p-6 border-b shrink-0 flex items-start justify-between gap-4 ${
              isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-[#071326]/90 border-blue-900/40'
            }`}>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-4xs font-mono font-bold uppercase tracking-widest border ${
                    isLight 
                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    <Building2 className="w-3 h-3 inline mr-1" />
                    Official Program Directory
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    {workshopsList.length} Sessions Cataloged
                  </span>
                </div>
                <h2 
                  id="workshop-directory-modal-title"
                  className={`text-base sm:text-lg font-black font-mono uppercase tracking-wide truncate ${
                    isLight ? 'text-blue-950' : 'text-white'
                  }`}
                >
                  Dakshyam Workshops Directory
                </h2>
                <p className={`text-xs font-sans max-w-2xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-350'}`}>
                  Explore hands-on IoT, Robotics, and Computer Science bootcamp workshops across central India campuses.
                  {onSelectWorkshop ? ' Select any session to apply it directly to your evaluation form.' : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isStaff && (
                  <button
                    type="button"
                    onClick={() => setShowManagerView(!showManagerView)}
                    className={`px-3 py-1.5 rounded-xl border font-mono text-2xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      showManagerView
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                        : isLight 
                          ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30'
                    }`}
                    title="Manage workshops directory"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{showManagerView ? '👁️ Browse Public Catalog' : '🛠️ Edit Directory & All Fields (CRUD)'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                    isLight 
                      ? 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900' 
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Close directory (Esc)"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showManagerView ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                <WorkshopDirectoryManager
                  userRole={currentUserRole === 'trainer' ? 'trainer' : 'admin'}
                  theme={theme}
                  onRefresh={() => {
                    const fresh = WorkshopFeedbackStorage.getFeedbackConfig().workshops;
                    setLocalWorkshops(fresh);
                  }}
                />
              </div>
            ) : (
              <>
            {/* SEARCH & FILTERS CONTROLS */}
            <div className={`p-3.5 sm:p-4 border-b shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0d2242]/40 border-blue-900/30'
            }`}>
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workshops by name, venue, instructor, topic, date, or ID..."
                  className={`w-full pl-10 pr-9 py-2.5 text-xs font-mono rounded-xl border focus:outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-950 focus:bg-white' 
                      : 'bg-[#071326] border-blue-900/50 text-white focus:border-sky-400 placeholder:text-slate-500'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono p-1"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 font-mono text-2xs flex-wrap">
                {(['all', 'active', 'archived'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-2 rounded-xl border font-bold capitalize transition-all cursor-pointer ${
                      statusFilter === status
                        ? (isLight 
                            ? 'bg-blue-950 text-white border-blue-950 shadow-xs' 
                            : 'bg-sky-500/20 text-sky-300 border-sky-400/50 shadow-[0_0_10px_rgba(56,189,248,0.2)]')
                        : (isLight 
                            ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' 
                            : 'bg-black/30 text-slate-400 border-slate-800 hover:text-white')
                    }`}
                  >
                    {status === 'all' ? 'All Sessions' : status === 'active' ? 'Active' : 'Concluded'}
                  </button>
                ))}

                {(currentUserRole === 'admin' || currentUserRole === 'trainer') && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <button
                      type="button"
                      onClick={() => handleCreateNewWorkshop('upcoming')}
                      className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                        isLight 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                      }`}
                      title="Add a new upcoming workshop with all editable fields"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>+ Upcoming</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateNewWorkshop('concluded')}
                      className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                        isLight 
                          ? 'bg-purple-800 hover:bg-purple-900 text-white border-purple-800 shadow-xs' 
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                      }`}
                      title="Add a concluded workshop with media and reports"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>+ Concluded</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* WORKSHOP CARDS LIST STREAM (Fluid Isolated Momentum Scrolling) */}
            <div 
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3.5 divide-y-0 touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {filteredWorkshops.length === 0 ? (
                <div className={`p-10 text-center rounded-2xl border space-y-3 font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-black/30 border-blue-900/30 text-slate-400'
                }`}>
                  <Building2 className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
                  <h3 className="text-sm font-bold uppercase">No workshops currently cataloged</h3>
                  <p className="text-2xs max-w-sm mx-auto">
                    {searchQuery 
                      ? 'No workshops match your search keywords or active filter.' 
                      : 'There are currently no active or concluded workshops published in the directory.'}
                  </p>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                      className="px-4 py-2 text-xs rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold cursor-pointer transition-all"
                    >
                      Reset All Filters
                    </button>
                  )}
                  {isStaff && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleCreateNewWorkshop('upcoming')}
                        className="px-4 py-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-all"
                      >
                        + Create First Workshop
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                filteredWorkshops.map((ws, idx) => {
                  const isSelected = selectedWorkshopId === ws.id;
                  const photosCount = (ws.photos && ws.photos.length) || 0;
                  const videosCount = (ws.videos && ws.videos.length) || 0;
                  const thumbnailUrl = ws.thumbnailUrl || (ws.photos && ws.photos.length > 0 ? ws.photos[0] : '');

                  return (
                    <div
                      key={`${ws.id}-${idx}`}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 text-left flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 group/card ${
                        isSelected
                          ? (isLight 
                              ? 'bg-blue-50/80 border-blue-950 shadow-sm ring-1 ring-blue-900/20' 
                              : 'bg-blue-950/40 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.15)] ring-1 ring-sky-400/30')
                          : (isLight 
                              ? 'bg-white border-slate-200 hover:border-blue-900/40 hover:shadow-md' 
                              : 'bg-black/30 border-blue-900/30 hover:border-cyan-400/50 hover:bg-[#071326]/70 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]')
                      }`}
                    >
                      {/* Left: Interactive Workshop Thumbnail */}
                      <div 
                        onClick={() => setSelectedDetailWorkshop(ws)}
                        className="relative w-full md:w-52 h-36 rounded-xl overflow-hidden shrink-0 bg-slate-950 cursor-pointer group/thumb shadow-sm flex items-center justify-center"
                      >
                        {thumbnailUrl ? (
                          <img 
                            src={thumbnailUrl} 
                            alt={ws.name} 
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950/70 to-slate-900 flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                            <Building2 className="w-8 h-8 text-cyan-400/50" />
                            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider line-clamp-1">{ws.name}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 pointer-events-none" />
                        
                        {/* Status Badge */}
                        <div className="absolute top-2 left-2 z-10">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-mono font-black uppercase tracking-wider shadow-sm backdrop-blur-xs ${
                            ws.isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {ws.isActive ? '● Active' : '○ Concluded'}
                          </span>
                        </div>

                        {/* ID Badge */}
                        <div className="absolute top-2 right-2 z-10">
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/70 text-slate-300 backdrop-blur-xs border border-white/10">
                            {ws.id}
                          </span>
                        </div>

                        {/* Bottom Media Counters on Thumbnail */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[8.5px] font-mono font-bold z-10 pointer-events-none">
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 bg-black/75 px-1.5 py-0.5 rounded backdrop-blur-xs text-cyan-300 border border-cyan-400/20">
                              <Camera className="w-3 h-3 text-cyan-400" />
                              <span>{photosCount}</span>
                            </span>
                            {videosCount > 0 && (
                              <span className="flex items-center gap-1 bg-black/75 px-1.5 py-0.5 rounded backdrop-blur-xs text-purple-300 border border-purple-400/20">
                                <Video className="w-3 h-3 text-purple-400" />
                                <span>{videosCount}</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[8px] text-cyan-300 font-bold bg-blue-600/90 px-2 py-0.5 rounded flex items-center gap-1 shadow">
                            <Maximize2 className="w-2.5 h-2.5" />
                            <span>Details</span>
                          </span>
                        </div>
                      </div>

                      {/* Center: Info Block (Clickable to open details) */}
                      <div 
                        onClick={() => setSelectedDetailWorkshop(ws)}
                        className="space-y-1.5 flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          {isSelected && (
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              ✓ CURRENT SELECTION
                            </span>
                          )}
                          {ws.targetAudience && (
                            <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded border ${
                              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}>
                              {ws.targetAudience}
                            </span>
                          )}
                        </div>

                        <h3 className={`text-sm sm:text-base font-black uppercase font-mono tracking-wide group-hover/card:text-cyan-400 transition-colors line-clamp-1 ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {ws.name}
                        </h3>

                        {/* Meta Details */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>{ws.date}</strong>
                          </span>

                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-sky-400" />
                            <span className="truncate max-w-[200px]">{ws.venue}</span>
                          </span>

                          {ws.trainerName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{ws.trainerName}</span>
                            </span>
                          )}
                        </div>

                        {ws.description && (
                          <p className={`text-xs font-sans leading-relaxed line-clamp-2 ${
                            isLight ? 'text-slate-600' : 'text-slate-350'
                          }`}>
                            {ws.description}
                          </p>
                        )}

                        <div className="pt-1 flex items-center gap-2 text-[9px] font-mono text-cyan-500 font-bold">
                          <span>Click tile to view {photosCount} photos & full workshop syllabus &rarr;</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap md:flex-col items-stretch md:items-end gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-500/10">
                        {/* Open Details & Media button */}
                        <button
                          type="button"
                          onClick={() => setSelectedDetailWorkshop(ws)}
                          className="w-full md:w-auto px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details & Media</span>
                        </button>

                        {onSelectWorkshop && (
                          <button
                            type="button"
                            onClick={() => handleSelect(ws)}
                            className={`w-full md:w-auto px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                              isSelected
                                ? (isLight 
                                    ? 'bg-blue-950 text-white font-extrabold shadow-md' 
                                    : 'bg-sky-400 text-slate-950 font-black shadow-[0_0_15px_rgba(56,189,248,0.4)]')
                                : (isLight 
                                    ? 'bg-blue-900 hover:bg-blue-950 text-white' 
                                    : 'bg-white hover:bg-slate-100 text-slate-950 font-bold')
                            }`}
                          >
                            {isSelected ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                            <span>{isSelected ? 'Selected' : 'Select'}</span>
                          </button>
                        )}

                        <div className="flex items-center gap-1.5 w-full md:w-auto">
                          <button
                            type="button"
                            onClick={(e) => handleCopy(ws.id, e)}
                            className={`flex-1 md:flex-initial px-2.5 py-1.5 rounded-xl border text-2xs font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              copiedId === ws.id
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : isLight 
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                            title="Copy student evaluation link"
                          >
                            {copiedId === ws.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === ws.id ? 'Copied' : 'Link'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenQr(ws, e)}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                              isLight 
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                            title="Generate & View Workshop QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5 text-sky-400" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenPublicForm(ws.id, e)}
                            className="p-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 transition-all cursor-pointer"
                            title="Open evaluation form in portal"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {(currentUserRole === 'admin' || currentUserRole === 'trainer') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDetailWorkshop(ws);
                              }}
                              className="p-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 transition-all cursor-pointer"
                              title="Edit Workshop Media & Photos"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

            {/* FOOTER BAR */}
            <div className={`p-3.5 sm:p-4 border-t shrink-0 flex items-center justify-between text-2xs font-mono ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#071326] border-blue-900/40 text-slate-400'
            }`}>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Dakshyam Innovations • NEP 2020 Hands-on Experiential Learning</span>
                <span className="sm:hidden">NEP 2020 Learning</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' 
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
                }`}
              >
                Close Directory
              </button>
            </div>
          </motion.div>

          {/* BUILT-IN WORKSHOP QR CODE VIEWER MODAL */}
          <AnimatePresence>
            {qrModalWorkshop && (
              <div 
                className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
                onClick={() => setQrModalWorkshop(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className={`max-w-sm w-full rounded-3xl border shadow-2xl p-6 space-y-4 text-center ${
                    isLight ? 'bg-white border-blue-900/20 text-slate-900' : 'bg-[#0d1f38] border-sky-500/30 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-500/15">
                    <div className="text-left">
                      <span className="text-[10px] font-mono uppercase font-bold text-sky-400">
                        Workshop QR Code
                      </span>
                      <h3 className="text-sm font-bold font-mono truncate max-w-[220px]">
                        {qrModalWorkshop.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQrModalWorkshop(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 bg-white rounded-2xl mx-auto inline-block border-4 border-slate-200 shadow-inner">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                        getWorkshopShareUrl(qrModalWorkshop, true)
                      )}`}
                      alt={`QR Code for ${qrModalWorkshop.name}`}
                      className="w-48 h-48 object-contain"
                    />
                  </div>

                  <p className="text-2xs font-mono text-slate-400">
                    Display on projector or print for participants to scan and submit evaluations directly.
                  </p>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => handleCopy(qrModalWorkshop.id, e)}
                      className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedId === qrModalWorkshop.id ? 'Copied' : 'Copy Form URL'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrModalWorkshop(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white font-mono text-xs font-bold cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* WORKSHOP DETAILS & MULTI-MEDIA SHOWCASE MODAL */}
      <WorkshopDetailsModal
        workshop={selectedDetailWorkshop}
        isOpen={!!selectedDetailWorkshop}
        onClose={() => setSelectedDetailWorkshop(null)}
        theme={theme}
        currentUserRole={currentUserRole}
        onViewQr={(ws) => {
          setSelectedDetailWorkshop(null);
          setQrModalWorkshop(ws);
        }}
        onWorkshopUpdated={handleWorkshopUpdated}
      />
    </AnimatePresence>
  );
}
