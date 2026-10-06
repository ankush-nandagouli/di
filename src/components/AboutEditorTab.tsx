import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Sparkles, Layers, Building2, MapPin, Compass, Eye, Share2 } from 'lucide-react';
import { CompanyAbout, CompanyService } from '../types';
import { DakshyamDatabase, DEFAULT_SERVICES } from '../utils/db';

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
  const [pinUpdateMsg, setPinUpdateMsg] = useState('');

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(supervisorPin)) {
      alert('Error: The directorship access lock PIN must be exactly 6 numeric digits.');
      return;
    }
    try {
      DakshyamDatabase.saveSupervisorPin(supervisorPin);
      setPinUpdateMsg('✓ 6-Digit supervisory security access PIN successfully updated! Active immediately on all entrance node links.');
      setTimeout(() => setPinUpdateMsg(''), 5000);
    } catch {
      alert('Could not write updated protocol lock keys to regional database.');
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
      setTimeout(() => setStatusMsg(''), 4000);
      onRefresh();
    } catch {
      alert('Failed updating company database.');
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
            <input
              type="text"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              className={`w-full font-mono text-center tracking-widest font-black rounded-xl px-3 py-2 text-md focus:outline-none border ${
                isLight 
                  ? 'bg-white border-slate-300 text-blue-950 focus:border-blue-900' 
                  : 'bg-[#071326] border-blue-800/40 text-sky-300 focus:border-sky-400'
              }`}
              value={supervisorPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ''); // Numeric only
                setSupervisorPin(val);
              }}
              placeholder="6-digit PIN"
            />
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
            <div className="space-y-1">
              <label className="block text-3xs font-mono text-slate-500 uppercase">GitHub Profile URL</label>
              <input
                type="url"
                className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none border font-mono ${inputBg}`}
                value={aboutData.socialGithub}
                onChange={(e) => setAboutData({ ...aboutData, socialGithub: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-3xs font-mono text-slate-500 uppercase">LinkedIn Profile URL</label>
              <input
                type="url"
                className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none border font-mono ${inputBg}`}
                value={aboutData.socialLinkedin}
                onChange={(e) => setAboutData({ ...aboutData, socialLinkedin: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-3xs font-mono text-slate-500 uppercase">Twitter Profile URL</label>
              <input
                type="url"
                className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none border font-mono ${inputBg}`}
                value={aboutData.socialTwitter}
                onChange={(e) => setAboutData({ ...aboutData, socialTwitter: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-3xs font-mono text-slate-500 uppercase">YouTube Channel URL</label>
              <input
                type="url"
                className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none border font-mono ${inputBg}`}
                value={aboutData.socialYoutube}
                onChange={(e) => setAboutData({ ...aboutData, socialYoutube: e.target.value })}
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
