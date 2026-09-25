import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, CheckCheck, Trash2, Volume2, VolumeX, Shield, 
  Award, ClipboardList, BookOpen, Sparkles, AlertCircle, 
  ExternalLink, ChevronRight, Filter
} from 'lucide-react';
import { AppNotification, UserType } from '../types';
import { NotificationService } from '../utils/notificationService';

interface NotificationBellProps {
  currentUser: UserType | null;
  theme?: 'light' | 'dark';
  onNavigateTab: (tab: any) => void;
}

export default function NotificationBell({
  currentUser,
  theme = 'dark',
  onNavigateTab
}: NotificationBellProps) {
  const isLight = theme === 'light';
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize service & subscribe
  useEffect(() => {
    NotificationService.init();
    
    const refresh = () => {
      const userList = NotificationService.getNotificationsForUser(currentUser);
      setNotifications(userList);
      setUnreadCount(NotificationService.getUnreadCount(currentUser));
    };

    refresh();
    const unsubscribe = NotificationService.subscribe(refresh);
    return () => unsubscribe();
  }, [currentUser]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Subtle web audio sound synthesizer for notifications
  const playChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead(currentUser);
    playChime();
  };

  const handleNotificationClick = (notif: AppNotification) => {
    NotificationService.markAsRead(notif.id);
    if (notif.linkTab) {
      onNavigateTab(notif.linkTab);
      setIsOpen(false);
    }
  };

  const filteredNotifs = filter === 'unread' 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Shield className="w-3.5 h-3.5 text-rose-400" />;
      case 'certificate':
        return <Award className="w-3.5 h-3.5 text-amber-400" />;
      case 'feedback':
        return <ClipboardList className="w-3.5 h-3.5 text-sky-400" />;
      case 'workshop':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />;
      case 'course':
      case 'enrollment':
        return <BookOpen className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isLight
            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
            : 'bg-[#0d1f38] hover:bg-[#122847] border-blue-900/40 text-slate-200 shadow-sm'
        } ${isOpen ? (isLight ? 'ring-2 ring-blue-900/20' : 'ring-2 ring-sky-400/30') : ''}`}
        title="Dakshyam Real-Time In-App Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 transition-transform hover:rotate-12" />
        
        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-rose-500 text-white font-mono text-[9px] font-black shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden backdrop-blur-xl ${
              isLight
                ? 'bg-white/95 border-blue-900/15 text-slate-800'
                : 'bg-[#0a192f]/95 border-blue-800/40 text-slate-100 shadow-[0_0_35px_rgba(0,0,0,0.6)]'
            }`}
          >
            {/* Header */}
            <div className={`p-3.5 px-4 border-b flex items-center justify-between ${
              isLight ? 'border-slate-200 bg-slate-50/80' : 'border-blue-900/30 bg-[#071326]/80'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-black uppercase tracking-wider">
                  Live Notifications
                </span>
                {unreadCount > 0 && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    isLight ? 'bg-blue-100 text-blue-900' : 'bg-sky-500/20 text-sky-300'
                  }`}>
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Mute notification chimes' : 'Enable chimes'}
                  className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                    isLight 
                      ? 'border-slate-200 hover:bg-slate-200 text-slate-600' 
                      : 'border-blue-900/40 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    title="Mark all as read"
                    className="text-[10px] font-mono font-bold uppercase text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Read All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Sub-bar & Role Safety Indicator */}
            <div className={`p-2 px-4 border-b flex items-center justify-between text-[10px] font-mono ${
              isLight ? 'bg-white border-slate-100 text-slate-600' : 'bg-[#0d1f38]/60 border-blue-900/20 text-slate-400'
            }`}>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                    filter === 'all' 
                      ? (isLight ? 'bg-blue-900 text-white font-bold' : 'bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30') 
                      : 'hover:text-blue-500'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                    filter === 'unread' 
                      ? (isLight ? 'bg-blue-900 text-white font-bold' : 'bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30') 
                      : 'hover:text-blue-500'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              <span className="text-[9px] flex items-center gap-1 font-semibold text-emerald-400">
                <Shield className="w-3 h-3" />
                <span>{currentUser ? `${currentUser.role.toUpperCase()} Hub` : 'Guest Hub'}</span>
              </span>
            </div>

            {/* Notifications Scroll Area */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-500/10 overscroll-contain">
              {filteredNotifs.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto text-slate-400">
                    <CheckCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-mono text-slate-400">
                    {filter === 'unread' ? 'All caught up! No unread notifications.' : 'No alerts available right now.'}
                  </p>
                </div>
              ) : (
                filteredNotifs.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 sm:p-3.5 transition-all cursor-pointer flex items-start gap-3 hover:bg-blue-500/5 ${
                      !notif.isRead 
                        ? (isLight ? 'bg-blue-50/60 font-medium' : 'bg-blue-950/40') 
                        : 'opacity-85'
                    }`}
                  >
                    {/* Category Icon Container */}
                    <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-[#071326] border-blue-900/40'
                    }`}>
                      {getCategoryIcon(notif.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs font-mono font-bold truncate ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                        }`}>
                          {notif.title}
                        </h4>
                        <span className="text-[9px] font-mono text-slate-400 shrink-0">
                          {formatTimeAgo(notif.timestamp)}
                        </span>
                      </div>

                      <p className={`text-[11px] leading-relaxed line-clamp-2 ${
                        isLight ? 'text-slate-650' : 'text-slate-300'
                      }`}>
                        {notif.message}
                      </p>

                      {/* Action tab badge */}
                      {notif.linkTab && (
                        <div className="pt-0.5 flex items-center justify-between text-[10px] font-mono text-sky-400">
                          <span className="flex items-center gap-1 font-semibold hover:underline">
                            Open {notif.linkTab.toUpperCase()} View <ChevronRight className="w-3 h-3" />
                          </span>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className={`p-2.5 px-4 text-center border-t text-[9px] font-mono ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#071326] border-blue-900/30 text-slate-400'
            }`}>
              <span>Role-isolated alert feed • Zero sensitive data leaks</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
