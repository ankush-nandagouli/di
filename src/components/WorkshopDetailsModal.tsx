import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Calendar, MapPin, User, CheckCircle2, 
  X, ExternalLink, QrCode, Copy, Check, Eye, 
  Camera, Video, Layers, Plus, Trash2, Edit3, 
  Save, Sparkles, AlertCircle, Share2, Download,
  Maximize2, ChevronLeft, ChevronRight, Clock, Wrench, ListChecks, Rocket
} from 'lucide-react';
import { WorkshopItem, WorkshopVideo } from '../types';
import { WorkshopFeedbackStorage, getWorkshopShareUrl } from '../utils/feedbackStorage';
import { notifySuccess, notifyInfo, notifyError } from '../utils/toast';

interface WorkshopDetailsModalProps {
  workshop: WorkshopItem | null;
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  currentUserRole?: 'admin' | 'trainer' | 'student' | string;
  onViewQr?: (workshop: WorkshopItem) => void;
  onWorkshopUpdated?: (updated: WorkshopItem) => void;
  onCopyLink?: (workshopId: string) => void;
}

export default function WorkshopDetailsModal({
  workshop,
  isOpen,
  onClose,
  theme = 'dark',
  currentUserRole,
  onViewQr,
  onWorkshopUpdated,
  onCopyLink
}: WorkshopDetailsModalProps) {
  const isLight = theme === 'light';
  const canEdit = currentUserRole === 'admin' || currentUserRole === 'trainer';

  // Active view states inside details modal
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'videos'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Cinema Lightbox state for workshop photos
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  // Editable fields state
  const [editStatus, setEditStatus] = useState<'upcoming' | 'concluded'>('upcoming');
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editTrainer, setEditTrainer] = useState('');
  const [editTrainerEmail, setEditTrainerEmail] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSchedule, setEditSchedule] = useState('');
  const [editAudience, setEditAudience] = useState('');
  const [editPrerequisites, setEditPrerequisites] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editThumbnail, setEditThumbnail] = useState('');
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [editVideos, setEditVideos] = useState<WorkshopVideo[]>([]);
  const [editHighlights, setEditHighlights] = useState<string[]>([]);
  const [editEquipment, setEditEquipment] = useState<string[]>([]);

  // Input helpers for adding media
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newHighlightInput, setNewHighlightInput] = useState('');
  const [newEquipmentInput, setNewEquipmentInput] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [showAddVideoForm, setShowAddVideoForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize state when workshop prop changes or opens
  useEffect(() => {
    if (!workshop) return;
    setEditStatus(workshop.status || (workshop.isActive ? 'upcoming' : 'concluded'));
    setEditName(workshop.name || '');
    setEditDate(workshop.date || '');
    setEditVenue(workshop.venue || '');
    setEditTrainer(workshop.trainerName || '');
    setEditTrainerEmail(workshop.trainerEmail || '');
    setEditContactEmail(workshop.contactEmail || '');
    setEditContactPhone(workshop.contactPhone || '');
    setEditDescription(workshop.description || '');
    setEditSchedule(workshop.schedule || '');
    setEditAudience(workshop.targetAudience || '');
    setEditPrerequisites(workshop.prerequisites || '');
    setEditIsActive(workshop.isActive !== false);
    setEditPhotos(workshop.photos || []);
    setEditVideos(workshop.videos || []);
    setEditHighlights(workshop.keyHighlights || []);
    setEditEquipment(workshop.equipmentUsed || []);
    setEditThumbnail(workshop.thumbnailUrl || (workshop.photos && workshop.photos.length > 0 ? workshop.photos[0] : ''));
    setIsEditing(false);
    setActivePhotoIndex(null);
    setActiveTab('overview');
  }, [workshop, isOpen]);

  // Keyboard navigation for open lightbox
  useEffect(() => {
    if (activePhotoIndex === null || !workshop) return;
    const photosList = isEditing ? editPhotos : (workshop.photos || []);
    if (photosList.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePhotoIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIndex(prev => (prev === null ? 0 : (prev + 1) % photosList.length));
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIndex(prev => (prev === null ? 0 : (prev - 1 + photosList.length) % photosList.length));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, workshop, isEditing, editPhotos]);

  if (!isOpen || !workshop) return null;

  // Active photos and videos based on whether we are in preview or edit mode
  const currentPhotos = isEditing ? editPhotos : (workshop.photos || []);
  const currentVideos = isEditing ? editVideos : (workshop.videos || []);
  const currentHighlights = isEditing ? editHighlights : (workshop.keyHighlights || []);
  const currentEquipment = isEditing ? editEquipment : (workshop.equipmentUsed || []);
  const activeThumbnail = (isEditing ? editThumbnail : workshop.thumbnailUrl) || (currentPhotos.length > 0 ? currentPhotos[0] : '');

  // Handle uploading photos from file input (Base64 data URL)
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setEditPhotos(prev => {
            const next = [...prev, result];
            if (!editThumbnail) setEditThumbnail(result);
            return next;
          });
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
    notifySuccess('Photo attached! Remember to click Save Changes to persist.');
  };

  // Add photo via direct image URL
  const handleAddPhotoUrl = () => {
    if (!newPhotoUrl.trim()) return;
    setEditPhotos(prev => {
      const next = [...prev, newPhotoUrl.trim()];
      if (!editThumbnail) setEditThumbnail(newPhotoUrl.trim());
      return next;
    });
    setNewPhotoUrl('');
    notifySuccess('Photo URL added.');
  };

  // Remove photo
  const handleRemovePhoto = (idx: number) => {
    setEditPhotos(prev => {
      const target = prev[idx];
      const next = prev.filter((_, i) => i !== idx);
      if (editThumbnail === target) {
        setEditThumbnail(next.length > 0 ? next[0] : '');
      }
      return next;
    });
  };

  // Add new video
  const handleAddVideo = () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      notifyError('Please enter both Video Title and URL.');
      return;
    }
    const newVid: WorkshopVideo = {
      id: `vid-${Date.now()}`,
      title: newVideoTitle.trim(),
      url: newVideoUrl.trim(),
      description: newVideoDesc.trim()
    };
    setEditVideos(prev => [...prev, newVid]);
    setNewVideoTitle('');
    setNewVideoUrl('');
    setNewVideoDesc('');
    setShowAddVideoForm(false);
    notifySuccess('Video demonstration added!');
  };

  // Remove video
  const handleRemoveVideo = (vidId: string) => {
    setEditVideos(prev => prev.filter(v => v.id !== vidId));
  };

  // Add highlight tag
  const handleAddHighlight = () => {
    if (!newHighlightInput.trim()) return;
    setEditHighlights(prev => [...prev, newHighlightInput.trim()]);
    setNewHighlightInput('');
  };

  // Remove highlight tag
  const handleRemoveHighlight = (idx: number) => {
    setEditHighlights(prev => prev.filter((_, i) => i !== idx));
  };

  // Add equipment tag
  const handleAddEquipment = () => {
    if (!newEquipmentInput.trim()) return;
    setEditEquipment(prev => [...prev, newEquipmentInput.trim()]);
    setNewEquipmentInput('');
  };

  // Remove equipment tag
  const handleRemoveEquipment = (idx: number) => {
    setEditEquipment(prev => prev.filter((_, i) => i !== idx));
  };

  // Save all workshop updates
  const handleSaveChanges = async () => {
    if (!editName.trim()) {
      notifyError('Workshop title is required.');
      return;
    }
    if (!editDate.trim()) {
      notifyError('Workshop date is required.');
      return;
    }

    setIsSaving(true);
    const updates: Partial<WorkshopItem> = {
      name: editName.trim(),
      date: editDate.trim(),
      venue: editVenue.trim(),
      trainerName: editTrainer.trim(),
      trainerEmail: editTrainerEmail.trim(),
      contactEmail: editContactEmail.trim(),
      contactPhone: editContactPhone.trim(),
      description: editDescription.trim(),
      schedule: editSchedule.trim(),
      targetAudience: editAudience.trim(),
      prerequisites: editPrerequisites.trim(),
      isActive: editIsActive,
      status: editStatus,
      thumbnailUrl: editThumbnail || (editPhotos.length > 0 ? editPhotos[0] : undefined),
      photos: editPhotos,
      videos: editVideos,
      keyHighlights: editHighlights,
      equipmentUsed: editEquipment
    };

    const success = await WorkshopFeedbackStorage.updateWorkshop(
      workshop.id,
      updates,
      currentUserRole === 'trainer' ? 'trainer@dakshyam.com' : 'admin@dakshyam.com',
      currentUserRole || 'admin'
    );

    setIsSaving(false);
    if (success) {
      notifySuccess('Workshop details and media updated successfully!');
      setIsEditing(false);
      const updatedWorkshop: WorkshopItem = {
        ...workshop,
        ...updates
      };
      if (onWorkshopUpdated) {
        onWorkshopUpdated(updatedWorkshop);
      }
    } else {
      notifyError('Failed to save workshop updates.');
    }
  };

  // Copy share URL
  const handleCopyLink = () => {
    const url = getWorkshopShareUrl(workshop, true);
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      notifySuccess('Workshop evaluation link copied to clipboard!');
      if (onCopyLink) onCopyLink(workshop.id);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[99990] flex items-center justify-center p-3 sm:p-5 overflow-hidden overscroll-none"
        role="dialog"
        aria-modal="true"
        style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
      >
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ scale: 0.96, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 15 }}
          className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 z-10 ${
            isLight 
              ? 'bg-white border-blue-900/20 text-slate-900 shadow-[0_25px_60px_rgba(15,23,42,0.2)]' 
              : 'bg-[#0a192f] border-blue-500/30 text-white shadow-[0_0_50px_rgba(59,130,246,0.2)]'
          }`}
        >
          {/* Top Hero Banner with Thumbnail of the uploaded workshop images */}
          <div className="relative w-full h-52 sm:h-64 overflow-hidden bg-slate-950 shrink-0 flex items-center justify-center">
            {activeThumbnail ? (
              <img 
                src={activeThumbnail} 
                alt={workshop.name}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950/70 to-slate-900 flex flex-col items-center justify-center gap-2 p-6 text-center">
                <Building2 className="w-12 h-12 text-cyan-400/50" />
                <span className="text-sm font-mono text-slate-300 font-bold uppercase tracking-wider">{workshop.name}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30 pointer-events-none" />

            {/* Top Bar Floating Pills */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono font-black px-3 py-1 rounded-full uppercase tracking-wider border shadow-md backdrop-blur-md ${
                  workshop.isActive
                    ? 'bg-emerald-500/90 text-slate-950 border-emerald-300'
                    : 'bg-slate-800/90 text-slate-300 border-slate-600'
                }`}>
                  {workshop.isActive ? '● Live Active Workshop' : '○ Concluded Workshop'}
                </span>

                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-black/75 text-cyan-300 border border-cyan-400/30 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{currentPhotos.length} {currentPhotos.length === 1 ? 'Photo' : 'Photos'}</span>
                </span>

                {currentVideos.length > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-black/75 text-purple-300 border border-purple-400/30 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                    <Video className="w-3.5 h-3.5 text-purple-400" />
                    <span>{currentVideos.length} {currentVideos.length === 1 ? 'Video' : 'Videos'}</span>
                  </span>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer backdrop-blur-md"
                title="Close Details Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Title & Meta in Banner */}
            <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1 text-left text-white pointer-events-none">
              <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
                Official Dakshyam Workshop Node • ID: {workshop.id}
              </span>
              <h2 className="text-base sm:text-xl font-black uppercase font-mono tracking-wide leading-tight line-clamp-2">
                {workshop.name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs font-mono text-slate-300 pt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{workshop.date}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span className="truncate max-w-[280px]">{workshop.venue}</span>
                </span>
                {workshop.trainerName && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>{workshop.trainerName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Bar / Tabs */}
          <div className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-blue-900/30'
          }`}>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? (isLight ? 'bg-blue-950 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs')
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Overview & Curriculum</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'photos'
                    ? (isLight ? 'bg-blue-950 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs')
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Photos ({currentPhotos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('videos')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'videos'
                    ? (isLight ? 'bg-blue-950 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs')
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Videos ({currentVideos.length})</span>
              </button>
            </div>

            {/* Admin / Trainer Edit Control */}
            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                    isEditing
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                      : isLight 
                        ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100' 
                        : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/40'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Exit Edit Mode' : 'Edit Details & Media'}</span>
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Modal Body (Scrollable Container) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6 text-left">
            {/* EDIT MODE FORM (when admin/trainer toggles edit) */}
            {isEditing && (
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 font-mono text-xs ${
                isLight ? 'bg-amber-50/60 border-amber-300 text-slate-900' : 'bg-black/50 border-amber-500/30 text-white'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold uppercase tracking-wider text-amber-400">
                      Workshop Details & Media Editor ({currentUserRole?.toUpperCase()})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">All fields editable • Cloud synchronized</span>
                </div>

                {/* 2 EXPLICIT OPTIONS: UPCOMING VS CONCLUDED WORKSHOP */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Workshop Status Category <span className="text-rose-400">*</span>
                  </label>
                  <div className={`grid grid-cols-2 p-1.5 rounded-xl border ${
                    isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/60 border-slate-700'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setEditStatus('upcoming')}
                      className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs ${
                        editStatus === 'upcoming'
                          ? (isLight ? 'bg-emerald-600 text-white shadow-xs font-black' : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.3)]')
                          : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
                      }`}
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>🚀 Upcoming Workshop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatus('concluded')}
                      className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs ${
                        editStatus === 'concluded'
                          ? (isLight ? 'bg-purple-800 text-white shadow-xs font-black' : 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-black shadow-[0_0_12px_rgba(168,85,247,0.3)]')
                          : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>🏁 Concluded Workshop</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    {editStatus === 'upcoming' 
                      ? 'Upcoming sessions are featured in active student schedules, registrations, and inquiries.'
                      : 'Concluded sessions document past event milestones, multi-photo and video galleries, and archived review metrics.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">
                      Workshop Title <span className="text-rose-400">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Industrial IoT & Autonomous Robotics Bootcamp"
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">
                      {editStatus === 'upcoming' ? 'Scheduled Date' : 'Conducted Date'} <span className="text-rose-400">*</span>
                    </label>
                    <input 
                      type="date" 
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Venue & Laboratory</label>
                    <input 
                      type="text" 
                      value={editVenue}
                      onChange={(e) => setEditVenue(e.target.value)}
                      placeholder="e.g. Dakshyam Central STEM & Robotics Lab, Balaghat"
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Lead Trainer / Instructor</label>
                    <input 
                      type="text" 
                      value={editTrainer}
                      onChange={(e) => setEditTrainer(e.target.value)}
                      placeholder="e.g. Anand Gautam & Dakshyam Tech Leads"
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Trainer Email (Optional)</label>
                    <input 
                      type="email" 
                      value={editTrainerEmail}
                      onChange={(e) => setEditTrainerEmail(e.target.value)}
                      placeholder="trainer@dakshyam.com"
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Coordinator Contact Phone</label>
                    <input 
                      type="text" 
                      value={editContactPhone}
                      onChange={(e) => setEditContactPhone(e.target.value)}
                      placeholder="e.g. +91 7632 234567"
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Coordinator Contact Email</label>
                    <input 
                      type="email" 
                      value={editContactEmail}
                      onChange={(e) => setEditContactEmail(e.target.value)}
                      placeholder="support@dakshyam.com"
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Daily Schedule / Hours</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 09:30 AM - 04:30 PM (3-Day Workshop)"
                      value={editSchedule}
                      onChange={(e) => setEditSchedule(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Target Candidates</label>
                    <input 
                      type="text" 
                      placeholder="e.g. B.Tech / Diploma / School STEM Teachers"
                      value={editAudience}
                      onChange={(e) => setEditAudience(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Prerequisites</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Basic physics/math, personal laptop recommended"
                      value={editPrerequisites}
                      onChange={(e) => setEditPrerequisites(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Description & Lab Syllabus</label>
                  <textarea 
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Provide overview of hands-on modules, lab experiments, and participant takeaways..."
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none resize-none ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                </div>

                {/* Cover Thumbnail Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Cover Thumbnail Image URL</label>
                  <input 
                    type="text" 
                    placeholder="https://... (or choose from uploaded photos below)"
                    value={editThumbnail}
                    onChange={(e) => setEditThumbnail(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                </div>

                {/* Evaluation Acceptance / Form Active Toggle */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/30 border-slate-800'
                }`}>
                  <div>
                    <span className="font-bold text-[11px] block">Public Feedback Form Status</span>
                    <span className="text-[10px] text-slate-400">
                      {editIsActive 
                        ? 'Evaluation link is active & accepting participant responses' 
                        : 'Form submissions paused / locked'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditIsActive(!editIsActive)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      editIsActive 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {editIsActive ? '✓ Active & Open' : '✕ Locked'}
                  </button>
                </div>

                {/* Inline Curriculum Highlights Manager */}
                <div className={`p-3 rounded-xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-purple-900/30'
                }`}>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">
                    Curriculum Highlights ({editHighlights.length})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. FreeRTOS Dual Core Programming"
                      value={newHighlightInput}
                      onChange={(e) => setNewHighlightInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddHighlight();
                        }
                      }}
                      className={`flex-1 px-3 py-1.5 text-xs rounded-xl border focus:outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleAddHighlight}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                    >
                      + Add
                    </button>
                  </div>
                  {editHighlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {editHighlights.map((hl, hlIdx) => (
                        <span key={hlIdx} className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-3xs flex items-center gap-1 font-bold">
                          <span>{hl}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHighlight(hlIdx)}
                            className="text-rose-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inline Equipment Deployed Manager */}
                <div className={`p-3 rounded-xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-cyan-900/30'
                }`}>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">
                    Hardware & Equipment Deployed ({editEquipment.length})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. ESP32 NodeMCU, L298N H-Bridge"
                      value={newEquipmentInput}
                      onChange={(e) => setNewEquipmentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEquipment();
                        }
                      }}
                      className={`flex-1 px-3 py-1.5 text-xs rounded-xl border focus:outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleAddEquipment}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold"
                    >
                      + Add
                    </button>
                  </div>
                  {editEquipment.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {editEquipment.map((eq, eqIdx) => (
                        <span key={eqIdx} className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-3xs flex items-center gap-1 font-bold">
                          <span>{eq}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEquipment(eqIdx)}
                            className="text-rose-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 1: OVERVIEW & CURRICULUM */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Description Narrative */}
                <div className={`p-5 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-blue-900/20'
                }`}>
                  <h3 className="text-xs font-mono font-black uppercase text-cyan-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>Workshop Overview & Mission</span>
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed font-sans ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {workshop.description || 'Hands-on practical workshop conducted by Dakshyam Innovations technical engineering leads.'}
                  </p>

                  {workshop.schedule && (
                    <div className="pt-2 border-t border-slate-500/15 flex items-center gap-2 text-2xs font-mono text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Schedule: {workshop.schedule}</span>
                    </div>
                  )}
                </div>

                {/* Key Highlights / Curriculum Objectives */}
                <div className={`p-5 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-blue-900/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-black uppercase text-cyan-400 flex items-center gap-1.5">
                      <ListChecks className="w-4 h-4" />
                      <span>Key Highlights & Learning Objectives</span>
                    </h3>
                  </div>

                  {currentHighlights.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentHighlights.map((hl, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-2xs font-mono ${
                            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0d1f38] border-cyan-500/20 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <span>{hl}</span>
                          </div>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleRemoveHighlight(idx)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                              title="Delete highlight"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-2xs text-slate-500 font-mono">No specific objectives highlighted yet.</p>
                  )}

                  {isEditing && (
                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="text" 
                        placeholder="Add new learning objective..." 
                        value={newHighlightInput}
                        onChange={(e) => setNewHighlightInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddHighlight(); } }}
                        className={`flex-1 px-3 py-1.5 text-2xs font-mono rounded-xl border focus:outline-none ${
                          isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleAddHighlight}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white font-mono text-2xs font-bold cursor-pointer"
                      >
                        + Add Objective
                      </button>
                    </div>
                  )}
                </div>

                {/* Hardware Kits & Equipment Deployed */}
                <div className={`p-5 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-blue-900/20'
                }`}>
                  <h3 className="text-xs font-mono font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" />
                    <span>Laboratory Hardware Kits & Equipment Deployed</span>
                  </h3>

                  {currentEquipment.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {currentEquipment.map((eq, idx) => (
                        <span 
                          key={idx}
                          className={`px-3 py-1.5 rounded-xl border text-2xs font-mono font-bold flex items-center gap-1.5 ${
                            isLight ? 'bg-amber-50 text-amber-950 border-amber-200' : 'bg-amber-950/30 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          <span>{eq}</span>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleRemoveEquipment(idx)}
                              className="text-rose-400 hover:text-rose-300 ml-1"
                              title="Delete equipment tag"
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-2xs text-slate-500 font-mono">Hardware kit specifications not yet assigned.</p>
                  )}

                  {isEditing && (
                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="text" 
                        placeholder="Add hardware item (e.g. ESP32 NodeMCU, Multimeters)..." 
                        value={newEquipmentInput}
                        onChange={(e) => setNewEquipmentInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEquipment(); } }}
                        className={`flex-1 px-3 py-1.5 text-2xs font-mono rounded-xl border focus:outline-none ${
                          isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleAddEquipment}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-mono text-2xs font-bold cursor-pointer"
                      >
                        + Add Hardware
                      </button>
                    </div>
                  )}
                </div>

                {/* Target Audience & Prerequisites */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border space-y-1 font-mono text-2xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/25 border-slate-800'
                  }`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Audience</span>
                    <p className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {workshop.targetAudience || 'School, College & Vocational STEM Candidates'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border space-y-1 font-mono text-2xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/25 border-slate-800'
                  }`}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Prerequisites</span>
                    <p className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {workshop.prerequisites || 'Basic interest in science, technology & logic. No prior coding required.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PHOTOS GALLERY & UPLOADER */}
            {activeTab === 'photos' && (
              <div className="space-y-6">
                {/* Upload Action for Admin & Trainer */}
                {canEdit && (
                  <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 font-mono text-xs ${
                    isLight ? 'bg-blue-50/60 border-blue-200 text-slate-900' : 'bg-black/40 border-blue-900/40 text-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold uppercase tracking-wider text-cyan-400">
                          Add Multiple Workshop Photos
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Attach laboratory action photos</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {/* File Upload input */}
                      <div>
                        <label className="text-[10px] text-slate-400 block font-bold mb-1">
                          Upload Image Files (Computer / Mobile)
                        </label>
                        <input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={handlePhotoFileUpload}
                          className={`w-full px-3 py-2 text-2xs rounded-xl border focus:outline-none file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-4xs file:font-semibold ${
                            isLight 
                              ? 'bg-white border-slate-300 text-slate-800 file:bg-blue-100 file:text-blue-900' 
                              : 'bg-slate-900 border-slate-700 text-white file:bg-cyan-950 file:text-cyan-400'
                          }`}
                        />
                      </div>

                      {/* Direct URL input */}
                      <div>
                        <label className="text-[10px] text-slate-400 block font-bold mb-1">
                          Or Add Direct Image URL
                        </label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="https://images.unsplash.com/... or cloud link" 
                            value={newPhotoUrl}
                            onChange={(e) => setNewPhotoUrl(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPhotoUrl(); } }}
                            className={`flex-1 px-3 py-2 text-2xs rounded-xl border focus:outline-none ${
                              isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={handleAddPhotoUrl}
                            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-2xs font-bold cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Photos Grid */}
                {currentPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                    {currentPhotos.map((photo, idx) => {
                      const isCover = editThumbnail === photo || (!editThumbnail && idx === 0);

                      return (
                        <div 
                          key={idx}
                          className={`group relative aspect-video rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer ${
                            isCover 
                              ? 'ring-2 ring-cyan-400 shadow-md' 
                              : isLight ? 'border-slate-200 hover:border-blue-900/40' : 'border-blue-900/30 hover:border-cyan-400/50'
                          }`}
                          onClick={() => setActivePhotoIndex(idx)}
                        >
                          <img 
                            src={photo} 
                            alt={`Workshop Photo ${idx + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />

                          {/* Hover Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5 text-white">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs">
                                Photo #{idx + 1}
                              </span>

                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemovePhoto(idx);
                                  }}
                                  className="p-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow"
                                  title="Remove this photo"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-mono font-bold flex items-center gap-1 text-cyan-300">
                                <Maximize2 className="w-2.5 h-2.5" />
                                <span>Click to Enlarge</span>
                              </span>

                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditThumbnail(photo);
                                    notifySuccess('Selected as workshop cover thumbnail!');
                                  }}
                                  className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold ${
                                    isCover ? 'bg-cyan-400 text-slate-950 font-black' : 'bg-black/70 hover:bg-black text-white'
                                  }`}
                                  title="Set as main thumbnail"
                                >
                                  {isCover ? '★ Cover' : 'Set Cover'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Cover badge if selected */}
                          {isCover && (
                            <div className="absolute top-2 left-2 bg-cyan-400 text-slate-950 font-mono font-black text-[7.5px] uppercase px-1.5 py-0.5 rounded shadow">
                              Cover Thumbnail
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`p-10 text-center rounded-2xl border space-y-2 font-mono ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-black/30 border-blue-900/20 text-slate-400'
                  }`}>
                    <Camera className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                    <h4 className="text-xs font-bold uppercase">No photos uploaded yet</h4>
                    <p className="text-2xs max-w-sm mx-auto">
                      {canEdit 
                        ? 'Use the upload box above to attach workshop laboratory and group photos.' 
                        : 'Photos for this workshop session will appear here once published by the lead instructor.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: VIDEOS SHOWCASE & UPLOADER */}
            {activeTab === 'videos' && (
              <div className="space-y-6">
                {/* Add Video button for Admin/Trainer */}
                {canEdit && (
                  <div className="space-y-3">
                    {!showAddVideoForm ? (
                      <button
                        type="button"
                        onClick={() => setShowAddVideoForm(true)}
                        className={`w-full py-3 rounded-2xl border border-dashed font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isLight 
                            ? 'bg-purple-50/50 border-purple-300 text-purple-900 hover:bg-purple-100' 
                            : 'bg-purple-950/20 border-purple-500/40 text-purple-300 hover:bg-purple-900/30'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Workshop Video Demonstration</span>
                      </button>
                    ) : (
                      <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 font-mono text-xs ${
                        isLight ? 'bg-purple-50/70 border-purple-300 text-slate-900' : 'bg-black/50 border-purple-500/40 text-white'
                      }`}>
                        <div className="flex items-center justify-between pb-1">
                          <span className="font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                            <Video className="w-4 h-4" />
                            <span>Add New Video Demonstration</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowAddVideoForm(false)}
                            className="text-slate-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Video Demonstration Title (e.g. Robot Obstacle Telemetry Test)"
                            value={newVideoTitle}
                            onChange={(e) => setNewVideoTitle(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl border text-2xs focus:outline-none ${
                              isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                            }`}
                          />
                          <input 
                            type="text" 
                            placeholder="Video Link (YouTube, Vimeo, Cloudinary, MP4 URL)"
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl border text-2xs focus:outline-none ${
                              isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                            }`}
                          />
                          <textarea 
                            rows={2}
                            placeholder="Short summary of what happens in this demonstration..."
                            value={newVideoDesc}
                            onChange={(e) => setNewVideoDesc(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl border text-2xs focus:outline-none resize-none ${
                              isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                            }`}
                          />
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowAddVideoForm(false)}
                              className="px-3 py-1.5 rounded-xl border border-slate-500/30 text-2xs font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleAddVideo}
                              className="px-4 py-1.5 rounded-xl bg-purple-600 text-white text-2xs font-bold cursor-pointer"
                            >
                              Add Video
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Video Cards List */}
                {currentVideos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentVideos.map((video) => {
                      const isYouTube = video.url.includes('youtube.com') || video.url.includes('youtu.be');
                      let embedUrl = video.url;
                      if (isYouTube) {
                        const ytId = video.url.includes('v=') 
                          ? video.url.split('v=')[1]?.split('&')[0]
                          : video.url.split('/').pop()?.split('?')[0];
                        if (ytId) embedUrl = `https://www.youtube.com/embed/${ytId}`;
                      }

                      return (
                        <div 
                          key={video.id}
                          className={`rounded-2xl border overflow-hidden flex flex-col justify-between ${
                            isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-purple-900/30'
                          }`}
                        >
                          <div className="aspect-video w-full bg-slate-950 overflow-hidden relative">
                            {isYouTube ? (
                              <iframe 
                                src={embedUrl}
                                title={video.title}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <video 
                                src={video.url}
                                controls
                                preload="metadata"
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>

                          <div className="p-4 space-y-2 text-left">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-xs font-mono font-bold uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {video.title}
                              </h4>
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVideo(video.id)}
                                  className="text-rose-400 hover:text-rose-300 p-1"
                                  title="Delete video"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {video.description && (
                              <p className={`text-2xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                {video.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`p-10 text-center rounded-2xl border space-y-2 font-mono ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-black/30 border-purple-900/20 text-slate-400'
                  }`}>
                    <Video className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                    <h4 className="text-xs font-bold uppercase">No demonstration videos linked yet</h4>
                    <p className="text-2xs max-w-sm mx-auto">
                      {canEdit 
                        ? 'Click the button above to link hardware test or robotic demonstration videos.' 
                        : 'Demonstration videos for this workshop will be published soon.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer Action Strip (Feedback Button & Share Options) */}
          <div className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/60 border-blue-900/40'
          }`}>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Copy share URL */}
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  linkCopied
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : isLight ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Copy share link for students and participants"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{linkCopied ? 'Link Copied!' : 'Copy Evaluation Link'}</span>
              </button>

              {/* View QR Code */}
              {onViewQr && (
                <button
                  type="button"
                  onClick={() => onViewQr(workshop)}
                  className={`px-3 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isLight ? 'bg-sky-50 text-sky-950 border-sky-300 hover:bg-sky-100' : 'bg-sky-950/40 text-sky-300 border-sky-500/30 hover:bg-sky-900/40'
                  }`}
                  title="Generate QR code for projector or presentation"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">QR Code</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* FULLSCREEN CINEMA LIGHTBOX FOR WORKSHOP PHOTOS (FIT TO VIEWPORT, ZERO SCROLL) */}
      {activePhotoIndex !== null && currentPhotos[activePhotoIndex] && (
        <div 
          className="fixed inset-0 z-[99999] w-screen h-screen bg-black/95 flex flex-col justify-between p-3 sm:p-5 backdrop-blur-xl overflow-hidden overscroll-none"
          style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
        >
          {/* Top Bar */}
          <div className="shrink-0 flex items-center justify-between text-white text-xs font-mono pb-2.5 border-b border-white/10 z-10">
            <div className="flex items-center gap-2 min-w-0 text-left">
              <span className="font-bold uppercase tracking-wider text-cyan-400 truncate max-w-xs">{workshop.name}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 shrink-0">Photo {activePhotoIndex + 1} of {currentPhotos.length}</span>
            </div>
            <button
              type="button"
              onClick={() => setActivePhotoIndex(null)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline text-2xs">ESC</span>
            </button>
          </div>

          {/* Center Stage Image */}
          <div 
            className="relative flex-1 min-h-0 w-full flex items-center justify-center p-1 sm:p-2 overflow-hidden my-auto cursor-pointer"
            onClick={() => setActivePhotoIndex(null)}
          >
            <div 
              className="relative max-h-full max-w-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={currentPhotos[activePhotoIndex]} 
                alt={`Photo ${activePhotoIndex + 1}`}
                className="max-h-[76vh] sm:max-h-[80vh] md:max-h-[82vh] max-w-[94vw] w-auto h-auto object-contain mx-auto select-none rounded-xl sm:rounded-2xl shadow-2xl border border-white/10"
              />

              {/* Previous Photo Arrow */}
              {currentPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex(prev => (prev === null ? 0 : (prev - 1 + currentPhotos.length) % currentPhotos.length));
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/80 hover:bg-cyan-500 text-white hover:text-slate-950 border border-white/30 backdrop-blur-md hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-2xl z-20"
                  title="Previous Photo"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Next Photo Arrow */}
              {currentPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex(prev => (prev === null ? 0 : (prev + 1) % currentPhotos.length));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/80 hover:bg-cyan-500 text-white hover:text-slate-950 border border-white/30 backdrop-blur-md hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-2xl z-20"
                  title="Next Photo"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom Filmstrip */}
          {currentPhotos.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 custom-scrollbar">
              {currentPhotos.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activePhotoIndex === idx 
                      ? 'border-cyan-400 scale-105 shadow-[0_0_12px_rgba(34,211,238,0.5)]' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
