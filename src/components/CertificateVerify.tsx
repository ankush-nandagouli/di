import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, CheckCircle2, AlertTriangle, Printer, Award, ShieldCheck, Heart } from 'lucide-react';
import { Certificate } from '../types';
import { DakshyamDatabase } from '../utils/db';
import OfficialCertificate from './OfficialCertificate';

interface CertificateVerifyProps {
  theme?: 'light' | 'dark';
}

export default function CertificateVerify({ theme = 'dark' }: CertificateVerifyProps) {
  const isLight = theme === 'light';
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
    <div className="space-y-6 max-w-4xl mx-auto px-2">
      {/* Search Bar Block */}
      <div className={`border rounded-2xl p-6 backdrop-blur-md transition-all ${
        isLight ? 'bg-white border-blue-900/15 text-slate-800 shadow-sm' : 'bg-[#0a192f]/70 border-blue-800/30 text-white'
      }`}>
        <h2 className={`text-base sm:text-lg font-bold tracking-wide mb-1 flex items-center gap-2 ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          <ShieldCheck className={`w-5 h-5 ${isLight ? 'text-blue-950' : 'text-sky-400'}`} /> Secure Credential Certification
        </h2>
        <p className={`text-xs mb-4 font-sans leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
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
              className={`w-full py-3 pl-11 pr-4 text-xs md:text-sm focus:outline-none placeholder-slate-500 font-mono tracking-wider uppercase font-medium rounded-xl border transition-all ${
                isLight 
                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-950' 
                  : 'bg-[#071326] border-blue-900/40 text-white focus:border-sky-400'
              }`}
            />
          </div>
          <button
            type="submit"
            className={`text-xs font-semibold px-5 py-3 rounded-xl cursor-pointer transition-all active:scale-95 border ${
              isLight 
                ? 'bg-blue-950 border-blue-900 text-white hover:bg-blue-900' 
                : 'bg-white text-[#0a192f] hover:bg-slate-100 border-white font-bold'
            }`}
          >
            Verify Node
          </button>
        </form>

        {errorText && (
          <p className="text-xs text-red-500 mt-2 text-center font-mono">
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
                <OfficialCertificate 
                  certificate={foundCertificate}
                  showControls={true}
                  theme={theme}
                />
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
