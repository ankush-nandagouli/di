import React from 'react';
import { Award, Trophy, Users, Star, ArrowUpRight, TrendingUp } from 'lucide-react';
import { StudentGroup, StudentUser } from '../types';

interface LeaderboardProps {
  groups: StudentGroup[];
  students: StudentUser[];
}

export default function Leaderboard({ groups, students }: LeaderboardProps) {
  // Sort groups by points descending
  const rankedGroups = [...groups].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-left">
      
      {/* 1. Header Hero Panel */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/10 bg-[#050505]/85 p-5 sm:p-6 backdrop-blur-md">
        <div className="absolute top-0 right-0 h-full w-48 bg-radial from-cyan-500/10 to-transparent blur-xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-3xs font-mono tracking-widest text-[#22d3ee] uppercase">Global Innovation Ranks</span>
            <h2 className="text-lg md:text-xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cyan-400" /> Platform Leaderboard
            </h2>
            <p className="text-xs text-slate-400 font-sans max-w-lg">
              Live standings of all active student project teams representing schools and colleges in Balaghat. Rated based on hardware assembly, design complexity, and code execution.
            </p>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-2xs text-[#22d3ee] border border-cyan-500/15 bg-cyan-950/40 px-3.5 py-1.5 rounded-full select-none">
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
            1: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
            2: 'text-slate-350 border-slate-400/20 bg-slate-400/5',
            3: 'text-amber-600 border-amber-700/20 bg-amber-700/5'
          }[rank] || 'text-slate-500 border-slate-500/10 bg-[#111]/30';

          return (
            <div 
              key={gp.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#050505]/70 hover:shadow-[0_0_20px_rgba(34,211,238,0.04)] ${
                rank === 1 ? 'border-amber-500/15' : 'border-cyan-500/10'
              }`}
            >
              {/* Leaderboard glow on rank 1 */}
              {rank === 1 && (
                <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 blur-2xl rounded-full pointer-events-none" />
              )}

              {/* Identity Segment */}
              <div className="flex items-center gap-4 text-left">
                {/* Placing Rank Medals */}
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center font-mono text-sm font-extrabold select-none shrink-0 ${medalColor}`}>
                  {rank <= 3 ? <Trophy className="w-5 h-5" /> : `#${rank}`}
                </div>

                <div className="space-y-0.5">
                  <span className="text-3xs font-mono uppercase tracking-widest text-slate-500">Team: {gp.name}</span>
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase font-sans">
                    {gp.projectTitle}
                  </h3>
                  <p className="text-2xs text-slate-400 font-sans max-w-md">
                    {gp.projectDescription}
                  </p>
                  <p className="text-3xs font-mono text-cyan-400/70 pt-0.5">
                    {memberNames}
                  </p>
                </div>
              </div>

              {/* Scoring Segment */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0 border-cyan-500/5 font-mono text-xs">
                <span className="text-3xs text-slate-500 uppercase tracking-wider block sm:hidden">SCORE POINTS</span>
                <div className="text-right">
                  <span className="text-base font-black text-[#22d3ee] font-mono tracking-wide">
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
