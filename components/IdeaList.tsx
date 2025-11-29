import React from 'react';
import { Idea } from '../types';
import { ZONES } from '../constants';
import { Trash2, FlaskConical } from 'lucide-react';

interface IdeaListProps {
  items: Idea[];
  onDelete: (id: string) => void;
  highlightedId?: string | null;
  onPromote?: (title: string) => void;
}

export const IdeaList: React.FC<IdeaListProps> = ({ items, onDelete, highlightedId, onPromote }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        表示するアイデアがありません。<br/>フォームから追加してください。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((idea) => {
        const zoneConfig = ZONES[idea.zone];
        const isHighlighted = highlightedId === idea.id;
        
        return (
          <div 
            key={idea.id} 
            id={`item-${idea.id}`}
            className={`
              relative flex items-start gap-3 p-4 rounded-lg border transition-all duration-300
              ${isHighlighted ? 'ring-2 ring-indigo-400 bg-white shadow-md transform scale-[1.02]' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}
            `}
          >
            {/* Score Badge */}
            <div className={`
              flex flex-col items-center justify-center w-10 h-10 rounded-full shrink-0 font-bold text-lg
              ${zoneConfig.bg} ${zoneConfig.color}
            `}>
              {idea.score}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-bold text-slate-800 truncate">{idea.title}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${zoneConfig.bg} ${zoneConfig.color} ${zoneConfig.border}`}>
                  {zoneConfig.label}
                </span>
              </div>
              
              {idea.memo && (
                <p className="text-sm text-slate-600 mb-2 whitespace-pre-wrap break-words line-clamp-2">{idea.memo}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-400 font-mono mt-1">
                <span>Impact: {idea.impact}</span>
                <span>Cost: {idea.cost}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 -mr-2">
              {onPromote && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPromote(idea.title);
                  }}
                  className="text-slate-300 hover:text-indigo-500 p-1 transition-colors"
                  aria-label="Create Hypothesis"
                  title="このアイデアで仮説検証を行う"
                >
                  <FlaskConical size={16} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if(window.confirm(`「${idea.title}」を削除しますか？`)) {
                    onDelete(idea.id);
                  }
                }}
                className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};