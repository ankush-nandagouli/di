import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Search, Plus, Edit, Trash2, Calendar, MapPin, 
  User, Mail, Phone, Clock, BookOpen, Layers, CheckCircle2, 
  X, AlertCircle, Copy, Check, QrCode, ExternalLink, 
  Image as ImageIcon, Video, Film, Star, ChevronRight, Eye, 
  RefreshCw, Upload, Sparkles, Filter, Tag, Cpu, CopyCheck,
  Maximize2, ArrowRight
} from 'lucide-react';
import { WorkshopItem, WorkshopVideo } from '../types';
import { 
  WorkshopFeedbackStorage, 
  getWorkshopShareUrl, 
  getWorkshopQueryShareUrl, 
  toWorkshopSlug,
  DEFAULT_WORKSHOPS 
} from '../utils/feedbackStorage';
import { uploadMediaToCloudinary } from '../utils/mediaUpload';
import { notifySuccess, notifyError, notifyWarning, notifyInfo } from '../utils/toast';
import WorkshopDetailsModal from './WorkshopDetailsModal';

interface WorkshopDirectoryManagerProps {
  userRole: 'admin' | 'trainer';
  currentUserEmail?: string;
  currentTrainerName?: string;
  theme?: 'light' | 'dark';
  onRefresh?: () => void;
  onOpenDirectoryModal?: () => void;
}

export default function WorkshopDirectoryManager({
  userRole,
  currentUserEmail = 'admin@dakshyam.com',
  currentTrainerName = 'Dakshyam Faculty',
  theme = 'dark',
  onRefresh,
  onOpenDirectoryModal
}: WorkshopDirectoryManagerProps) {
  const isLight = theme === 'light';

  // State
  const [workshops, setWorkshops] = useState<WorkshopItem[]>(() => {
    try {
      const cfg = WorkshopFeedbackStorage.getFeedbackConfig();
      if (cfg && cfg.workshops && cfg.workshops.length > 0) return cfg.workshops;
    } catch {}
    return DEFAULT_WORKSHOPS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'concluded' | 'active' | 'locked'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingWorkshopId, setEditingWorkshopId] = useState<string | null>(null); // null = new, string = edit
  const [deletingWorkshop, setDeletingWorkshop] = useState<WorkshopItem | null>(null);
  const [previewWorkshop, setPreviewWorkshop] = useState<WorkshopItem | null>(null);
  const [qrWorkshop, setQrWorkshop] = useState<WorkshopItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formTrainerName, setFormTrainerName] = useState('');
  const [formTrainerEmail, setFormTrainerEmail] = useState('');
  const [formStatus, setFormStatus] = useState<'upcoming' | 'concluded'>('upcoming');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formTargetAudience, setFormTargetAudience] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSchedule, setFormSchedule] = useState('');
  const [formPrerequisites, setFormPrerequisites] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [formVideos, setFormVideos] = useState<WorkshopVideo[]>([]);
  const [formHighlights, setFormHighlights] = useState<string[]>([]);
  const [formEquipment, setFormEquipment] = useState<string[]>([]);

  // Form temporary inputs
  const [newHighlight, setNewHighlight] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Video form inputs
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [formTab, setFormTab] = useState<'core' | 'curriculum' | 'media' | 'contact'>('core');

  // Refresh workshop list from storage
  const reloadWorkshops = async () => {
    setIsLoading(true);
    try {
      const cfg = await WorkshopFeedbackStorage.fetchFeedbackConfigFromFirestore();
      if (cfg && cfg.workshops) {
        setWorkshops(cfg.workshops);
      } else {
        const localCfg = WorkshopFeedbackStorage.getFeedbackConfig();
        setWorkshops(localCfg.workshops || DEFAULT_WORKSHOPS);
      }
    } catch {
      const localCfg = WorkshopFeedbackStorage.getFeedbackConfig();
      setWorkshops(localCfg.workshops || DEFAULT_WORKSHOPS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadWorkshops();
  }, []);

  // Filtered workshops
  const filteredWorkshops = useMemo(() => {
    return workshops.filter(ws => {
      const matchesSearch = 
        (ws.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ws.venue || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ws.trainerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ws.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ws.equipmentUsed || []).some(eq => eq.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ws.keyHighlights || []).some(hl => hl.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'upcoming') return ws.status === 'upcoming';
      if (statusFilter === 'concluded') return ws.status === 'concluded';
      if (statusFilter === 'active') return ws.isActive === true;
      if (statusFilter === 'locked') return ws.isActive === false;
      return true;
    });
  }, [workshops, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = workshops.length;
    const upcoming = workshops.filter(w => w.status === 'upcoming').length;
    const concluded = workshops.filter(w => w.status === 'concluded').length;
    const active = workshops.filter(w => w.isActive === true).length;
    const totalPhotos = workshops.reduce((acc, w) => acc + (w.photos?.length || 0), 0);
    const totalVideos = workshops.reduce((acc, w) => acc + (w.videos?.length || 0), 0);
    return { total, upcoming, concluded, active, totalPhotos, totalVideos };
  }, [workshops]);

  // Open Create Form
  const handleOpenCreateForm = () => {
    setEditingWorkshopId(null);
    setFormName('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormVenue('Dakshyam Central STEM & Robotics Lab, Balaghat');
    setFormTrainerName(userRole === 'trainer' ? currentTrainerName : 'Lead Workshop Faculty');
    setFormTrainerEmail(currentUserEmail);
    setFormStatus('upcoming');
    setFormIsActive(true);
    setFormTargetAudience('');
    setFormDescription('');
    setFormSchedule('');
    setFormPrerequisites('');
    setFormContactEmail(currentUserEmail);
    setFormContactPhone('');
    setFormThumbnailUrl('');
    setFormPhotos([]);
    setFormVideos([]);
    setFormHighlights([]);
    setFormEquipment([]);
    setFormTab('core');
    setIsFormModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEditForm = (workshop: WorkshopItem) => {
    setEditingWorkshopId(workshop.id);
    setFormName(workshop.name || '');
    setFormDate(workshop.date || '');
    setFormVenue(workshop.venue || '');
    setFormTrainerName(workshop.trainerName || '');
    setFormTrainerEmail(workshop.trainerEmail || currentUserEmail);
    setFormStatus(workshop.status || 'upcoming');
    setFormIsActive(workshop.isActive !== false);
    setFormTargetAudience(workshop.targetAudience || '');
    setFormDescription(workshop.description || '');
    setFormSchedule(workshop.schedule || '');
    setFormPrerequisites(workshop.prerequisites || '');
    setFormContactEmail(workshop.contactEmail || '');
    setFormContactPhone(workshop.contactPhone || '');
    setFormThumbnailUrl(workshop.thumbnailUrl || '');
    setFormPhotos(Array.isArray(workshop.photos) ? [...workshop.photos] : []);
    setFormVideos(Array.isArray(workshop.videos) ? [...workshop.videos] : []);
    setFormHighlights(Array.isArray(workshop.keyHighlights) ? [...workshop.keyHighlights] : []);
    setFormEquipment(Array.isArray(workshop.equipmentUsed) ? [...workshop.equipmentUsed] : []);
    setFormTab('core');
    setIsFormModalOpen(true);
  };

  // Clone / Duplicate Workshop
  const handleDuplicateWorkshop = (source: WorkshopItem) => {
    setEditingWorkshopId(null); // creating new
    setFormName(`${source.name} (New Cohort)`);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormVenue(source.venue || '');
    setFormTrainerName(source.trainerName || currentTrainerName);
    setFormTrainerEmail(source.trainerEmail || currentUserEmail);
    setFormStatus('upcoming');
    setFormIsActive(true);
    setFormTargetAudience(source.targetAudience || '');
    setFormDescription(source.description || '');
    setFormSchedule(source.schedule || '');
    setFormPrerequisites(source.prerequisites || '');
    setFormContactEmail(source.contactEmail || '');
    setFormContactPhone(source.contactPhone || '');
    setFormThumbnailUrl(source.thumbnailUrl || '');
    setFormPhotos(Array.isArray(source.photos) ? [...source.photos] : []);
    setFormVideos(Array.isArray(source.videos) ? [...source.videos] : []);
    setFormHighlights(Array.isArray(source.keyHighlights) ? [...source.keyHighlights] : []);
    setFormEquipment(Array.isArray(source.equipmentUsed) ? [...source.equipmentUsed] : []);
    setFormTab('core');
    setIsFormModalOpen(true);
    notifyInfo(`Duplicated configuration from "${source.name}". Modify fields and save as a new workshop.`);
  };

  // Save Form (Create or Update)
  const handleSaveWorkshopForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      notifyError('Workshop Name is required.');
      return;
    }
    if (!formDate.trim()) {
      notifyError('Scheduled Date is required.');
      return;
    }

    const resolvedThumbnail = formThumbnailUrl.trim() || (formPhotos.length > 0 ? formPhotos[0] : '');

    const workshopPayload = {
      name: formName.trim(),
      date: formDate.trim(),
      venue: formVenue.trim() || 'Dakshyam Central STEM & Robotics Lab, Balaghat',
      trainerName: formTrainerName.trim() || currentTrainerName,
      trainerEmail: formTrainerEmail.trim() || currentUserEmail,
      status: formStatus,
      isActive: formIsActive,
      targetAudience: formTargetAudience.trim() || 'STEM & Engineering Students',
      description: formDescription.trim(),
      schedule: formSchedule.trim(),
      prerequisites: formPrerequisites.trim(),
      contactEmail: formContactEmail.trim(),
      contactPhone: formContactPhone.trim(),
      thumbnailUrl: resolvedThumbnail,
      photos: formPhotos,
      videos: formVideos,
      keyHighlights: formHighlights,
      equipmentUsed: formEquipment
    };

    if (editingWorkshopId) {
      // UPDATE
      const success = await WorkshopFeedbackStorage.updateWorkshop(
        editingWorkshopId,
        workshopPayload,
        currentUserEmail,
        userRole
      );
      if (success) {
        notifySuccess(`Updated "${formName}" successfully!`);
        setIsFormModalOpen(false);
        setEditingWorkshopId(null);
        await reloadWorkshops();
        if (onRefresh) onRefresh();
      } else {
        notifyError('Failed to save workshop updates.');
      }
    } else {
      // CREATE
      const result = await WorkshopFeedbackStorage.createWorkshop(
        workshopPayload,
        currentUserEmail,
        userRole
      );
      if (result.success) {
        notifySuccess(`Created and published "${formName}"!`);
        setIsFormModalOpen(false);
        await reloadWorkshops();
        if (onRefresh) onRefresh();
      } else {
        notifyError(result.error || 'Failed to create workshop.');
      }
    }
  };

  // Delete Workshop
  const handleConfirmDelete = async () => {
    if (!deletingWorkshop) return;
    const targetName = deletingWorkshop.name;
    const success = await WorkshopFeedbackStorage.deleteWorkshop(
      deletingWorkshop.id,
      currentUserEmail,
      userRole
    );
    if (success) {
      notifySuccess(`Deleted workshop "${targetName}" from directory.`);
      setDeletingWorkshop(null);
      await reloadWorkshops();
      if (onRefresh) onRefresh();
    } else {
      notifyError('Failed to delete workshop.');
    }
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (ws: WorkshopItem) => {
    const newActive = !ws.isActive;
    const success = await WorkshopFeedbackStorage.updateWorkshop(
      ws.id,
      { isActive: newActive },
      currentUserEmail,
      userRole
    );
    if (success) {
      notifySuccess(`"${ws.name}" is now ${newActive ? 'Active (Open)' : 'Locked (Closed)'}.`);
      await reloadWorkshops();
      if (onRefresh) onRefresh();
    }
  };

  // Toggle Status (Upcoming / Concluded)
  const handleToggleStatus = async (ws: WorkshopItem) => {
    const newStatus: 'upcoming' | 'concluded' = ws.status === 'upcoming' ? 'concluded' : 'upcoming';
    const success = await WorkshopFeedbackStorage.updateWorkshop(
      ws.id,
      { status: newStatus },
      currentUserEmail,
      userRole
    );
    if (success) {
      notifySuccess(`"${ws.name}" marked as ${newStatus.toUpperCase()}.`);
      await reloadWorkshops();
      if (onRefresh) onRefresh();
    }
  };

  // Copy share URL
  const handleCopyLink = (ws: WorkshopItem) => {
    const shareUrl = getWorkshopShareUrl(ws, false);
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(ws.id);
    notifySuccess(`Copied live evaluation link for "${ws.name}"!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Photo Upload Handler (Cloudinary with server storage fallback)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const res = await uploadMediaToCloudinary(file, 'image', file.name);
      if (res && res.url) {
        setFormPhotos(prev => [res.url, ...prev]);
        if (!formThumbnailUrl) setFormThumbnailUrl(res.url);
        notifySuccess('Photo uploaded and added to gallery!');
      } else {
        notifyError('Upload failed. Please check network connection.');
      }
    } catch (err: any) {
      notifyError(`Upload error: ${err.message || 'Storage error'}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Add Photo URL manually
  const handleAddPhotoUrl = () => {
    if (!newPhotoUrl.trim()) return;
    setFormPhotos(prev => [newPhotoUrl.trim(), ...prev]);
    if (!formThumbnailUrl) setFormThumbnailUrl(newPhotoUrl.trim());
    setNewPhotoUrl('');
    notifySuccess('Photo URL added to gallery!');
  };

  // Remove Photo
  const handleRemovePhoto = (index: number) => {
    const removed = formPhotos[index];
    setFormPhotos(prev => prev.filter((_, idx) => idx !== index));
    if (formThumbnailUrl === removed) {
      setFormThumbnailUrl(formPhotos.find((_, idx) => idx !== index) || '');
    }
  };

  // Add Highlight tag
  const handleAddHighlight = () => {
    if (!newHighlight.trim()) return;
    if (!formHighlights.includes(newHighlight.trim())) {
      setFormHighlights(prev => [...prev, newHighlight.trim()]);
    }
    setNewHighlight('');
  };

  // Add Equipment tag
  const handleAddEquipment = () => {
    if (!newEquipment.trim()) return;
    if (!formEquipment.includes(newEquipment.trim())) {
      setFormEquipment(prev => [...prev, newEquipment.trim()]);
    }
    setNewEquipment('');
  };

  // Add Video
  const handleAddVideo = () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      notifyError('Video Title and URL are required.');
      return;
    }
    const newVid: WorkshopVideo = {
      id: `vid-${Date.now()}`,
      title: newVideoTitle.trim(),
      url: newVideoUrl.trim(),
      description: newVideoDesc.trim() || undefined
    };
    setFormVideos(prev => [...prev, newVid]);
    setNewVideoTitle('');
    setNewVideoUrl('');
    setNewVideoDesc('');
    notifySuccess('Video demonstration added!');
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      
      {/* 1. TOP HEADER & TELEMETRY BAR */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        isLight 
          ? 'bg-gradient-to-r from-amber-500/10 via-white to-amber-500/5 border-amber-300/60 shadow-sm' 
          : 'bg-gradient-to-r from-[#0d1f38] via-[#09152a] to-[#0d1f38] border-cyan-500/25'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isLight 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}>
                {userRole === 'admin' ? '🛡️ Admin Authority' : '⚡ Trainer Control'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                CRUD Directory Suite • Real-time Sync
              </span>
            </div>
            <h2 className={`text-base sm:text-lg font-black uppercase tracking-wide flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Building2 className={`w-5 h-5 ${isLight ? 'text-amber-600' : 'text-cyan-400'}`} />
              <span>Workshop Directory & Curriculum Console</span>
            </h2>
            <p className={`text-xs max-w-2xl leading-relaxed ${isLight ? 'text-slate-650' : 'text-slate-400'}`}>
              Create, edit every field, publish, archive, and manage all vocational workshops, bootcamps, and laboratory sessions with live digital evaluation links.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleOpenCreateForm}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 ${
                isLight
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.3)]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create New Workshop</span>
            </button>

            <button
              type="button"
              onClick={reloadWorkshops}
              disabled={isLoading}
              className={`p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' 
                  : 'bg-black/40 hover:bg-white/10 text-slate-300 border-white/15'
              }`}
              title="Refresh Workshops from Cloud"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {onOpenDirectoryModal && (
              <button
                type="button"
                onClick={onOpenDirectoryModal}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isLight 
                    ? 'bg-purple-50 hover:bg-purple-100 text-purple-950 border-purple-200' 
                    : 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border-purple-500/30'
                }`}
                title="Preview public directory as seen by students"
              >
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Preview Modal</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. STATS PILLS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-5 mt-4 border-t border-slate-500/15">
          <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-white/80 border-slate-200' : 'bg-black/30 border-white/10'}`}>
            <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">Total Catalog</span>
            <span className={`text-base font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.total}</span>
          </div>
          <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-white/80 border-slate-200' : 'bg-black/30 border-white/10'}`}>
            <span className="text-[9px] font-mono uppercase text-emerald-500 block font-bold">Upcoming</span>
            <span className="text-base font-black font-mono text-emerald-500">{stats.upcoming}</span>
          </div>
          <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-white/80 border-slate-200' : 'bg-black/30 border-white/10'}`}>
            <span className="text-[9px] font-mono uppercase text-sky-400 block font-bold">Concluded</span>
            <span className="text-base font-black font-mono text-sky-400">{stats.concluded}</span>
          </div>
          <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-white/80 border-slate-200' : 'bg-black/30 border-white/10'}`}>
            <span className="text-[9px] font-mono uppercase text-cyan-400 block font-bold">Forms Active</span>
            <span className="text-base font-black font-mono text-cyan-400">{stats.active}</span>
          </div>
          <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-white/80 border-slate-200' : 'bg-black/30 border-white/10'}`}>
            <span className="text-[9px] font-mono uppercase text-amber-500 block font-bold">Total Photos</span>
            <span className="text-base font-black font-mono text-amber-500">{stats.totalPhotos}</span>
          </div>
          <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-white/80 border-slate-200' : 'bg-black/30 border-white/10'}`}>
            <span className="text-[9px] font-mono uppercase text-purple-400 block font-bold">Total Videos</span>
            <span className="text-base font-black font-mono text-purple-400">{stats.totalVideos}</span>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, venue, lead trainer, equipment, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 focus:border-amber-500 focus:ring-amber-500/20'
                : 'bg-[#0a192f] border-blue-900/40 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-3xs uppercase">
          {(['all', 'upcoming', 'concluded', 'active', 'locked'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
                statusFilter === tab
                  ? (isLight ? 'bg-amber-600 text-white border-amber-600' : 'bg-cyan-500 text-slate-950 border-cyan-400 font-black')
                  : (isLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-black/30 border-white/10 text-slate-400 hover:text-white')
              }`}
            >
              {tab}
            </button>
          ))}

          {/* View Mode Toggle */}
          <button
            type="button"
            onClick={() => setViewMode(prev => prev === 'grid' ? 'table' : 'grid')}
            className={`px-3 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
              isLight ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-black/40 text-slate-300 border-white/15'
            }`}
            title="Toggle View Mode"
          >
            {viewMode === 'grid' ? '📋 Table View' : '🔲 Grid View'}
          </button>
        </div>
      </div>

      {/* 4. WORKSHOP DIRECTORY CONTENT */}
      {filteredWorkshops.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border space-y-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#071326] border-blue-900/30'
        }`}>
          <Building2 className="w-10 h-10 mx-auto text-slate-500 opacity-60" />
          <h4 className="text-sm font-mono font-bold uppercase text-slate-400">No Workshops Match Criteria</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search terms or status filters, or click "Create New Workshop" above to publish one.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="px-4 py-2 bg-cyan-500 text-slate-950 font-mono font-bold text-xs rounded-xl hover:bg-cyan-400 transition-all cursor-pointer"
          >
            + Create New Workshop
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredWorkshops.map(ws => {
            const isUpcoming = ws.status === 'upcoming';
            const photosCount = ws.photos?.length || 0;
            const videosCount = ws.videos?.length || 0;
            const thumbnail = ws.thumbnailUrl || (ws.photos && ws.photos[0]) || '';

            return (
              <motion.div
                key={ws.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  isLight 
                    ? 'bg-white border-slate-200 text-slate-800 hover:border-amber-300' 
                    : 'bg-[#07152b]/80 border-blue-900/30 text-white hover:border-cyan-500/40 shadow-lg'
                }`}
              >
                {/* Image Header with Badges */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={ws.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950/70 to-slate-900 flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <Building2 className="w-10 h-10 text-cyan-400/50" />
                      <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider line-clamp-1">{ws.name}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                  {/* Status Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md tracking-wider border ${
                      isUpcoming 
                        ? 'bg-emerald-500/90 text-slate-950 border-emerald-400 font-black' 
                        : 'bg-sky-500/90 text-slate-950 border-sky-400 font-black'
                    }`}>
                      {isUpcoming ? '● UPCOMING' : '✓ CONCLUDED'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(ws)}
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        ws.isActive 
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900' 
                          : 'bg-rose-950/80 border-rose-500/50 text-rose-300 hover:bg-rose-900'
                      }`}
                      title="Click to toggle form acceptance"
                    >
                      {ws.isActive ? 'Form: Active' : 'Form: Locked'}
                    </button>
                  </div>

                  {/* Media Counters */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    {photosCount > 0 && (
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-black/70 border border-white/20 text-white flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-cyan-400" />
                        <span>{photosCount}</span>
                      </span>
                    )}
                    {videosCount > 0 && (
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-black/70 border border-white/20 text-white flex items-center gap-1">
                        <Film className="w-3 h-3 text-purple-400" />
                        <span>{videosCount}</span>
                      </span>
                    )}
                  </div>

                  {/* Bottom Image Overlay: Title & Date */}
                  <div className="absolute bottom-2.5 left-3 right-3 text-left">
                    <span className="text-[10px] font-mono text-cyan-300 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{ws.date}</span>
                    </span>
                    <h3 className="text-xs font-black uppercase tracking-wide text-white truncate max-w-full">
                      {ws.name}
                    </h3>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-left">
                  <div className="space-y-2">
                    {/* Venue & Lead Trainer */}
                    <div className="space-y-1 text-2xs font-mono">
                      <div className="flex items-center gap-1.5 text-slate-400 truncate">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{ws.venue}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 truncate">
                        <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate">{ws.trainerName || 'Dakshyam Faculty'}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className={`text-3xs line-clamp-2 leading-relaxed ${isLight ? 'text-slate-650' : 'text-slate-400'}`}>
                      {ws.description || 'Hands-on engineering workshop.'}
                    </p>

                    {/* Highlights Tags */}
                    {ws.keyHighlights && ws.keyHighlights.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {ws.keyHighlights.slice(0, 2).map((hl, i) => (
                          <span
                            key={i}
                            className={`text-[8.5px] font-mono px-2 py-0.5 rounded border truncate max-w-[140px] ${
                              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                            }`}
                          >
                            {hl}
                          </span>
                        ))}
                        {ws.keyHighlights.length > 2 && (
                          <span className="text-[8.5px] font-mono text-slate-500 self-center">
                            +{ws.keyHighlights.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-slate-500/15 space-y-2">
                    <div className="flex items-center gap-1.5">
                      {/* EDIT ALL FIELDS */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(ws)}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-2xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isLight 
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300' 
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                        }`}
                        title="Edit all fields of this workshop"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit Fields</span>
                      </button>

                      {/* PREVIEW DETAILS */}
                      <button
                        type="button"
                        onClick={() => setPreviewWorkshop(ws)}
                        className={`p-1.5 rounded-lg border text-2xs font-mono transition-all cursor-pointer ${
                          isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                        }`}
                        title="View Full Workshop Page"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* COPY EVALUATION LINK */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(ws)}
                        className={`p-1.5 rounded-lg border text-2xs font-mono transition-all cursor-pointer ${
                          copiedId === ws.id
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                        }`}
                        title="Copy student evaluation link"
                      >
                        {copiedId === ws.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* CLONE / DUPLICATE */}
                      <button
                        type="button"
                        onClick={() => handleDuplicateWorkshop(ws)}
                        className={`p-1.5 rounded-lg border text-2xs font-mono transition-all cursor-pointer ${
                          isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                        }`}
                        title="Clone into a new cohort"
                      >
                        <CopyCheck className="w-3.5 h-3.5" />
                      </button>

                      {/* DELETE */}
                      <button
                        type="button"
                        onClick={() => setDeletingWorkshop(ws)}
                        className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all cursor-pointer"
                        title="Delete workshop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Toggle Status */}
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(ws)}
                        className="hover:underline cursor-pointer text-cyan-400"
                      >
                        Switch to {isUpcoming ? 'Concluded' : 'Upcoming'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(ws)}
                        className="hover:underline cursor-pointer"
                      >
                        {ws.isActive ? 'Lock Responses' : 'Open Responses'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className={`rounded-2xl border overflow-x-auto shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#071326] border-blue-900/30'
        }`}>
          <table className="w-full text-left text-xs font-mono">
            <thead className={`border-b text-[9px] uppercase tracking-wider ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-black/40 border-blue-900/40 text-slate-400'
            }`}>
              <tr>
                <th className="py-3 px-4">Workshop</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Venue & Trainer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Media</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-500/10">
              {filteredWorkshops.map(ws => (
                <tr key={ws.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}>
                  <td className="py-3 px-4">
                    <div className="font-bold uppercase text-xs truncate max-w-xs">{ws.name}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-xs">{ws.targetAudience}</div>
                  </td>
                  <td className="py-3 px-4 text-2xs text-cyan-400 whitespace-nowrap">{ws.date}</td>
                  <td className="py-3 px-4 text-2xs">
                    <div className="truncate max-w-[180px]">{ws.venue}</div>
                    <div className="text-slate-500 truncate max-w-[180px]">{ws.trainerName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border inline-block ${
                      ws.status === 'upcoming' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                    }`}>
                      {ws.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-2xs text-slate-400 whitespace-nowrap">
                    📷 {ws.photos?.length || 0} • 🎥 {ws.videos?.length || 0}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(ws)}
                        className="p-1.5 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(ws)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-all cursor-pointer"
                        title="Copy Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateWorkshop(ws)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-all cursor-pointer"
                        title="Duplicate"
                      >
                        <CopyCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingWorkshop(ws)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FULL CRUD WORKSHOP EDIT / CREATE FORM MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative z-10 w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden font-mono text-xs ${
                isLight ? 'bg-white border-amber-300 text-slate-800' : 'bg-[#091528] border-cyan-500/30 text-white'
              }`}
            >
              {/* Header */}
              <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
                isLight ? 'bg-amber-50/70 border-slate-200' : 'bg-black/40 border-cyan-500/20'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isLight ? 'bg-amber-200 text-amber-900' : 'bg-cyan-500/20 text-cyan-300'}`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">
                      {editingWorkshopId ? 'Updating Workshop Record' : 'Publishing New Workshop'}
                    </span>
                    <h3 className={`text-sm sm:text-base font-black uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {editingWorkshopId ? `Edit: ${formName || 'Workshop'}` : 'New Engineering Workshop'}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Navigation Tabs */}
              <div className={`flex border-b text-[10px] uppercase font-bold shrink-0 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'
              }`}>
                {(['core', 'curriculum', 'media', 'contact'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFormTab(tab)}
                    className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer ${
                      formTab === tab
                        ? (isLight ? 'border-amber-600 text-amber-800 font-black bg-white' : 'border-cyan-400 text-cyan-300 font-black bg-white/5')
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab === 'core' && '1. Basic Info'}
                    {tab === 'curriculum' && '2. Curriculum & Kits'}
                    {tab === 'media' && `3. Photos & Videos (${formPhotos.length + formVideos.length})`}
                    {tab === 'contact' && '4. Contact & Schedule'}
                  </button>
                ))}
              </div>

              {/* Form Body (Scrollable) */}
              <form onSubmit={handleSaveWorkshopForm} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 text-left">
                
                {/* TAB 1: CORE INFO */}
                {formTab === 'core' && (
                  <div className="space-y-4">
                    {/* Workshop Title */}
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                        Workshop Title / Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Industrial IoT & Autonomous Robotics Bootcamp"
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                          isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Scheduled Date */}
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                          Scheduled Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                          }`}
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                          Lifecycle Status
                        </label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                          }`}
                        >
                          <option value="upcoming">● Upcoming Bootcamp</option>
                          <option value="concluded">✓ Concluded Session</option>
                        </select>
                      </div>
                    </div>

                    {/* Venue */}
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                        Venue / Laboratory Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={formVenue}
                        onChange={(e) => setFormVenue(e.target.value)}
                        placeholder="e.g. Siddhivinayak Complex, First Floor, Balaghat Road, Waraseoni"
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                          isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                        }`}
                      />
                    </div>

                    {/* Lead Trainer Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                          Lead Trainer Name
                        </label>
                        <input
                          type="text"
                          value={formTrainerName}
                          onChange={(e) => setFormTrainerName(e.target.value)}
                          placeholder="e.g. Anand Gautam & Dakshyam Leads"
                          className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                          Trainer Email
                        </label>
                        <input
                          type="email"
                          value={formTrainerEmail}
                          onChange={(e) => setFormTrainerEmail(e.target.value)}
                          placeholder="trainer@dakshyam.com"
                          className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Target Audience */}
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                        Target Audience
                      </label>
                      <input
                        type="text"
                        value={formTargetAudience}
                        onChange={(e) => setFormTargetAudience(e.target.value)}
                        placeholder="e.g. Polytechnic, Engineering Undergrads & School STEM Students"
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                          isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                        }`}
                      />
                    </div>

                    {/* Active Form Submission Toggle */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                      isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/30 border-white/15'
                    }`}>
                      <div>
                        <span className="font-bold text-[11px] block">Public Feedback & Evaluation Acceptance</span>
                        <span className="text-[10px] text-slate-400">
                          {formIsActive ? 'Evaluation link is active & accepting responses' : 'Form submissions are locked'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormIsActive(!formIsActive)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          formIsActive ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {formIsActive ? '✓ Active & Open' : '✕ Locked'}
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: CURRICULUM & KITS */}
                {formTab === 'curriculum' && (
                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                        Detailed Workshop Overview & Syllabus Description
                      </label>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Comprehensive details on hands-on modules, lab exercises, and practical outcomes..."
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                          isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                        }`}
                      />
                    </div>

                    {/* Key Highlights (Objectives) */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-bold uppercase text-slate-400">
                        Curriculum Highlights / Learning Objectives ({formHighlights.length})
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add topic (e.g. FreeRTOS Dual-Core Programming)..."
                          value={newHighlight}
                          onChange={(e) => setNewHighlight(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddHighlight(); } }}
                          className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleAddHighlight}
                          className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {formHighlights.map((hl, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded-lg text-2xs flex items-center gap-1.5 border ${
                              isLight ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25'
                            }`}
                          >
                            <span>{hl}</span>
                            <button
                              type="button"
                              onClick={() => setFormHighlights(prev => prev.filter((_, i) => i !== idx))}
                              className="text-rose-400 hover:text-rose-200"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Equipment / Hardware Kits */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-bold uppercase text-slate-400">
                        Hardware Kits & Laboratory Equipment ({formEquipment.length})
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add hardware (e.g. ESP32 NodeMCU, Dual Motor Drivers)..."
                          value={newEquipment}
                          onChange={(e) => setNewEquipment(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEquipment(); } }}
                          className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleAddEquipment}
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {formEquipment.map((eq, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded-lg text-2xs flex items-center gap-1.5 border ${
                              isLight ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                            }`}
                          >
                            <span>{eq}</span>
                            <button
                              type="button"
                              onClick={() => setFormEquipment(prev => prev.filter((_, i) => i !== idx))}
                              className="text-rose-400 hover:text-rose-200"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: MEDIA (PHOTOS & VIDEOS) */}
                {formTab === 'media' && (
                  <div className="space-y-5">
                    {/* Primary Thumbnail */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold uppercase text-slate-400">
                        Primary Banner / Thumbnail Image URL
                      </label>
                      <input
                        type="url"
                        value={formThumbnailUrl}
                        onChange={(e) => setFormThumbnailUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                          isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                        }`}
                      />
                    </div>

                    {/* Photo Gallery Manager */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold uppercase text-slate-400">
                          Workshop Photo Gallery ({formPhotos.length} Photos)
                        </label>
                        <label className="px-3 py-1 bg-cyan-500 text-slate-950 font-bold rounded-lg cursor-pointer text-2xs hover:bg-cyan-400 transition-all flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Image File'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingPhoto}
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Manual Image URL Input */}
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Or paste remote image URL directly..."
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          className={`flex-1 px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleAddPhotoUrl}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl cursor-pointer"
                        >
                          + Add URL
                        </button>
                      </div>

                      {/* Photos Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                        {formPhotos.map((photo, idx) => (
                          <div
                            key={idx}
                            className={`relative rounded-xl overflow-hidden border aspect-video group ${
                              formThumbnailUrl === photo ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-white/15'
                            }`}
                          >
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(idx)}
                                className="self-end p-1 rounded bg-rose-600 text-white hover:bg-rose-500 cursor-pointer text-3xs"
                                title="Remove photo"
                              >
                                ✕
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormThumbnailUrl(photo)}
                                className="text-[8px] bg-amber-500 text-slate-950 font-bold py-1 px-1.5 rounded text-center cursor-pointer"
                              >
                                {formThumbnailUrl === photo ? '★ Primary' : 'Make Primary'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Demonstration Videos Manager */}
                    <div className="space-y-2 pt-2 border-t border-slate-500/15">
                      <label className="block text-[9px] font-bold uppercase text-slate-400">
                        Demonstration Videos ({formVideos.length} Videos)
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Video Title (e.g. Obstacle Rover Demo)..."
                          value={newVideoTitle}
                          onChange={(e) => setNewVideoTitle(e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                          }`}
                        />
                        <input
                          type="url"
                          placeholder="Video URL (Cloudinary, MP4, or web stream)..."
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                          }`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Optional short description..."
                          value={newVideoDesc}
                          onChange={(e) => setNewVideoDesc(e.target.value)}
                          className={`flex-1 px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleAddVideo}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl cursor-pointer"
                        >
                          + Add Video
                        </button>
                      </div>

                      {/* Video List */}
                      {formVideos.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {formVideos.map((vid, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded-xl border flex items-center justify-between text-2xs ${
                                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/10'
                              }`}
                            >
                              <div className="truncate max-w-md">
                                <span className="font-bold text-cyan-300">{vid.title}</span>
                                <span className="text-slate-500 ml-2 truncate">{vid.url}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormVideos(prev => prev.filter((_, i) => i !== idx))}
                                className="text-rose-400 hover:text-rose-200 px-2 py-0.5"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: CONTACT & SCHEDULE */}
                {formTab === 'contact' && (
                  <div className="space-y-4">
                    {/* Schedule */}
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                        Session Schedule & Timings
                      </label>
                      <input
                        type="text"
                        value={formSchedule}
                        onChange={(e) => setFormSchedule(e.target.value)}
                        placeholder="e.g. 09:30 AM - 04:30 PM (Daily Lab Sessions)"
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                          isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                        }`}
                      />
                    </div>

                    {/* Prerequisites */}
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                        Participant Prerequisites
                      </label>
                      <input
                        type="text"
                        value={formPrerequisites}
                        onChange={(e) => setFormPrerequisites(e.target.value)}
                        placeholder="e.g. Foundational logic, computer basics, or introductory C"
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                          isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                          Official Contact Email
                        </label>
                        <input
                          type="email"
                          value={formContactEmail}
                          onChange={(e) => setFormContactEmail(e.target.value)}
                          placeholder="contact@dakshyaminnovations.in"
                          className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                          Official Contact Phone
                        </label>
                        <input
                          type="tel"
                          value={formContactPhone}
                          onChange={(e) => setFormContactPhone(e.target.value)}
                          placeholder="+91 91799 42775"
                          className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#050e1c] border-white/15'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Footer Actions */}
                <div className={`p-4 rounded-xl border flex items-center justify-between pt-3 mt-4 ${
                  isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/40 border-white/10'
                }`}>
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-500/30 text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-xl font-black flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 ${
                      isLight ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingWorkshopId ? 'Save Workshop Changes' : 'Publish Workshop'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deletingWorkshop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingWorkshop(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative z-10 w-full max-w-md p-6 rounded-2xl border space-y-4 shadow-2xl font-mono text-left ${
                isLight ? 'bg-white border-rose-300 text-slate-900' : 'bg-[#0d1626] border-rose-500/40 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-rose-400 uppercase font-black block">Confirm Deletion</span>
                  <h3 className="text-sm font-black uppercase">Delete Workshop from Directory?</h3>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/10'
              }`}>
                <div className="font-bold text-white">{deletingWorkshop.name}</div>
                <div className="text-slate-400 text-3xs">Scheduled: {deletingWorkshop.date} at {deletingWorkshop.venue}</div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                This action will permanently delete this workshop from the directory, remove its public evaluation routing, and sync changes with the database.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingWorkshop(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-500/30 text-slate-400 hover:text-white cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer text-xs shadow-md"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 7. FULL DETAILS PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewWorkshop && (
        <WorkshopDetailsModal
          isOpen={!!previewWorkshop}
          onClose={() => setPreviewWorkshop(null)}
          workshop={previewWorkshop}
          theme={theme}
          onWorkshopUpdated={(updated) => {
            setWorkshops(prev => prev.map(w => w.id === updated.id ? updated : w));
            setPreviewWorkshop(updated);
          }}
          onCopyLink={() => handleCopyLink(previewWorkshop)}
          currentUserRole={userRole}
        />
      )}
    </div>
  );
}
