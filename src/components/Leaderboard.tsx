import React from 'react';
import { Award, Trophy, Users, Star, ArrowUpRight, TrendingUp } from 'lucide-react';
import { StudentGroup, StudentUser } from '../types';

interface LeaderboardProps {
  groups: StudentGroup[];
  students: StudentUser[];
  theme?: 'light' | 'dark';
}

export default function Leaderboard({ groups, students, theme = 'dark' }: LeaderboardProps) {
  const isLight = theme === 'light';
  // Sort groups by points descending
  const rankedGroups = [...groups].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-left">
      
      {/* 1. Header Hero Panel */}
      <div className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 backdrop-blur-md transition-all duration-300 ${
        isLight ? 'bg-white border-blue-900/15 shadow-sm text-slate-800' : 'bg-[#0a192f]/85 border-blue-800/40 text-white'
      }`}>
        <div className={`absolute top-0 right-0 h-full w-48 bg-radial blur-xl pointer-events-none ${
          isLight ? 'from-blue-900/5 to-transparent' : 'from-blue-600/10 to-transparent'
        }`} />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className={`text-3xs font-mono tracking-widest uppercase font-bold ${
              isLight ? 'text-blue-950' : 'text-sky-400'
            }`}>
              Global Innovation Ranks
            </span>
            <h2 className={`text-lg md:text-xl font-black tracking-wide uppercase flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Trophy className={`w-5 h-5 ${isLight ? 'text-blue-950' : 'text-sky-400'}`} /> Platform Leaderboard
            </h2>
            <p className={`text-xs font-sans max-w-lg ${
              isLight ? 'text-slate-650' : 'text-slate-400'
            }`}>
              Live standings of all active student project teams representing schools and colleges in Balaghat. Rated based on hardware assembly, design complexity, and code execution.
            </p>
          </div>

          <div className={`flex items-center gap-1.5 font-mono text-2xs px-3.5 py-1.5 rounded-full select-none border ${
            isLight 
              ? 'text-blue-950 border-blue-900/20 bg-blue-50' 
              : 'text-sky-300 border-blue-700/40 bg-blue-950/60'
          }`}>
            <TrendingUp className="w-3.5 h-3.5" /> Calculated live
          </div>
        </div>
      </div>

      {/* Ranks Cards List */}
      <div className="space-y-3">
        {rankedGroups.map((gp, index) => {
          const rank = index + 1;
          
          // Get member names
          const memberNames = students
              .filter(s => gp.memberIds.includes(s.id))
              .map(s => s.name)
              .join(', ');

          // Rank styling accents
          const medalColor = {
            1: isLight ? 'text-blue-950 border-blue-900/35 bg-blue-50' : 'text-white border-blue-400/50 bg-blue-900/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
            2: isLight ? 'text-slate-700 border-slate-400/35 bg-slate-100' : 'text-slate-200 border-slate-500/30 bg-slate-800/40',
            3: isLight ? 'text-blue-900 border-blue-800/30 bg-blue-50/50' : 'text-sky-300 border-blue-700/30 bg-blue-950/40'
          }[rank] || (isLight ? 'text-slate-600 border-slate-200 bg-slate-50' : 'text-slate-400 border-blue-900/20 bg-[#0c1e3a]/30');

          return (
            <div 
              key={gp.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isLight 
                  ? 'bg-white border-slate-200 hover:shadow-md' 
                  : 'bg-[#0a192f]/70 border-blue-800/30 hover:border-blue-700/60 hover:shadow-[0_0_20px_rgba(30,58,138,0.15)]'
              } ${
                rank === 1 ? (isLight ? 'border-blue-900/30 shadow-sm' : 'border-blue-600/40') : ''
              }`}
            >
              {/* Leaderboard glow on rank 1 */}
              {rank === 1 && (
                <div className={`absolute top-0 right-0 h-16 w-16 blur-2xl rounded-full pointer-events-none ${
                  isLight ? 'bg-blue-900/5' : 'bg-blue-600/10'
                }`} />
              )}

              {/* Identity Segment */}
              <div className="flex items-center gap-4 text-left">
                {/* Placing Rank Medals */}
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center font-mono text-sm font-extrabold select-none shrink-0 ${medalColor}`}>
                  {rank <= 3 ? <Trophy className="w-5 h-5" /> : `#${rank}`}
                </div>

                <div className="space-y-0.5">
                  <span className={`text-3xs font-mono uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Team: {gp.name}</span>
                  <h3 className={`text-sm font-bold tracking-wide uppercase font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {gp.projectTitle}
                  </h3>
                  <p className={`text-2xs font-sans max-w-md ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {gp.projectDescription}
                  </p>
                  <p className={`text-3xs font-mono pt-0.5 ${isLight ? 'text-blue-900' : 'text-sky-300/80'}`}>
                    {memberNames}
                  </p>
                </div>
              </div>

              {/* Scoring Segment */}
              <div className={`flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0 font-mono text-xs ${
                isLight ? 'border-slate-100' : 'border-blue-900/30'
              }`}>
                <span className="text-3xs text-slate-500 uppercase tracking-wider block sm:hidden">SCORE POINTS</span>
                <div className="text-right">
                  <span className={`text-base font-black font-mono tracking-wide ${
                    isLight ? 'text-blue-950' : 'text-sky-300'
                  }`}>
                    {gp.points} PTS
                  </span>
                  <span className="text-5xs text-slate-500 tracking-widest uppercase block mt-0.5">
                    Rating 2026 Season
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
