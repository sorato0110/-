import React, { useMemo } from 'react';
import { Idea, ZoneType } from '../types';
import { ZONES } from '../constants';

interface IdeaMatrixProps {
  items: Idea[];
  onItemClick?: (id: string) => void;
}

export const IdeaMatrix: React.FC<IdeaMatrixProps> = ({ items, onItemClick }) => {
  
  // Calculate grid lines
  const gridLines = [1, 2, 3, 4, 5];

  // Helper to get position percentage (1-5 scale to 10%-90% range to avoid edge clipping)
  const getPos = (val: number) => {
    // Map 1..5 to 10..90
    return 10 + ((val - 1) * 20); 
  };

  return (
    <div className="w-full aspect-square max-w-lg mx-auto relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden select-none">
      {/* Background Zones */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-30 pointer-events-none">
        {/* Top Left: High Impact, Low Cost (Quick Wins) - using simplified quadrant logic for background visual */}
        <div className="bg-emerald-100 border-r border-b border-dashed border-slate-300"></div>
        {/* Top Right: High Impact, High Cost (Major) */}
        <div className="bg-blue-100 border-b border-dashed border-slate-300"></div>
        {/* Bottom Left: Low Impact, Low Cost (Fill-ins) */}
        <div className="bg-amber-100 border-r border-dashed border-slate-300"></div>
        {/* Bottom Right: Low Impact, High Cost (Ignore) */}
        <div className="bg-slate-100"></div>
      </div>

      {/* Grid Lines & Labels */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" width="100%" height="100%">
        {/* Axis Labels */}
        <text x="50%" y="98%" textAnchor="middle" className="text-[10px] fill-slate-400 uppercase tracking-widest">Cost (Low → High)</text>
        <text x="2%" y="50%" textAnchor="middle" transform="rotate(-90, 10, 50%)" className="text-[10px] fill-slate-400 uppercase tracking-widest" style={{ transformBox: 'fill-box' }}>Impact (Low → High)</text>
      </svg>

      {/* Data Points */}
      <div className="absolute inset-4">
        {items.map((idea) => {
          // Impact is Y axis (Up is high). So 5 is 0% from top, 1 is 100% from top.
          // Actually, let's map directly: Impact 5 = Top (0% + padding), Impact 1 = Bottom (100% - padding)
          // Using bottom positioning makes Impact 1 = 10%, Impact 5 = 90%
          const bottomPct = getPos(idea.impact);
          const leftPct = getPos(idea.cost);
          
          const zoneConfig = ZONES[idea.zone];

          return (
            <div
              key={idea.id}
              onClick={() => onItemClick?.(idea.id)}
              className="absolute group cursor-pointer transition-all duration-300 hover:z-50"
              style={{
                bottom: `${bottomPct}%`,
                left: `${leftPct}%`,
                transform: 'translate(-50%, 50%)' // Center the dot
              }}
            >
              {/* Dot */}
              <div className={`w-4 h-4 rounded-full shadow-sm border-2 border-white ${zoneConfig.activeClass.split(' ')[0]} transition-transform group-hover:scale-125`}></div>
              
              {/* Label - Clamped to prevent overflow using transforms and max-width */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 min-w-[80px] w-max max-w-[120px] pointer-events-none z-10"
              >
                <div className={`
                  px-2 py-1 text-[10px] font-medium rounded shadow-sm backdrop-blur-sm bg-white/90 border border-slate-200 text-center truncate
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  md:opacity-100 md:bg-transparent md:border-0 md:shadow-none md:font-semibold md:text-slate-700 md:text-xs
                `}>
                  {idea.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};