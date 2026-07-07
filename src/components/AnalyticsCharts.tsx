import React, { useState } from 'react';
import { TrendingUp, Award, Users, BookOpen } from 'lucide-react';

interface MetricChartProps {
  title: string;
  data: { label: string; value: number }[];
  type?: 'bar' | 'line';
  color?: string;
  icon?: React.ReactNode;
  theme?: 'light' | 'dark';
}

export default function AnalyticsCharts({ title, data, type = 'bar', color = 'cyan', icon, theme = 'dark' }: MetricChartProps) {
  const isLight = theme === 'light';
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value), 10) : 100;
  
  // Plotting dimensions
  const chartHeight = 160;
  const padding = 30;
  const graphWidth = 400;

  return (
    <div className={`border rounded-2xl p-5 transition-all duration-300 ${
      isLight 
        ? 'bg-slate-50/55 border-slate-200 hover:border-amber-500/15' 
        : 'bg-[#050505]/60 border border-cyan-500/10 hover:border-cyan-500/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.05)]'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold tracking-wider flex items-center gap-2 ${
          isLight ? 'text-slate-800' : 'text-slate-300'
        }`}>
          {icon && React.cloneElement(icon as React.ReactElement, { className: `w-4 h-4 ${isLight ? 'text-amber-700' : 'text-cyan-400'}` })} {title}
        </h3>
        <span className={`text-2xs font-mono border px-2 py-0.5 rounded-full ${
          isLight ? 'text-amber-700/80 border-amber-500/20 bg-amber-500/5' : 'text-cyan-400/70 border border-cyan-500/10'
        }`}>
          Live Data
        </span>
      </div>

      <div className="relative w-full overflow-hidden">
        {data.length === 0 ? (
          <div className={`py-10 text-center font-mono text-3xs uppercase tracking-wider ${
            isLight ? 'text-slate-400 bg-slate-100/30' : 'text-slate-500 bg-[#111]/20'
          } rounded-xl border border-dashed ${isLight ? 'border-slate-200' : 'border-cyan-500/5'}`}>
            No live telemetry recorded yet
          </div>
        ) : type === 'bar' ? (
          <div className="flex flex-col gap-2.5 pt-2">
            {data.map((item, idx) => {
              const percentage = Math.min(100, (item.value / maxValue) * 100);
              return (
                <div 
                  key={idx} 
                  className="space-y-1 group"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`transition-colors ${
                      isLight ? 'text-slate-650 group-hover:text-amber-850' : 'text-slate-400 group-hover:text-cyan-300'
                    }`}>
                      {item.label}
                    </span>
                    <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {item.value} {item.value > 10 ? 'pts' : 'reqs'}
                    </span>
                  </div>
                  <div className={`relative h-2 w-full rounded-full overflow-hidden border ${
                    isLight ? 'bg-slate-200 border-slate-300/40' : 'bg-[#111]/80 border-slate-500/5'
                  }`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${
                        isLight ? 'from-amber-600 to-amber-500' : 'from-cyan-500 to-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                    {hoveredIndex === idx && (
                      <div className="absolute inset-0 bg-white/10 animate-[pulse_1.5s_infinite]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="pt-2">
            {/* SVG Interactive Line Chart */}
            <svg 
              viewBox={`0 0 ${graphWidth} ${chartHeight}`} 
              className="w-full h-auto overflow-visible"
            >
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isLight ? "#d97706" : "#06b6d4"} stopOpacity={isLight ? "0.15" : "0.25"} />
                  <stop offset="100%" stopColor={isLight ? "#d97706" : "#06b6d4"} stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={isLight ? "#b45309" : "#06b6d4"} />
                  <stop offset="100%" stopColor={isLight ? "#d97706" : "#3b82f6"} />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={20} x2={graphWidth - 10} y2={20} stroke={isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)"} strokeWidth="1" />
              <line x1={padding} y1={chartHeight / 2} x2={graphWidth - 10} y2={chartHeight / 2} stroke={isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)"} strokeWidth="1" />
              <line x1={padding} y1={chartHeight - 30} x2={graphWidth - 10} y2={chartHeight - 30} stroke={isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)"} strokeWidth="1.5" />

              {/* Path calculation */}
              {(() => {
                if (data.length === 0) return null;
                const points = data.map((item, idx) => {
                  const x = padding + (idx * (graphWidth - padding - 20)) / (data.length - 1 || 1);
                  const y = chartHeight - 30 - ((item.value / maxValue) * (chartHeight - 50));
                  return { x, y, label: item.label, value: item.value };
                });

                const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - 30} L ${points[0].x} ${chartHeight - 30} Z`;

                return (
                  <>
                    {/* Area under line */}
                    <path d={areaD} fill="url(#chartGlow)" />
                    {/* Main gradient line */}
                    <path d={pathD} fill="none" stroke="url(#lineColor)" strokeWidth="3" className={isLight ? "" : "drop-shadow-[0_2px_8px_rgba(34,211,238,0.3)]"} />

                    {/* Nodes interactive */}
                    {points.map((pt, i) => (
                      <g 
                        key={i}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="cursor-pointer"
                      >
                        <circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r={hoveredIndex === i ? 6 : 4} 
                          fill={hoveredIndex === i ? (isLight ? '#78350f' : '#ffffff') : (isLight ? '#d97706' : '#06b6d4')} 
                          stroke={isLight ? '#ffffff' : '#050505'} 
                          strokeWidth="2" 
                          className="transition-all"
                        />
                        {/* Text labels on X Axis */}
                        <text 
                          x={pt.x} 
                          y={chartHeight - 10} 
                          textAnchor="middle" 
                          fill={isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)"} 
                          fontSize="9" 
                          className="font-mono"
                        >
                          {pt.label}
                        </text>

                        {/* Tooltip on hover */}
                        {hoveredIndex === i && (
                          <g xmlSpace="preserve">
                            <rect 
                              x={pt.x - 22} 
                              y={pt.y - 32} 
                              width="44" 
                              height="20" 
                              rx="5" 
                              fill={isLight ? "#fef3c7" : "#0f172a"} 
                              stroke={isLight ? "#d97706" : "#06b6d4"} 
                              strokeWidth="1" 
                            />
                            <text 
                              x={pt.x} 
                              y={pt.y - 19} 
                              textAnchor="middle" 
                              fill={isLight ? "#78350f" : "#ffffff"} 
                              fontSize="9.5" 
                              fontWeight="bold"
                              className="font-mono"
                            >
                              {pt.value}
                            </text>
                          </g>
                        )}
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
