import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, CheckCircle2, AlertTriangle, Printer, Award, ShieldCheck, Heart } from 'lucide-react';
import { Certificate } from '../types';
import { DakshyamDatabase } from '../utils/db';

export default function CertificateVerify() {
  const [code, setCode] = useState('');
  const [queriedCode, setQueriedCode] = useState('');
  const [foundCertificate, setFoundCertificate] = useState<Certificate | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setSearched(false);
    
    const formattedCode = code.trim().toUpperCase();
    if (!formattedCode) {
      setErrorText('Please enter a verification code.');
      return;
    }

    try {
      const certificates = DakshyamDatabase.getCertificates();
      const match = certificates.find(cert => cert.id.toUpperCase() === formattedCode);
      
      setQueriedCode(formattedCode);
      setSearched(true);
      if (match) {
        setFoundCertificate(match);
      } else {
        setFoundCertificate(null);
      }
    } catch {
      setErrorText('Error matching credentials against records.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-2">
      {/* Search Bar Block */}
      <div className="bg-[#050505]/70 border border-cyan-500/10 rounded-2xl p-6 backdrop-blur-md">
        <h2 className="text-base sm:text-lg font-bold text-white tracking-wide mb-1 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" /> Secure Credential Certification
        </h2>
        <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
          Verify digital credentials issued by Dakshyam Innovations. Students can download or print their secured certification cards.
        </p>

        <form onSubmit={handleVerify} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter Code (e.g., DKM-2026-E49A)"
              className="w-full bg-[#111]/80 border border-cyan-500/10 text-white rounded-xl py-3 pl-11 pr-4 text-xs md:text-sm focus:outline-none focus:border-cyan-450 placeholder-slate-500 font-mono tracking-wider uppercase font-medium"
            />
          </div>
          <button
            type="submit"
            className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 hover:border-cyan-400/40 text-xs font-semibold px-5 py-3 rounded-xl cursor-pointer transition-all active:scale-95"
          >
            Verify Node
          </button>
        </form>

        {errorText && (
          <p className="text-xs text-red-400 mt-2 text-center font-mono">
            ⚠ {errorText}
          </p>
        )}
      </div>

      {/* Verification Output */}
      <AnimatePresence mode="wait">
        {searched && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {foundCertificate ? (
              <div className="space-y-4">
                {/* Print Ready Certificate Frame */}
                <div className="relative p-6 sm:p-10 rounded-2xl bg-gradient-to-br from-[#0c1a1e] to-black border-2 border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.1)] print:border-2 print:border-black print:text-black print:bg-white print:shadow-none pointer-events-auto select-none overflow-hidden text-center flex flex-col items-center">
                  
                  {/* Decorative Watermark background for premium printable layout */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none print:opacity-[0.05]">
                    <Award className="w-96 h-96" />
                  </div>

                  {/* Corner Accent Triangles */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400/30 print:hidden" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/30 print:hidden" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/30 print:hidden" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400/30 print:hidden" />

                  {/* Issuer details */}
                  <div className="mb-4 flex flex-col items-center">
                    {foundCertificate.customLogoUrl ? (
                      <div className="mb-2">
                        <img src={foundCertificate.customLogoUrl} alt="DAKSHYAM INNOVATION" className="h-16 max-w-64 object-contain print:invert-0" />
                      </div>
                    ) : (
                      <div className="inline-block p-1 bg-cyan-500/10 rounded-lg mb-1.5 print:hidden">
                        <Award className="w-8 h-8 text-cyan-400" />
                      </div>
                    )}
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-widest text-[#ffffff] print:text-black uppercase font-sans">
                      DAKSHYAM INNOVATION
                    </h2>
                    <h3 className="text-[10px] tracking-widest font-mono text-slate-500 uppercase mt-0.5 print:text-slate-600">
                      CREDENTIAL CERTIFICATION PROTOCOL
                    </h3>
                  </div>

                  {/* Training Partner Info inside Header if present */}
                  {foundCertificate.trainingPartnerName && (
                    <div className="text-[9px] uppercase tracking-wider font-mono text-cyan-400/80 mb-3 bg-cyan-950/20 px-2.5 py-1 rounded-md border border-cyan-500/10 inline-flex items-center gap-1.5 print:border-slate-300 print:text-black">
                      {foundCertificate.trainingPartnerLogoUrl && (
                        <img src={foundCertificate.trainingPartnerLogoUrl} className="w-5 h-5 object-contain rounded" alt="Partner Logo" />
                      )}
                      <span>In Partnership With: <strong>{foundCertificate.trainingPartnerName}</strong></span>
                    </div>
                  )}

                  {/* Big Seal Award */}
                  <div className="my-3">
                    {foundCertificate.customSealUrl ? (
                      <img src={foundCertificate.customSealUrl} alt="Certification Seal" className="w-16 h-16 object-contain mx-auto" />
                    ) : (
                      <div className="text-cyan-400/90 print:text-black">
                        <Award className="w-14 h-14" />
                      </div>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black font-sans tracking-wide text-white print:text-black mt-2">
                    CERTIFICATE OF MERIT
                  </h1>
                  <p className="text-2xs sm:text-xs font-mono text-slate-500 uppercase tracking-widest mt-1 print:text-slate-650">
                    Sovereign Hardware Telemetry & Web Integration Systems
                  </p>

                  <div className="w-48 h-[1px] bg-cyan-500/15 my-4 print:bg-slate-300" />

                  <p className="text-xs text-slate-300 print:text-slate-700 italic max-w-sm font-light">
                    This document certifies that
                  </p>

                  <h2 className="text-lg sm:text-xl font-extrabold text-cyan-300 font-sans tracking-wide my-1.5 uppercase print:text-black">
                    {foundCertificate.studentName}
                  </h2>

                  <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed max-w-md font-light px-2">
                    has successfully completed the specialized industry-oriented curriculum and physical laboratory training program, presenting the capstone development:
                    <strong className="block text-[#ffffff] font-semibold text-xs sm:text-sm tracking-wide mt-2 print:text-black italic">
                      "{foundCertificate.projectTitle}"
                    </strong>
                    as part of their certification in <strong className="text-cyan-300 font-medium print:text-black">{foundCertificate.courseTitle}</strong>.
                  </p>

                  <div className="w-full grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-cyan-500/10 print:border-slate-300">
                    <div className="text-left font-mono">
                      <span className="text-[9px] text-slate-500 block uppercase">Verification Code</span>
                      <span className="text-xs text-cyan-400 font-bold print:text-black tracking-wide">
                        {foundCertificate.id}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-[9px] text-slate-500 block uppercase">Issue Node Date</span>
                      <span className="text-xs text-slate-300 print:text-black">
                        {foundCertificate.issueDate}
                      </span>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="w-full flex items-center justify-between mt-6 pt-4 border-t border-cyan-500/5 print:border-slate-200 font-mono">
                    <div className="text-left">
                      <span className="text-2xs text-slate-400 block">{foundCertificate.trainerName}</span>
                      <span className="text-4xs text-slate-500 tracking-wider block uppercase mt-0.5">Assigned Lead Trainer</span>
                    </div>

                    <div className="text-right">
                      <span className="text-2xs text-[#22d3ee] font-bold block">DAKSHYAM INNOVATION</span>
                      <span className="text-4xs text-slate-500 tracking-wider block uppercase mt-0.5">Authorizing Institute</span>
                    </div>
                  </div>

                </div>

                {/* Print Control Bar */}
                <div className="flex items-center justify-between px-2 print:hidden">
                  <div className="flex items-center gap-1.5 text-xs text-cyan-400">
                    <CheckCircle2 className="w-4 h-4" /> Code verified against live directory registry of 2026.
                  </div>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer hover:shadow-[0_0_12px_rgba(34,211,238,0.2)] transition-all"
                  >
                    <Printer className="w-4 h-4" /> Print / Export PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto animate-bounce" />
                <h3 className="text-white font-bold text-base">Invalid Verification Code Passed</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  Code "{queriedCode}" could not be matched with any secure records. Ensure there are no spacing or characters errors.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
