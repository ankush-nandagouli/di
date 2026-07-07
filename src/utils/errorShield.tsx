import React from 'react';
import { ShieldAlert } from 'lucide-react';

export interface ShieldedError {
  code: string;
  title: string;
  message: string;
  isActionable: boolean;
  actionText?: string;
}

export function shieldError(rawError: string): ShieldedError {
  if (!rawError) {
    return {
      code: 'ERR-000',
      title: 'Unknown State Anomalous',
      message: 'The system encountered an unclassified operational anomaly.',
      isActionable: false
    };
  }

  const errLower = rawError.toLowerCase();

  if (errLower.includes('lockout') || errLower.includes('locked') || errLower.includes('too many attempts') || errLower.includes('blocked')) {
    return {
      code: 'ERR-429',
      title: 'Security Cooldown Engaged',
      message: 'Access is temporarily throttled to defend against automated enumeration. Please hold for a brief duration before retry.',
      isActionable: true,
      actionText: 'Retry in 5 minutes'
    };
  }

  if (errLower.includes('safe') || errLower.includes('character') || errLower.includes('malicious') || errLower.includes('injection') || errLower.includes('threat')) {
    return {
      code: 'ERR-403',
      title: 'Input Integrity Warning',
      message: 'The security filters flagged anomalous characters in the submission payload. Ensure clean alphabetic/numeric input.',
      isActionable: false
    };
  }

  if (errLower.includes('duplicate') || errLower.includes('already registered') || errLower.includes('already submitted')) {
    return {
      code: 'ERR-409',
      title: 'Data Record Conflict',
      message: 'The supplied credential details or emails already correspond to an active candidate or trainer record in our nodes.',
      isActionable: true,
      actionText: 'Use alternate email'
    };
  }

  if (errLower.includes('pending') || errLower.includes('restricted') || errLower.includes('approval')) {
    return {
      code: 'ERR-401',
      title: 'Awaiting Authorization',
      message: 'Your profile has been recorded but is currently in the verification queue. Dakshyam administrative leads must approve before portal login.',
      isActionable: false
    };
  }

  if (errLower.includes('incorrect') || errLower.includes('failed') || errLower.includes('invalid') || errLower.includes('unauthorized')) {
    return {
      code: 'ERR-400',
      title: 'Access Credentials Mismatch',
      message: 'The email address or security passcode provided did not match any verified credentials in the node catalog.',
      isActionable: true,
      actionText: 'Verify login details'
    };
  }

  if (errLower.includes('email structure') || errLower.includes('invalid email') || errLower.includes('email format')) {
    return {
      code: 'ERR-422',
      title: 'Format Syntax Anomaly',
      message: 'The provided electronic mail address does not conform to standard RFC security formats.',
      isActionable: true,
      actionText: 'Correct email format'
    };
  }

  if (errLower.includes('10 digits') || errLower.includes('phone') || errLower.includes('mobile') || errLower.includes('contact')) {
    return {
      code: 'ERR-423',
      title: 'Payload Range Breach',
      message: 'The telephonic reference code supplied does not match standard geographic constraints (exactly 10 digits required).',
      isActionable: true,
      actionText: 'Check digits count'
    };
  }

  if (errLower.includes('required') || errLower.includes('mandatory') || errLower.includes('fill') || errLower.includes('empty')) {
    return {
      code: 'ERR-411',
      title: 'Mandatory Parameters Void',
      message: 'One or more required diagnostic fields have been left blank or contain invalid null configurations.',
      isActionable: true,
      actionText: 'Fill missing fields'
    };
  }

  if (errLower.includes('timeout') || errLower.includes('database') || errLower.includes('transaction') || errLower.includes('abort') || errLower.includes('lag')) {
    return {
      code: 'ERR-500',
      title: 'Persistence Engine Timeout',
      message: 'The local database storage index encountered a write transaction delay. Your changes have been queued.',
      isActionable: false
    };
  }

  // Fallback beautiful error
  return {
    code: 'ERR-999',
    title: 'System Operational Conflict',
    message: rawError.length > 80 ? rawError.substring(0, 80) + '...' : rawError,
    isActionable: false
  };
}

export function BeautifulErrorDisplay({ errorText, isLight = false }: { errorText: string; isLight?: boolean }) {
  if (!errorText) return null;
  const shielded = shieldError(errorText);

  // If it is an admin/trainer notification message (and has direct checkmark), render as-is without shielding.
  if (errorText.includes('✓')) {
    return (
      <div className={`text-[10px] font-mono p-2.5 rounded-xl border leading-relaxed text-center text-emerald-600 border-emerald-500/20 bg-emerald-50 font-bold`}>
        {errorText}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all duration-300 ${
      isLight 
        ? 'bg-amber-500/5 border-amber-500/15 text-slate-800' 
        : 'bg-red-500/5 border-red-500/15 text-slate-200'
    }`}>
      <div className={`p-2 rounded-xl shrink-0 ${
        isLight ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-red-950/50 text-red-400 animate-pulse'
      }`}>
        <ShieldAlert className="w-5 h-5" />
      </div>
      <div className="space-y-1 select-none flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md uppercase font-bold tracking-wider ${
            isLight ? 'bg-amber-200 text-amber-950' : 'bg-red-950 text-red-400'
          }`}>
            {shielded.code}
          </span>
          <span className="text-2xs font-mono font-extrabold uppercase tracking-tight">
            {shielded.title}
          </span>
        </div>
        <p className={`text-[10px] font-sans leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {shielded.message}
        </p>
        {shielded.isActionable && shielded.actionText && (
          <div className="pt-1 flex items-center gap-1.5 text-[9px] font-mono text-cyan-400/80">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Recommended action: {shielded.actionText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
