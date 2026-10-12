import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Search, Calendar, MapPin, User, CheckCircle2, 
  Copy, Check, ExternalLink, QrCode, X, Sparkles, Filter, 
  Award, Clock, ArrowRight, Share2, Layers, Download
} from 'lucide-react';
import { WorkshopItem } from '../types';
import { notifySuccess, notifyInfo } from '../utils/toast';
import { WorkshopFeedbackStorage, getWorkshopShareUrl, DEFAULT_WORKSHOPS } from '../utils/feedbackStorage';

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

  // Fallback to stored workshops if workshops prop is empty or not provided
  const workshopsList = useMemo(() => {
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
  }, [initialWorkshops]);

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

              <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 font-mono text-2xs">
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
                  <h3 className="text-sm font-bold uppercase">No matching workshops found</h3>
                  <p className="text-2xs max-w-sm mx-auto">
                    Try adjusting your search keywords or toggle the active filter to view all cataloged sessions.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                    className="px-4 py-2 text-xs rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold cursor-pointer transition-all"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                filteredWorkshops.map((ws, idx) => {
                  const isSelected = selectedWorkshopId === ws.id;

                  return (
                    <div
                      key={`${ws.id}-${idx}`}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        isSelected
                          ? (isLight 
                              ? 'bg-blue-50/80 border-blue-950 shadow-sm ring-1 ring-blue-900/20' 
                              : 'bg-blue-950/40 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.15)] ring-1 ring-sky-400/30')
                          : (isLight 
                              ? 'bg-white border-slate-200 hover:border-blue-900/30 hover:shadow-sm' 
                              : 'bg-black/30 border-blue-900/30 hover:border-blue-700/60 hover:bg-[#071326]/60')
                      }`}
                    >
                      {/* Left: Info Block */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${
                            ws.isActive
                              ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30')
                              : (isLight ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-slate-800 text-slate-400 border-slate-700')
                          }`}>
                            {ws.isActive ? '● Active Session' : '○ Concluded'}
                          </span>

                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-900 text-slate-300 border-slate-800'
                          }`}>
                            ID: {ws.id}
                          </span>

                          {isSelected && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              ✓ CURRENT SELECTION
                            </span>
                          )}
                        </div>

                        <h3 className={`text-sm sm:text-base font-black uppercase font-mono tracking-wide ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {ws.name}
                        </h3>

                        {/* Meta Pills */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>{ws.date}</strong>
                          </span>

                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-sky-400" />
                            <span className="truncate max-w-[220px]">{ws.venue}</span>
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
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap md:flex-col items-stretch md:items-end gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-500/10">
                        {onSelectWorkshop && (
                          <button
                            type="button"
                            onClick={() => handleSelect(ws)}
                            className={`w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                              isSelected
                                ? (isLight 
                                    ? 'bg-blue-950 text-white font-extrabold shadow-md' 
                                    : 'bg-sky-400 text-slate-950 font-black shadow-[0_0_15px_rgba(56,189,248,0.4)]')
                                : (isLight 
                                    ? 'bg-blue-900 hover:bg-blue-950 text-white' 
                                    : 'bg-white hover:bg-slate-100 text-slate-950 font-bold')
                            }`}
                          >
                            {isSelected ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                            <span>{isSelected ? 'Currently Selected' : 'Select This Session'}</span>
                          </button>
                        )}

                        <div className="flex items-center gap-1.5 w-full md:w-auto">
                          <button
                            type="button"
                            onClick={(e) => handleCopy(ws.id, e)}
                            className={`flex-1 md:flex-initial px-3 py-1.5 rounded-xl border text-2xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              copiedId === ws.id
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : isLight 
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                            title="Copy student evaluation link"
                          >
                            {copiedId === ws.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === ws.id ? 'Copied Link' : 'Copy Link'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenQr(ws, e)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
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
                            className="p-2 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 transition-all cursor-pointer"
                            title="Open evaluation form in portal"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

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
    </AnimatePresence>
  );
}
