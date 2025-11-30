
import React, { useState, useEffect, useMemo } from 'react';
import { HypothesisItem, EffortLevel, HypothesisStatus, KpiConfigItem, DailyLog } from '../types';
import { STATUS_LABELS } from '../constants';
import { loadHypothesisItems, saveHypothesisItems, loadKpiConfig } from '../services/storage';
import { Trash2, Plus, Info, ChevronDown, CheckCircle2, Clock, AlertCircle, TrendingUp, MessageSquarePlus, PieChart, Activity, ArrowRight, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
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
  const [sortOrder, setSortOrder] = useState<'newest' | 'resource'>('newest');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | HypothesisStatus>('all');

  // Quick Log Panel State
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const loadedItems = loadHypothesisItems();
    // Migrate legacy statuses
    const migratedItems = loadedItems.map(item => {
      if (item.status === 'running') return { ...item, status: 'trial' as HypothesisStatus };
      if (item.status === 'done') return { ...item, status: 'completed' as HypothesisStatus };
      return item;
    });
    setItems(migratedItems);
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
      resourceAllocation: 0,
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
    if (statusFilter === 'active') {
      result = result.filter(item => ['trial', 'focus', 'sustain'].includes(item.status));
    } else if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Sort
    if (sortOrder === 'resource') {
      result.sort((a, b) => (b.resourceAllocation || 0) - (a.resourceAllocation || 0));
    } else {
      // Newest
      result.sort((a, b) => b.createdAt - a.createdAt);
    }

    return result;
  }, [items, sortOrder, statusFilter]);

  // Items valid for logging (Trial, Focus, Sustain)
  const activeLogItems = useMemo(() => 
    items.filter(i => ['trial', 'focus', 'sustain'].includes(i.status)), 
  [items]);

  // Total Resource Usage
  const totalResourceUsage = useMemo(() => {
    return items
      .filter(i => i.status !== 'drop' && i.status !== 'completed')
      .reduce((acc, curr) => acc + (curr.resourceAllocation || 0), 0);
  }, [items]);

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
        runningItems={activeLogItems}
        kpiConfig={kpiConfig}
        onAddLog={handleAddLog}
      />
      
      {/* Resource Gauge Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-[72px] z-30 opacity-95 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
           <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
             <PieChart size={14} />
             Total Resource Allocation
           </h3>
           <span className={`text-sm font-bold font-mono ${totalResourceUsage > 100 ? 'text-rose-500' : 'text-slate-700'}`}>
             {totalResourceUsage}%
           </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          {items.filter(i => (i.resourceAllocation || 0) > 0 && i.status !== 'drop' && i.status !== 'completed').map(item => (
            <div 
              key={item.id}
              style={{ width: `${item.resourceAllocation}%` }}
              className={`h-full border-r border-white/20 last:border-0 transition-all duration-500 ${STATUS_LABELS[item.status]?.color.split(' ')[0] || 'bg-slate-300'}`}
              title={`${item.ideaTitle}: ${item.resourceAllocation}%`}
            />
          ))}
          {/* Warning Overfill */}
          {totalResourceUsage > 100 && (
            <div className="h-full bg-rose-500 animate-pulse w-full pattern-diagonal-lines" style={{ width: '100%' }} />
          )}
        </div>
        {totalResourceUsage > 100 && (
           <p className="text-[10px] text-rose-500 font-bold mt-1 text-right">
             ⚠️ リソース過多です。合計が100%になるように調整してください。
           </p>
        )}
      </div>

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
             小さく試す計画ボード (MABポートフォリオ)
          </h2>
          
          <div className="flex flex-wrap gap-2 text-sm">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="newest">追加順</option>
              <option value="resource">リソース配分順</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="all">すべて</option>
              <option value="active">進行中のみ (Trial/Focus/Sustain)</option>
              <option value="not-started">未着手</option>
              <option value="trial">Trial (試行)</option>
              <option value="focus">Focus (注力)</option>
              <option value="sustain">Sustain (維持)</option>
              <option value="drop">Drop (撤退)</option>
              <option value="completed">完了</option>
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
              該当する仮説がありません。<br/>Step 1 から追加するか、フィルターを変更してください。
            </div>
          ) : (
            filteredItems.map(item => (
              <HypothesisCard 
                key={item.id} 
                item={item} 
                kpiConfig={kpiConfig}
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
  kpiConfig: KpiConfigItem[];
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

const HypothesisCard: React.FC<HypothesisCardProps> = ({ item, kpiConfig, onUpdate, onDelete, onPromote }) => {
  const isCompleted = item.status === 'completed' || item.status === 'drop';
  
  // Calculate Trend
  const trend = useMemo(() => {
    if (!item.dailyLogs || item.dailyLogs.length < 2) return null;
    // Sort logs date asc
    const logs = [...item.dailyLogs].sort((a, b) => a.date.localeCompare(b.date));
    const last = logs[logs.length - 1];
    const prev = logs[logs.length - 2];
    
    // Use first available numerator metric for simple trend
    const metricKey = kpiConfig.find(k => k.role === 'numerator')?.id || 'responses';
    const lastVal = last.metrics[metricKey] || 0;
    const prevVal = prev.metrics[metricKey] || 0;

    if (prevVal === 0) return lastVal > 0 ? 'up-sharp' : 'flat';
    
    const diff = (lastVal - prevVal) / prevVal;
    if (diff > 0.5) return 'up-sharp';
    if (diff > 0.1) return 'up';
    if (diff < -0.1) return 'down';
    return 'flat';
  }, [item.dailyLogs, kpiConfig]);

  const TrendIcon = () => {
    switch (trend) {
      case 'up-sharp': return <ArrowUpRight className="text-emerald-500 font-bold" size={20} />;
      case 'up': return <ArrowUpRight className="text-emerald-400" size={18} />;
      case 'flat': return <ArrowRight className="text-slate-400" size={18} />;
      case 'down': return <ArrowDownRight className="text-rose-400" size={18} />;
      default: return <Minus className="text-slate-300" size={18} />;
    }
  };

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

  const currentStatusConfig = STATUS_LABELS[item.status] || STATUS_LABELS['not-started'];

  return (
    <div className={`
      bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden relative
      ${item.status === 'focus' ? 'ring-2 ring-indigo-100 border-indigo-200' : ''}
      ${isCompleted ? 'border-slate-300 bg-slate-50 opacity-80' : 'border-slate-200 hover:shadow-md'}
    `}>
      {/* Log Count Badge */}
      {item.dailyLogs && item.dailyLogs.length > 0 && (
         <div className="absolute top-0 right-0 bg-slate-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-20 shadow-sm flex items-center gap-1">
           <MessageSquarePlus size={10} />
           {item.dailyLogs.length} logs
         </div>
      )}

      {/* Header: Status & Actions */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
           <div className="relative group">
             <select
               value={item.status}
               onChange={(e) => onUpdate(item.id, { status: e.target.value as HypothesisStatus })}
               className={`
                 text-sm font-bold px-3 py-1.5 rounded-lg cursor-pointer border focus:ring-2 focus:ring-offset-1 outline-none appearance-none pr-8 relative z-10 w-full md:w-auto
                 ${currentStatusConfig.color}
               `}
               style={{ 
                 backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                 backgroundPosition: `right 0.5rem center`,
                 backgroundSize: `1.2em 1.2em`,
                 backgroundRepeat: 'no-repeat'
               }}
             >
               <option value="not-started">未着手</option>
               <option value="trial">Trial (試行)</option>
               <option value="focus">Focus (注力)</option>
               <option value="sustain">Sustain (維持)</option>
               <option value="drop">Drop (撤退)</option>
               <option value="completed">完了</option>
             </select>
           </div>
           
           {/* Trend Indicator */}
           {trend && !isCompleted && (
             <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-white rounded border border-slate-200 shadow-sm" title="直近の成長トレンド">
               <Activity size={12} className="text-slate-400" />
               <TrendIcon />
               <span className="text-slate-600">
                  {trend === 'up-sharp' ? '急上昇' : trend === 'up' ? '上昇' : trend === 'down' ? '下降' : '横ばい'}
               </span>
             </div>
           )}
        </div>

        {/* Resource Slider (Only for active items) */}
        {!isCompleted && item.status !== 'not-started' && (
           <div className="flex-1 max-w-[200px] flex flex-col justify-center">
             <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
               <span>Resource: {item.resourceAllocation || 0}%</span>
             </div>
             <input
               type="range"
               min="0" max="100" step="5"
               value={item.resourceAllocation || 0}
               onChange={(e) => onUpdate(item.id, { resourceAllocation: Number(e.target.value) })}
               className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600 hover:accent-indigo-600 transition-colors"
             />
           </div>
        )}

        <div className="flex items-center gap-1 ml-auto md:ml-0">
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

          {/* Learning Memo (Show only when completed) */}
          {isCompleted && (
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
