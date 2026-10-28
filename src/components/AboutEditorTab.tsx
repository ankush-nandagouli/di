import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Sparkles, Layers, Building2, MapPin, Compass, Eye, EyeOff, Share2, Instagram, ExternalLink, Github, Linkedin, Twitter, Youtube } from 'lucide-react';
import { CompanyAbout, CompanyService } from '../types';
import { DakshyamDatabase, DEFAULT_SERVICES } from '../utils/db';
import { notifyError, notifySuccess } from '../utils/toast';

interface AboutEditorTabProps {
  onRefresh: () => void;
  theme: string;
}

export function AboutEditorTab({ onRefresh, theme }: AboutEditorTabProps) {
  const isLight = theme === 'light';
  // Local form state so we can edit cleanly
  const [aboutData, setAboutData] = useState<CompanyAbout>(() => {
    const data = DakshyamDatabase.getCompanyAbout();
    if (!data.services || data.services.length === 0) {
      data.services = DEFAULT_SERVICES;
    }
    if (!data.tagline) {
      data.tagline = 'Learn • Build • Innovate';
    }
    return data;
  });
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Dynamic 6-digit access PIN manager state
  const [supervisorPin, setSupervisorPin] = useState(() => DakshyamDatabase.getSupervisorPin());
  const [showPin, setShowPin] = useState(false);
  const [pinUpdateMsg, setPinUpdateMsg] = useState('');

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(supervisorPin)) {
      notifyError('The directorship access lock PIN must be exactly 6 numeric digits.');
      return;
    }
    try {
      DakshyamDatabase.saveSupervisorPin(supervisorPin);
      setPinUpdateMsg('✓ 6-Digit supervisory security access PIN successfully updated! Active immediately on all entrance node links.');
      notifySuccess('Supervisory PIN successfully updated!');
      setTimeout(() => setPinUpdateMsg(''), 5000);
    } catch {
      notifyError('Could not write updated protocol lock keys to regional database.');
    }
  };

  const handleSaveAbout = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Ensure founders are stripped per system guidelines
      const cleanedData: CompanyAbout = {
        ...aboutData,
        founders: []
      };
      DakshyamDatabase.saveCompanyAbout(cleanedData);
      setStatusMsg('✓ Corporate parameters & vocational services updated successfully! Reflecting live on the platform.');
      notifySuccess('Corporate parameters updated successfully!');
      setTimeout(() => setStatusMsg(''), 4000);
      onRefresh();
    } catch {
      notifyError('Failed updating company database.');
    } finally {
      setSaving(false);
    }
  };

  const handleServiceChange = (idx: number, field: keyof CompanyService, val: any) => {
    const updatedServices = [...(aboutData.services || [])];
    if (field === 'technologies' && typeof val === 'string') {
      updatedServices[idx] = {
        ...updatedServices[idx],
        technologies: val.split(',').map(t => t.trim()).filter(Boolean)
      };
    } else {
      updatedServices[idx] = {
        ...updatedServices[idx],
        [field]: val
      };
    }
    setAboutData({ ...aboutData, services: updatedServices });
  };

  const handleAddService = () => {
    const newService: CompanyService = {
      id: `srv-${Date.now()}`,
      category: 'TECHNICAL TRAINING',
      title: 'New Vocational Track',
      technologies: ['Hands-on', 'Practical'],
      description: 'Detailed description of curriculum, practical exercises, and learning outcomes.',
      badge: 'NEW PROGRAM'
    };
    setAboutData({
      ...aboutData,
      services: [...(aboutData.services || []), newService]
    });
  };

  const handleDeleteService = (idx: number) => {
    const updated = (aboutData.services || []).filter((_, i) => i !== idx);
    setAboutData({ ...aboutData, services: updated });
  };

  const textLabel = isLight ? 'text-blue-950 font-bold' : 'text-sky-300';
  const inputBg = isLight 
    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-900 focus:bg-white' 
    : 'bg-[#071326] border-blue-900/40 text-white focus:border-sky-400';
  const cardBg = isLight 
    ? 'bg-white border-slate-200 shadow-xs' 
    : 'bg-[#0a192f]/60 border-blue-900/40';

  return (
    <div className="space-y-8 select-text">
      <div className={`border-b pb-3 ${isLight ? 'border-blue-900/10' : 'border-blue-900/20'}`}>
        <h3 className={`text-sm font-black tracking-widest uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
          ✏️ Dakshyam Corporate Profile, Services & Security Gateway
        </h3>
        <p className="text-3xs text-slate-500 font-mono mt-1">
          Customize platform tagline, mission & vision statements, Waraseoni headquarters address, technical service catalogs, and the 6-digit access lock PIN.
        </p>
      </div>

      {/* PIN Code Configuration */}
      <div className={`p-4 rounded-2xl border space-y-4 text-left ${
        isLight ? 'bg-blue-50/30 border-blue-900/15' : 'bg-[#0a192f]/60 border-blue-800/30'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 border rounded-xl ${
            isLight ? 'border-blue-900/15 bg-blue-900/10 text-blue-950' : 'border-blue-700/40 bg-blue-950/60 text-sky-400'
          }`}>
            <ShieldCheck className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
              🔒 Staff Portal Access PIN Lock
            </h4>
            <p className="text-3xs text-slate-500 font-mono mt-0.5 leading-relaxed">
              Configure the 6-digit credential lock key code. Toggling Staff/Supervisor entrance triggers this PIN challenge automatically.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end gap-3 max-w-md pt-1">
          <div className="space-y-1.5 flex-grow">
            <label className={`block text-4xs font-mono uppercase tracking-widest ${textLabel}`}>
              6-Digit Security access PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                maxLength={6}
                pattern="[0-9]{6}"
                required
                className={`w-full font-mono text-center tracking-widest font-black rounded-xl px-3 py-2 pr-9 text-md focus:outline-none border ${
                  isLight 
                    ? 'bg-white border-slate-300 text-blue-950 focus:border-blue-900' 
                    : 'bg-[#071326] border-blue-800/40 text-sky-300 focus:border-sky-400'
                }`}
                value={supervisorPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ''); // Numeric only
                  setSupervisorPin(val);
                }}
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                title={showPin ? "Mask PIN" : "Show PIN"}
              >
                {showPin ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSavePin}
            className={`px-5 py-2.5 font-mono font-bold text-3xs uppercase tracking-wider rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
              isLight 
                ? 'bg-blue-950 hover:bg-blue-900 text-white' 
                : 'bg-white hover:bg-slate-100 text-[#0a192f] font-black'
            }`}
          >
            Commit PIN Update
          </button>
        </div>
        {pinUpdateMsg && (
          <p className="text-3xs font-mono text-emerald-600 font-bold mt-1 bg-emerald-950/10 border border-emerald-500/20 p-2.5 rounded-lg">
            {pinUpdateMsg}
          </p>
        )}
      </div>

      {statusMsg && (
        <div className={`text-xs font-mono p-3.5 border rounded-xl font-bold ${
          isLight ? 'text-blue-950 bg-blue-50 border-blue-900/20' : 'text-sky-300 bg-blue-950/40 border-blue-700/40'
        }`}>
          {statusMsg}
        </div>
      )}

      <form onSubmit={handleSaveAbout} className="space-y-8">
        
        {/* Section A: Core Parameters & Tagline */}
        <div className={`p-5 rounded-2xl border space-y-5 ${cardBg}`}>
          <div className="flex items-center gap-2 border-b pb-2">
            <Building2 className={`w-4 h-4 ${isLight ? 'text-blue-900' : 'text-sky-400'}`} />
            <h4 className={`text-xs font-mono font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Identity & Global Headquarters
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className={`block text-3xs font-mono uppercase tracking-wider ${textLabel}`}>
                Platform Tagline
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border font-bold ${inputBg}`}
                  value={aboutData.tagline || ''}
                  onChange={(e) => setAboutData({ ...aboutData, tagline: e.target.value })}
                  placeholder="e.g. Learn • Build • Innovate"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Appears on headers, logos, and promotional hero banners.</span>
            </div>

            <div className="space-y-1.5">
              <label className={`block text-3xs font-mono uppercase tracking-wider ${textLabel}`}>
                Company Registered Name
              </label>
              <input
                type="text"
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${inputBg}`}
                value={aboutData.companyName}
                onChange={(e) => setAboutData({ ...aboutData, companyName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`block text-3xs font-mono uppercase tracking-wider ${textLabel}`}>
              Office Location / Address
            </label>
            <input
              type="text"
              className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${inputBg}`}
              value={aboutData.officeLocation}
              onChange={(e) => setAboutData({ ...aboutData, officeLocation: e.target.value })}
              placeholder="e.g. Ward No. 4, Siddhivinayak Complex, First Floor, Balaghat Road, Waraseoni - 481331"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className={`block text-3xs font-mono uppercase tracking-wider ${textLabel}`}>
              Executive Overview / Mission Description
            </label>
            <textarea
              rows={3}
              className={`w-full rounded-xl p-3 text-xs focus:outline-none border font-sans leading-relaxed ${inputBg}`}
              value={aboutData.description}
              onChange={(e) => setAboutData({ ...aboutData, description: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Section B: Mission & Vision */}
        <div className={`p-5 rounded-2xl border space-y-5 ${cardBg}`}>
          <div className="flex items-center gap-2 border-b pb-2">
            <Compass className={`w-4 h-4 ${isLight ? 'text-blue-900' : 'text-sky-400'}`} />
            <h4 className={`text-xs font-mono font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Mission & Vision Directives (NEP 2020 Aligned)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className={`block text-3xs font-mono uppercase tracking-wider ${textLabel}`}>
                Corporate Mission Statement
              </label>
              <textarea
                rows={5}
                className={`w-full rounded-xl p-3 text-xs focus:outline-none border font-sans leading-relaxed ${inputBg}`}
                value={aboutData.mission}
                onChange={(e) => setAboutData({ ...aboutData, mission: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-3xs font-mono uppercase tracking-wider ${textLabel}`}>
                Corporate Vision Statement
              </label>
              <textarea
                rows={5}
                className={`w-full rounded-xl p-3 text-xs focus:outline-none border font-sans leading-relaxed ${inputBg}`}
                value={aboutData.vision}
                onChange={(e) => setAboutData({ ...aboutData, vision: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Section C: Comprehensive Vocational Services Manager */}
        <div className={`p-5 rounded-2xl border space-y-5 ${cardBg}`}>
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Layers className={`w-4 h-4 ${isLight ? 'text-blue-900' : 'text-sky-400'}`} />
              <div>
                <h4 className={`text-xs font-mono font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Technical Services & Curriculum Tracks ({aboutData.services?.length || 0})
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  Manage offerings: Programming, Web Development, App Development, IoT & Robotics, Web Dev + IoT + AI, Computer Training.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddService}
              className={`inline-flex items-center gap-1.5 text-3xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                isLight 
                  ? 'bg-blue-50 border-blue-900/20 text-blue-950 hover:bg-blue-100' 
                  : 'bg-blue-950/60 border-blue-700/40 text-sky-300 hover:bg-blue-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Add Track
            </button>
          </div>

          <div className="space-y-5">
            {aboutData.services?.map((srv, idx) => (
              <div 
                key={srv.id || idx}
                className={`p-4 rounded-xl border space-y-3 transition-all ${
                  isLight 
                    ? 'bg-slate-50/70 border-slate-200' 
                    : 'bg-[#071326]/80 border-blue-900/30'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full text-3xs font-mono font-black flex items-center justify-center border ${
                      isLight ? 'bg-blue-900/10 text-blue-950 border-blue-900/15' : 'bg-blue-950 text-sky-400 border-blue-700/40'
                    }`}>
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      className={`text-xs font-mono uppercase tracking-wider font-black rounded-lg px-2 py-1 border ${inputBg}`}
                      value={srv.category}
                      onChange={(e) => handleServiceChange(idx, 'category', e.target.value)}
                      placeholder="CATEGORY"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className={`text-[10px] font-mono uppercase rounded-lg px-2 py-1 border max-w-[120px] ${inputBg}`}
                      value={srv.badge || ''}
                      onChange={(e) => handleServiceChange(idx, 'badge', e.target.value)}
                      placeholder="BADGE (OPTIONAL)"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteService(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete Service Track"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-4xs font-mono uppercase mb-0.5 ${textLabel}`}>Track Title</label>
                    <input
                      type="text"
                      className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none border ${inputBg}`}
                      value={srv.title}
                      onChange={(e) => handleServiceChange(idx, 'title', e.target.value)}
                      placeholder="e.g. Programming & Software Development"
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-4xs font-mono uppercase mb-0.5 ${textLabel}`}>
                      Technologies (comma separated)
                    </label>
                    <input
                      type="text"
                      className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none border font-mono ${inputBg}`}
                      value={srv.technologies?.join(', ') || ''}
                      onChange={(e) => handleServiceChange(idx, 'technologies', e.target.value)}
                      placeholder="e.g. C, C++, Python, JavaScript"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-4xs font-mono uppercase mb-0.5 ${textLabel}`}>Track Description</label>
                  <textarea
                    rows={2}
                    className={`w-full rounded-lg p-2.5 text-xs focus:outline-none border font-sans leading-relaxed ${inputBg}`}
                    value={srv.description}
                    onChange={(e) => handleServiceChange(idx, 'description', e.target.value)}
                    placeholder="Provide overview of curriculum, hands-on projects, and vocational skills..."
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section D: Social Media Links */}
        <div className={`p-5 rounded-2xl border space-y-4 ${cardBg}`}>
          <div className="flex items-center gap-2 border-b pb-2">
            <Share2 className={`w-4 h-4 ${isLight ? 'text-blue-900' : 'text-sky-400'}`} />
            <h4 className={`text-xs font-mono font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Social Connection Infrastructure
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* INSTAGRAM */}
            <div className={`p-3.5 rounded-2xl border transition-all sm:col-span-2 ${
              aboutData.hideInstagram 
                ? (isLight ? 'bg-slate-100/70 border-slate-300 opacity-75' : 'bg-slate-900/40 border-slate-800 opacity-70')
                : (isLight ? 'border-pink-300/60 bg-pink-50/50' : 'border-pink-500/25 bg-pink-500/5')
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <label className="text-3xs font-mono font-bold uppercase flex items-center gap-1.5 text-pink-500">
                  <Instagram className="w-4 h-4" />
                  <span>Instagram Profile URL</span>
                </label>
                <div className="flex items-center gap-2">
                  {aboutData.socialInstagram && (
                    <a
                      href={aboutData.socialInstagram}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9.5px] font-mono font-bold text-pink-500 hover:text-pink-400 flex items-center gap-1"
                    >
                      <span>Test Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setAboutData({ ...aboutData, hideInstagram: !aboutData.hideInstagram })}
                    className={`px-2.5 py-1 rounded-xl text-3xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                      aboutData.hideInstagram
                        ? (isLight ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-rose-950/40 text-rose-400 border-rose-500/30')
                        : (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30')
                    }`}
                  >
                    {aboutData.hideInstagram ? <EyeOff className="w-3 h-3 text-rose-500" /> : <Eye className="w-3 h-3 text-emerald-500" />}
                    <span>{aboutData.hideInstagram ? 'Hidden by Admin' : 'Visible on Site'}</span>
                  </button>
                </div>
              </div>
              <input
                type="url"
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border font-mono ${inputBg} focus:border-pink-500`}
                value={aboutData.socialInstagram || ''}
                onChange={(e) => setAboutData({ ...aboutData, socialInstagram: e.target.value })}
                placeholder="https://instagram.com/dakshyam_innovations"
              />
            </div>

            {/* LINKEDIN */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              aboutData.hideLinkedin
                ? (isLight ? 'bg-slate-100/70 border-slate-300 opacity-75' : 'bg-slate-900/40 border-slate-800 opacity-70')
                : (isLight ? 'border-blue-300/60 bg-blue-50/50' : 'border-blue-500/25 bg-blue-500/5')
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <label className="text-3xs font-mono font-bold uppercase flex items-center gap-1.5 text-blue-500">
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn Profile</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAboutData({ ...aboutData, hideLinkedin: !aboutData.hideLinkedin })}
                  className={`px-2 py-0.5 rounded-lg text-3xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                    aboutData.hideLinkedin
                      ? (isLight ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-rose-950/40 text-rose-400 border-rose-500/30')
                      : (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30')
                  }`}
                >
                  {aboutData.hideLinkedin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{aboutData.hideLinkedin ? 'Hidden' : 'Visible'}</span>
                </button>
              </div>
              <input
                type="url"
                className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none border font-mono ${inputBg}`}
                value={aboutData.socialLinkedin || ''}
                onChange={(e) => setAboutData({ ...aboutData, socialLinkedin: e.target.value })}
                placeholder="https://linkedin.com/company/dakshyam-innovations"
              />
            </div>

            {/* YOUTUBE */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              aboutData.hideYoutube
                ? (isLight ? 'bg-slate-100/70 border-slate-300 opacity-75' : 'bg-slate-900/40 border-slate-800 opacity-70')
                : (isLight ? 'border-red-300/60 bg-red-50/50' : 'border-red-500/25 bg-red-500/5')
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <label className="text-3xs font-mono font-bold uppercase flex items-center gap-1.5 text-red-500">
                  <Youtube className="w-3.5 h-3.5" />
                  <span>YouTube Channel</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAboutData({ ...aboutData, hideYoutube: !aboutData.hideYoutube })}
                  className={`px-2 py-0.5 rounded-lg text-3xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                    aboutData.hideYoutube
                      ? (isLight ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-rose-950/40 text-rose-400 border-rose-500/30')
                      : (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30')
                  }`}
                >
                  {aboutData.hideYoutube ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{aboutData.hideYoutube ? 'Hidden' : 'Visible'}</span>
                </button>
              </div>
              <input
                type="url"
                className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none border font-mono ${inputBg}`}
                value={aboutData.socialYoutube || ''}
                onChange={(e) => setAboutData({ ...aboutData, socialYoutube: e.target.value })}
                placeholder="https://youtube.com/@dakshyaminnovations"
              />
            </div>

            {/* TWITTER / X */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              aboutData.hideTwitter
                ? (isLight ? 'bg-slate-100/70 border-slate-300 opacity-75' : 'bg-slate-900/40 border-slate-800 opacity-70')
                : (isLight ? 'border-slate-300 bg-slate-50/50' : 'border-slate-700 bg-slate-800/40')
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <label className={`text-3xs font-mono font-bold uppercase flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  <Twitter className="w-3.5 h-3.5" />
                  <span>Twitter / X Profile</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAboutData({ ...aboutData, hideTwitter: !aboutData.hideTwitter })}
                  className={`px-2 py-0.5 rounded-lg text-3xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                    aboutData.hideTwitter
                      ? (isLight ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-rose-950/40 text-rose-400 border-rose-500/30')
                      : (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30')
                  }`}
                >
                  {aboutData.hideTwitter ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{aboutData.hideTwitter ? 'Hidden' : 'Visible'}</span>
                </button>
              </div>
              <input
                type="url"
                className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none border font-mono ${inputBg}`}
                value={aboutData.socialTwitter || ''}
                onChange={(e) => setAboutData({ ...aboutData, socialTwitter: e.target.value })}
                placeholder="https://twitter.com/dakshyam_in"
              />
            </div>

            {/* GITHUB */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              aboutData.hideGithub
                ? (isLight ? 'bg-slate-100/70 border-slate-300 opacity-75' : 'bg-slate-900/40 border-slate-800 opacity-70')
                : (isLight ? 'border-slate-300 bg-slate-50/50' : 'border-slate-700 bg-slate-800/40')
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <label className={`text-3xs font-mono font-bold uppercase flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Organization</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAboutData({ ...aboutData, hideGithub: !aboutData.hideGithub })}
                  className={`px-2 py-0.5 rounded-lg text-3xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                    aboutData.hideGithub
                      ? (isLight ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-rose-950/40 text-rose-400 border-rose-500/30')
                      : (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30')
                  }`}
                >
                  {aboutData.hideGithub ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{aboutData.hideGithub ? 'Hidden' : 'Visible'}</span>
                </button>
              </div>
              <input
                type="url"
                className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none border font-mono ${inputBg}`}
                value={aboutData.socialGithub || ''}
                onChange={(e) => setAboutData({ ...aboutData, socialGithub: e.target.value })}
                placeholder="https://github.com/dakshyam-innovations"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-3xs font-mono text-slate-500 uppercase">Official Support Email</label>
              <input
                type="email"
                className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none border font-mono ${inputBg}`}
                value={aboutData.contactEmail || ''}
                onChange={(e) => setAboutData({ ...aboutData, contactEmail: e.target.value })}
                placeholder="support@dakshyaminnovations.in"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-3xs font-mono text-slate-500 uppercase">Official Hotline / Phone</label>
              <input
                type="text"
                className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none border font-mono ${inputBg}`}
                value={aboutData.contactPhone || ''}
                onChange={(e) => setAboutData({ ...aboutData, contactPhone: e.target.value })}
                placeholder="+91 7632 234567"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className={`pt-3 border-t flex justify-end ${isLight ? 'border-blue-900/10' : 'border-blue-900/20'}`}>
          <button
            type="submit"
            disabled={saving}
            className={`px-8 py-3 font-mono font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md ${
              isLight 
                ? 'bg-blue-950 hover:bg-blue-900 text-white disabled:bg-slate-300' 
                : 'bg-white hover:bg-slate-100 text-[#0a192f] disabled:bg-slate-800'
            }`}
          >
            {saving ? 'Synchronizing platform...' : '✓ Commit Corporate Changes'}
          </button>
        </div>

      </form>

    </div>
  );
}
