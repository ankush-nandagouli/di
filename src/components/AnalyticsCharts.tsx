import React, { useState } from 'react';
import { TrendingUp, Award, Users, BookOpen } from 'lucide-react';

interface MetricChartProps {
  title: string;
  data: { label: string; value: number }[];
  type?: 'bar' | 'line';
  color?: string;
  icon?: React.ReactNode;
}

export default function AnalyticsCharts({ title, data, type = 'bar', color = 'cyan', icon }: MetricChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value), 10) : 100;
  
  // Plotting dimensions
  const chartHeight = 160;
  const padding = 30;
  const graphWidth = 400;

  return (
    <div className="bg-[#050505]/60 border border-cyan-500/10 rounded-2xl p-5 backdrop-blur-md hover:border-cyan-500/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.05)] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 tracking-wider flex items-center gap-2">
          {icon} {title}
        </h3>
        <span className="text-2xs font-mono text-cyan-400/70 border border-cyan-500/10 px-2 py-0.5 rounded-full">
          Live Data
        </span>
      </div>

      <div className="relative w-full overflow-hidden">
        {type === 'bar' ? (
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
                    <span className="text-slate-400 group-hover:text-cyan-300 transition-colors">
                      {item.label}
                    </span>
                    <span className="text-white font-semibold">
                      {item.value} {item.value > 10 ? 'pts' : 'reqs'}
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-[#111]/80 rounded-full overflow-hidden border border-slate-500/5">
                    <div 
                      className={`h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000`}
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
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={20} x2={graphWidth - 10} y2={20} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1={padding} y1={chartHeight / 2} x2={graphWidth - 10} y2={chartHeight / 2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1={padding} y1={chartHeight - 30} x2={graphWidth - 10} y2={chartHeight - 30} stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />

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
                    <path d={pathD} fill="none" stroke="url(#lineColor)" strokeWidth="3" className="drop-shadow-[0_2px_8px_rgba(34,211,238,0.3)]" />

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
                          fill={hoveredIndex === i ? '#ffffff' : '#06b6d4'} 
                          stroke="#050505" 
                          strokeWidth="2" 
                          className="transition-all"
                        />
                        {/* Text labels on X Axis */}
                        <text 
                          x={pt.x} 
                          y={chartHeight - 10} 
                          textAnchor="middle" 
                          fill="rgba(255,255,255,0.4)" 
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
                              fill="#0f172a" 
                              stroke="#06b6d4" 
                              strokeWidth="1" 
                            />
                            <text 
                              x={pt.x} 
                              y={pt.y - 19} 
                              textAnchor="middle" 
                              fill="#ffffff" 
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
