import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { CompanyAbout } from '../types';
import { DakshyamDatabase } from '../utils/db';

interface AboutEditorTabProps {
  onRefresh: () => void;
  theme: string;
}

export function AboutEditorTab({ onRefresh, theme }: AboutEditorTabProps) {
  const isLight = theme === 'light';
  // Local form state so we can edit cleanly
  const [aboutData, setAboutData] = useState<CompanyAbout>(() => DakshyamDatabase.getCompanyAbout());
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
      DakshyamDatabase.saveCompanyAbout(aboutData);
      setStatusMsg('✓ Corporate parameters updated successfully! Reflecting live on the platform.');
      setTimeout(() => setStatusMsg(''), 4000);
      onRefresh();
    } catch {
      alert('Failed updating company database.');
    } finally {
      setSaving(false);
    }
  };

  const handleFounderChange = (fIdx: number, field: string, val: string) => {
    const updatedFounders = aboutData.founders.map((founder, i) => {
      if (i === fIdx) {
        return { ...founder, [field]: val };
      }
      return founder;
    });
    setAboutData({ ...aboutData, founders: updatedFounders });
  };

  const textLabel = isLight ? 'text-blue-950 font-bold' : 'text-sky-300';
  const inputBg = isLight 
    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-900 focus:bg-white' 
    : 'bg-[#071326] border-blue-900/40 text-white focus:border-sky-400';

  return (
    <div className="space-y-6">
      <div className={`border-b pb-3 ${isLight ? 'border-blue-900/10' : 'border-blue-900/20'}`}>
        <h3 className={`text-sm font-black tracking-widest uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
          ✏️ Dakshyam Corporate Profile & Security Gateway
        </h3>
        <p className="text-3xs text-slate-500 font-mono mt-1">
          Updates descriptions, mission directives, headquarter location, active directorship details, and the secure 6-digit access PIN lock key.
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

      <form onSubmit={handleSaveAbout} className="space-y-6">
        
        {/* Section A: Core Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className={`block text-3xs font-mono uppercase tracking-wider ${textLabel}`}>Company Registered Name</label>
            <input
              type="text"
              className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${inputBg}`}
              value={aboutData.companyName}
              onChange={(e) => setAboutData({ ...aboutData, companyName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className={`block text-3xs font-mono uppercase tracking-wider ${textLabel}`}>Office Location (Headquarters)</label>
            <input
              type="text"
              className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${inputBg}`}
              value={aboutData.officeLocation}
              onChange={(e) => setAboutData({ ...aboutData, officeLocation: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className={`block text-3xs font-mono uppercase tracking-wider ${textLabel}`}>Executive Overview / Core Description</label>
          <textarea
            rows={4}
            className={`w-full rounded-xl p-3 text-xs focus:outline-none border font-sans leading-relaxed ${inputBg}`}
            value={aboutData.description}
            onChange={(e) => setAboutData({ ...aboutData, description: e.target.value })}
            required
          />
        </div>

        {/* Mission & Vision split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className={`block text-3xs font-mono uppercase tracking-wider ${textLabel}`}>Corporate Mission Statement</label>
            <textarea
              rows={4}
              className={`w-full rounded-xl p-3 text-xs focus:outline-none border font-sans leading-relaxed ${inputBg}`}
              value={aboutData.mission}
              onChange={(e) => setAboutData({ ...aboutData, mission: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className={`block text-3xs font-mono uppercase tracking-wider ${textLabel}`}>Corporate Vision Statement</label>
            <textarea
              rows={4}
              className={`w-full rounded-xl p-3 text-xs focus:outline-none border font-sans leading-relaxed ${inputBg}`}
              value={aboutData.vision}
              onChange={(e) => setAboutData({ ...aboutData, vision: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Social Media Link Handles */}
        <div className={`border-t pt-4 space-y-4 ${isLight ? 'border-blue-900/10' : 'border-blue-900/20'}`}>
          <h4 className={`text-3xs font-mono font-extrabold uppercase tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Social Connection Infrastructure
          </h4>
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

        {/* Directorship / Co-founders dynamic blocks */}
        <div className={`border-t pt-4 space-y-4 ${isLight ? 'border-blue-900/10' : 'border-blue-900/20'}`}>
          <div className={`flex justify-between items-center p-3 rounded-xl border ${
            isLight ? 'bg-blue-50/50 border-blue-900/15' : 'bg-blue-950/30 border-blue-800/40'
          }`}>
            <span className={`text-3xs font-mono uppercase font-black tracking-widest block font-bold ${textLabel}`}>Board of Directors & Co-Founders ({aboutData.founders.length})</span>
            <span className={`text-3xs font-mono px-2 py-0.5 rounded ${isLight ? 'bg-white text-slate-600 border border-slate-200' : 'bg-black/40 text-slate-400'}`}>Locked Seats</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {aboutData.founders.map((founder, fIdx) => (
              <div key={fIdx} className={`p-4 rounded-xl space-y-3 border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#0a192f]/50 border-blue-900/30 hover:border-blue-700/40'
              }`}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-full text-3xs font-mono font-bold flex items-center justify-center border ${
                    isLight ? 'bg-blue-50 border-blue-900/20 text-blue-950' : 'bg-blue-950/60 border-blue-700/40 text-sky-400'
                  }`}>
                    #{fIdx + 1}
                  </span>
                  <span className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>{founder.name}</span>
                </div>

                <div className="space-y-2 text-xs text-left">
                  <div>
                    <label className={`block text-4xs font-mono uppercase mb-0.5 ${textLabel}`}>Corporate Sitting Role</label>
                    <input
                      type="text"
                      className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none border ${inputBg}`}
                      value={founder.role}
                      onChange={(e) => handleFounderChange(fIdx, 'role', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-4xs font-mono uppercase mb-0.5 ${textLabel}`}>Professional Bio & Directorship Notes</label>
                    <textarea
                      rows={4}
                      className={`w-full rounded-lg p-2.5 text-xs focus:outline-none border font-sans leading-relaxed ${inputBg}`}
                      value={founder.bio}
                      onChange={(e) => handleFounderChange(fIdx, 'bio', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`pt-3 border-t flex justify-end ${isLight ? 'border-blue-900/10' : 'border-blue-900/20'}`}>
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-2.5 font-mono font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
              isLight 
                ? 'bg-blue-950 hover:bg-blue-900 text-white disabled:bg-slate-300' 
                : 'bg-white hover:bg-slate-100 text-[#0a192f] disabled:bg-slate-800'
            }`}
          >
            {saving ? 'Synchronizing database...' : '✓ Commit Corporate Changes'}
          </button>
        </div>

      </form>

    </div>
  );
}
