import React, { useState, useEffect, useMemo } from 'react';
import { HypothesisItem, EffortLevel, HypothesisStatus, KpiConfigItem, DailyLog } from '../types';
import { STATUS_LABELS } from '../constants';
import { loadHypothesisItems, saveHypothesisItems, loadKpiConfig } from '../services/storage';
import { Trash2, Plus, Info, ChevronDown, CheckCircle2, Clock, AlertCircle, TrendingUp, MessageSquarePlus } from 'lucide-react';
import { QuickLogPanel } from './QuickLogPanel';

interface HypothesisBoardProps {
  initialIdea?: string;
  onPromoteToConfidence?: (
    ideaTitle: string, 
    hypothesis: string, 
    startDate?: string, 
    endDate?: string,
    initialMetrics?: { reach: number; responses: number; sales: number },
    initialMemo?: string
  ) => void;
}

export const HypothesisBoard: React.FC<HypothesisBoardProps> = ({ initialIdea, onPromoteToConfidence }) => {
  // --- State ---
  const [items, setItems] = useState<HypothesisItem[]>([]);
  const [kpiConfig, setKpiConfig] = useState<KpiConfigItem[]>([]);
  
  // Input Form State
  const [inputIdea, setInputIdea] = useState('');
  const [inputHypothesis, setInputHypothesis] = useState('');
  
  // Filters
  const [sortOrder, setSortOrder] = useState<'newest'>('newest');
  const [statusFilter, setStatusFilter] = useState<'all' | HypothesisStatus>('all');

  // Quick Log Panel State
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);

  // --- Effects ---
  useEffect(() => {
    setItems(loadHypothesisItems());
    setKpiConfig(loadKpiConfig());
  }, []);

  useEffect(() => {
    saveHypothesisItems(items);
  }, [items]);

  useEffect(() => {
    if (initialIdea) {
      setInputIdea(initialIdea);
    }
  }, [initialIdea]);

  // --- Handlers ---

  const handleAddItem = () => {
    if (!inputIdea.trim() || !inputHypothesis.trim()) return;

    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    const newItem: HypothesisItem = {
      id: generateId(),
      ideaTitle: inputIdea.trim(),
      hypothesis: inputHypothesis.trim(),
      duration: '',
      effort: 'normal',
      kpi: '',
      status: 'not-started',
      learning: '',
      createdAt: Date.now(),
      dailyLogs: [],
    };

    setItems(prev => [newItem, ...prev]);
    setInputIdea('');
    setInputHypothesis('');
  };

  const handleUpdateItem = (id: string, updates: Partial<HypothesisItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('この仮説を削除してもよろしいですか？')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleResetAll = () => {
    if (window.confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。')) {
      setItems([]);
      localStorage.removeItem('hypothesisPracticeBoard:v1');
    }
  };

  // Quick Log Handler
  const handleAddLog = (itemId: string, log: DailyLog) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          dailyLogs: [...(item.dailyLogs || []), log]
        };
      }
      return item;
    }));
  };

  // --- Helpers ---

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Sort
    // Newest
    result.sort((a, b) => b.createdAt - a.createdAt);

    return result;
  }, [items, sortOrder, statusFilter]);

  const runningItems = useMemo(() => items.filter(i => i.status === 'running'), [items]);

  return (
    <div className="space-y-8 pb-20 relative">
      
      {/* Quick Log FAB (Always visible when panel is closed) */}
      {!isLogPanelOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in zoom-in duration-300">
           <button
             onClick={() => setIsLogPanelOpen(true)}
             className="bg-slate-800 text-white p-4 rounded-full shadow-xl hover:bg-slate-900 transition-all hover:scale-105 active:scale-95 flex items-center justify-center relative group"
           >
             <MessageSquarePlus size={24} />
             <span className="absolute right-full mr-3 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
               進捗ログを書く
             </span>
           </button>
        </div>
      )}

      {/* Quick Log Panel */}
      <QuickLogPanel 
        isOpen={isLogPanelOpen}
        onClose={() => setIsLogPanelOpen(false)}
        runningItems={runningItems}
        kpiConfig={kpiConfig}
        onAddLog={handleAddLog}
      />
      
      {/* --- Step 1: Create Hypothesis --- */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="mb-4 pb-2 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">Step 1</span>
            アイデアから仮説をつくる
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">アイデア名</label>
            <input
              type="text"
              value={inputIdea}
              onChange={(e) => setInputIdea(e.target.value)}
              placeholder="例：AIで◯◯のコンテンツを配信"
              className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">検証可能な仮説</label>
            <div className="bg-indigo-50 p-3 rounded-lg mb-2 text-xs text-indigo-800 flex gap-2 items-start">
              <Info size={16} className="shrink-0 mt-0.5" />
              <ul className="list-disc list-inside space-y-0.5">
                <li>「もし○○すれば（行動）」</li>
                <li>「いつまでに・どれくらい（期間・数値）」</li>
                <li>「〜だろう（結果）」</li>
              </ul>
            </div>
            <textarea
              value={inputHypothesis}
              onChange={(e) => setInputHypothesis(e.target.value)}
              placeholder={`例）\nもし、私が 〇〇 に関するAI生成コンテンツを SNS で毎日投稿すれば、\n1週間でフォロワーが 100 人増え、そのうち 5 人から有料サービスへの問い合わせが来るだろう。`}
              rows={4}
              className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={handleAddItem}
            disabled={!inputIdea.trim() || !inputHypothesis.trim()}
            className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            この仮説をリストに追加
          </button>
        </div>
      </section>

      {/* --- Step 2 & 3: Board --- */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">Step 2 & 3</span>
             小さく試す計画ボード
          </h2>
          
          <div className="flex flex-wrap gap-2 text-sm">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="newest">追加順</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="all">すべて</option>
              <option value="not-started">未着手</option>
              <option value="running">実行中</option>
              <option value="done">完了</option>
            </select>
            <button 
              onClick={handleResetAll}
              className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              すべて削除
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-400">
              まだ仮説がありません。<br/>Step 1 から追加してください。
            </div>
          ) : (
            filteredItems.map(item => (
              <HypothesisCard 
                key={item.id} 
                item={item} 
                onUpdate={handleUpdateItem} 
                onDelete={handleDeleteItem}
                onPromote={onPromoteToConfidence}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

// --- Sub Component: Card (Inline Edit) ---

interface HypothesisCardProps {
  item: HypothesisItem;
  onUpdate: (id: string, updates: Partial<HypothesisItem>) => void;
  onDelete: (id: string) => void;
  onPromote?: (
    ideaTitle: string, 
    hypothesis: string, 
    startDate?: string, 
    endDate?: string,
    initialMetrics?: { reach: number; responses: number; sales: number },
    initialMemo?: string
  ) => void;
}

const HypothesisCard: React.FC<HypothesisCardProps> = ({ item, onUpdate, onDelete, onPromote }) => {
  const isDone = item.status === 'done';

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const updates: Partial<HypothesisItem> = {};
    if (type === 'start') updates.startDate = value;
    else updates.endDate = value;

    // Calculate duration string
    const s = type === 'start' ? value : item.startDate;
    const e = type === 'end' ? value : item.endDate;
    
    if (s && e) {
      const start = new Date(s);
      const end = new Date(e);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const durationLabel = diffDays > 0 ? `(${diffDays}日間)` : '';
      const format = (d: string) => d.replace(/-/g, '/');
      updates.duration = `${format(s)}～${format(e)} ${durationLabel}`;
    } else if (s) {
       updates.duration = s.replace(/-/g, '/');
    } else if (e) {
       updates.duration = e.replace(/-/g, '/');
    }
    
    onUpdate(item.id, updates);
  };

  const handlePromoteClick = () => {
    if (!onPromote) return;

    // Aggregate logs
    const aggregatedMetrics = { reach: 0, responses: 0, sales: 0 };
    let aggregatedMemo = '';
    
    // Sort logs by date for memo
    const sortedLogs = [...(item.dailyLogs || [])].sort((a, b) => a.date.localeCompare(b.date));

    sortedLogs.forEach(log => {
      // Sum standard metrics if they exist
      if (log.metrics['reach']) aggregatedMetrics.reach += log.metrics['reach'];
      if (log.metrics['responses']) aggregatedMetrics.responses += log.metrics['responses'];
      if (log.metrics['sales']) aggregatedMetrics.sales += log.metrics['sales'];
      
      // Concatenate memos
      if (log.memo && log.memo.trim()) {
        aggregatedMemo += `[${log.date}] ${log.memo}\n`;
      }
    });

    // If there is existing learning, append it
    if (item.learning) {
      aggregatedMemo += `\n[学びメモ] ${item.learning}`;
    }

    onPromote(
      item.ideaTitle,
      item.hypothesis,
      item.startDate,
      item.endDate,
      aggregatedMetrics,
      aggregatedMemo.trim()
    );
  };

  return (
    <div className={`
      bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden relative
      ${isDone ? 'border-slate-300 bg-slate-50' : 'border-slate-200 hover:shadow-md'}
    `}>
      {/* Log Count Badge */}
      {item.dailyLogs && item.dailyLogs.length > 0 && (
         <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-20 shadow-sm flex items-center gap-1">
           <MessageSquarePlus size={10} />
           {item.dailyLogs.length} logs
         </div>
      )}

      {/* Header: Status & Actions */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <select
             value={item.status}
             onChange={(e) => onUpdate(item.id, { status: e.target.value as HypothesisStatus })}
             className={`
               text-sm font-bold px-3 py-1.5 rounded-full cursor-pointer border-transparent focus:ring-2 focus:ring-offset-1 outline-none appearance-none pr-8 relative z-10
               ${STATUS_LABELS[item.status].color}
             `}
             style={{ 
               backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
               backgroundPosition: `right 0.5rem center`,
               backgroundSize: `1.5em 1.5em`,
               backgroundRepeat: 'no-repeat'
             }}
           >
             <option value="not-started">未着手</option>
             <option value="running">実行中</option>
             <option value="done">完了</option>
           </select>
           {isDone && <CheckCircle2 size={18} className="text-emerald-600" />}
           {item.status === 'running' && <Clock size={18} className="text-indigo-500 animate-pulse" />}
        </div>
        <div className="flex items-center gap-1">
          {onPromote && (
            <button
              onClick={handlePromoteClick}
              className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors"
              title="この結果を分析・記録する"
            >
              <TrendingUp size={18} />
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="text-slate-400 hover:text-rose-500 p-2 rounded-full hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Col: Idea & Hypothesis */}
        <div className="md:col-span-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">アイデア</label>
            <h3 className="font-bold text-slate-800 leading-tight">{item.ideaTitle}</h3>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">仮説</label>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.hypothesis}</p>
          </div>
        </div>

        {/* Right Col: Test Design (Inputs) */}
        <div className="md:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Duration (Date Range) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">実施期間</label>
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute -top-1.5 left-2 bg-white px-1 text-[10px] text-slate-400 font-bold z-10">開始</span>
                  <input
                    type="date"
                    value={item.startDate || ''}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600"
                  />
                </div>
                <div className="relative">
                  <span className="absolute -top-1.5 left-2 bg-white px-1 text-[10px] text-slate-400 font-bold z-10">終了</span>
                  <input
                    type="date"
                    value={item.endDate || ''}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* KPI */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">成功指標 (KPI)</label>
              <input
                type="text"
                value={item.kpi}
                onChange={(e) => onUpdate(item.id, { kpi: e.target.value })}
                placeholder="例: フォロワー+100"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Learning Memo (Show only when done) */}
          {isDone && (
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-amber-700 mb-1 block flex items-center gap-1">
                <AlertCircle size={12} />
                学びメモ（結果・気づき）
              </label>
              <textarea
                value={item.learning}
                onChange={(e) => onUpdate(item.id, { learning: e.target.value })}
                placeholder="実験の結果はどうでしたか？次に活かす学びを書きましょう。"
                rows={2}
                className="w-full text-sm bg-white border-amber-200 rounded-md focus:ring-amber-500 focus:border-amber-500 placeholder:text-amber-300"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
