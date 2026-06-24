import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { CompanyAbout } from '../types';
import { DakshyamDatabase } from '../utils/db';

interface AboutEditorTabProps {
  onRefresh: () => void;
  theme: string;
}

export function AboutEditorTab({ onRefresh, theme }: AboutEditorTabProps) {
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

  return (
    <div className="space-y-6">
      <div className="border-b border-cyan-500/10 pb-3">
        <h3 className="text-sm font-black text-white tracking-widest uppercase">
          ✏️ Dakshyam Corporate Profile & Security Gateway
        </h3>
        <p className="text-3xs text-slate-400 font-mono mt-1">
          Updates descriptions, mission directives, headquarter location, active directorship details, and the secure 6-digit access PIN lock key.
        </p>
      </div>

      {/* PIN Code Configuration */}
      <div className="p-4 rounded-2xl border border-cyan-500/15 bg-black/40 space-y-4 text-left">
        <div className="flex items-start gap-3">
          <div className="p-2 border border-amber-500/10 bg-amber-500/5 text-amber-500 rounded-xl">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              🔒 Staff Portal Access PIN Lock
            </h4>
            <p className="text-3xs text-slate-400 font-mono mt-0.5 leading-relaxed">
              Configure the 6-digit credential lock key code. Toggling Staff/Supervisor entrance triggers this PIN challenge automatically.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end gap-3 max-w-md pt-1">
          <div className="space-y-1.5 flex-grow">
            <label className="block text-4xs font-mono text-cyan-400 uppercase tracking-widest">
              6-Digit Security access PIN
            </label>
            <input
              type="text"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              className="w-full bg-black/85 border border-cyan-500/15 text-yellow-400 font-mono text-center tracking-widest font-black rounded-xl px-3 py-2 text-md focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/25"
              value={supervisorPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ''); // Numeric only
                setSupervisorPin(val);
              }}
              placeholder="e.g. 123456"
            />
          </div>
          <button
            type="button"
            onClick={handleSavePin}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-650 text-white font-mono font-bold text-3xs uppercase tracking-wider rounded-xl transition-all cursor-pointer select-none active:scale-95"
          >
            Commit PIN Update
          </button>
        </div>
        {pinUpdateMsg && (
          <p className="text-3xs font-mono text-emerald-450 font-bold mt-1 bg-emerald-950/20 border border-emerald-500/10 p-2.5 rounded-lg">
            {pinUpdateMsg}
          </p>
        )}
      </div>

      {statusMsg && (
        <div className="text-xs font-mono text-cyan-400 bg-cyan-950/30 p-3.5 border border-cyan-500/20 rounded-xl font-bold">
          {statusMsg}
        </div>
      )}

      <form onSubmit={handleSaveAbout} className="space-y-6">
        
        {/* Section A: Core Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-3xs font-mono text-cyan-400 uppercase tracking-wider">Company Registered Name</label>
            <input
              type="text"
              className="w-full bg-black/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500/25"
              value={aboutData.companyName}
              onChange={(e) => setAboutData({ ...aboutData, companyName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-3xs font-mono text-cyan-400 uppercase tracking-wider">Office Location (Headquarters)</label>
            <input
              type="text"
              className="w-full bg-black/80 border border-cyan-500/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500/25"
              value={aboutData.officeLocation}
              onChange={(e) => setAboutData({ ...aboutData, officeLocation: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-3xs font-mono text-cyan-400 uppercase tracking-wider">Executive Overview / Core Description</label>
          <textarea
            rows={4}
            className="w-full bg-black/80 border border-cyan-500/10 text-white rounded-xl p-3 text-xs focus:outline-[#22d3ee]/25 font-sans leading-relaxed text-slate-300"
            value={aboutData.description}
            onChange={(e) => setAboutData({ ...aboutData, description: e.target.value })}
            required
          />
        </div>

        {/* Mission & Vision split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-3xs font-mono text-cyan-400 uppercase tracking-wider">Corporate Mission Statement</label>
            <textarea
              rows={4}
              className="w-full bg-black/80 border border-cyan-500/10 text-white rounded-xl p-3 text-xs focus:outline-[#22d3ee]/25 font-sans leading-relaxed text-slate-300"
              value={aboutData.mission}
              onChange={(e) => setAboutData({ ...aboutData, mission: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-3xs font-mono text-cyan-400 uppercase tracking-wider">Corporate Vision Statement</label>
            <textarea
              rows={4}
              className="w-full bg-black/80 border border-cyan-500/10 text-white rounded-xl p-3 text-xs focus:outline-[#22d3ee]/25 font-sans leading-relaxed text-slate-300"
              value={aboutData.vision}
              onChange={(e) => setAboutData({ ...aboutData, vision: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Social Media Link Handles */}
        <div className="border-t border-cyan-500/5 pt-4 space-y-4">
          <h4 className="text-3xs font-mono font-extrabold uppercase tracking-wide text-white">
            Social Connection Infrastructure
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-3xs font-mono text-slate-500 uppercase">GitHub Profile URL</label>
              <input
                type="url"
                className="w-full bg-black/80 border border-cyan-500/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500/25 font-mono"
                value={aboutData.socialGithub}
                onChange={(e) => setAboutData({ ...aboutData, socialGithub: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-3xs font-mono text-slate-500 uppercase">LinkedIn Profile URL</label>
              <input
                type="url"
                className="w-full bg-black/80 border border-cyan-500/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500/25 font-mono"
                value={aboutData.socialLinkedin}
                onChange={(e) => setAboutData({ ...aboutData, socialLinkedin: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-3xs font-mono text-slate-500 uppercase">Twitter Profile URL</label>
              <input
                type="url"
                className="w-full bg-black/80 border border-cyan-500/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500/25 font-mono"
                value={aboutData.socialTwitter}
                onChange={(e) => setAboutData({ ...aboutData, socialTwitter: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-3xs font-mono text-slate-500 uppercase">YouTube Channel URL</label>
              <input
                type="url"
                className="w-full bg-black/80 border border-cyan-500/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500/25 font-mono"
                value={aboutData.socialYoutube}
                onChange={(e) => setAboutData({ ...aboutData, socialYoutube: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Directorship / Co-founders dynamic blocks */}
        <div className="border-t border-cyan-500/5 pt-4 space-y-4">
          <div className="flex justify-between items-center bg-cyan-950/25 border border-cyan-500/15 p-3 rounded-xl">
            <span className="text-3xs font-mono text-cyan-400 uppercase font-black tracking-widest block font-bold">Board of Directors & Co-Founders ({aboutData.founders.length})</span>
            <span className="text-3xs font-mono bg-black/40 px-2 py-0.5 rounded text-slate-400">Locked Seats</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {aboutData.founders.map((founder, fIdx) => (
              <div key={fIdx} className="p-4 bg-black/40 border border-cyan-500/5 hover:border-cyan-500/15 rounded-xl space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/5 border border-cyan-500/15 text-cyan-400 text-3xs font-mono font-bold flex items-center justify-center">
                    #{fIdx + 1}
                  </span>
                  <span className="text-xs font-black text-white uppercase tracking-wider">{founder.name}</span>
                </div>

                <div className="space-y-2 text-xs text-left">
                  <div>
                    <label className="block text-4xs font-mono text-cyan-500 uppercase mb-0.5">Corporate Sitting Role</label>
                    <input
                      type="text"
                      className="w-full bg-[#111] border border-cyan-500/5 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500/20"
                      value={founder.role}
                      onChange={(e) => handleFounderChange(fIdx, 'role', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-4xs font-mono text-cyan-500 uppercase mb-0.5">Professional Bio & Directorship Notes</label>
                    <textarea
                      rows={4}
                      className="w-full bg-[#111] border border-cyan-500/5 text-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500/20 font-sans leading-relaxed"
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

        <div className="pt-3 border-t border-cyan-500/10 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-mono font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            {saving ? 'Synchronizing database...' : '✓ Commit Corporate Changes'}
          </button>
        </div>

      </form>

    </div>
  );
}
