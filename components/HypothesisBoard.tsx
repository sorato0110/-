import React, { useState, useEffect, useMemo } from 'react';
import { HypothesisItem, EffortLevel, HypothesisStatus } from '../types';
import { EFFORT_LABELS, STATUS_LABELS, PLATFORM_OPTIONS } from '../constants';
import { loadHypothesisItems, saveHypothesisItems } from '../services/storage';
import { Trash2, Plus, Info, ChevronDown, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const HypothesisBoard: React.FC = () => {
  // --- State ---
  const [items, setItems] = useState<HypothesisItem[]>([]);
  
  // Input Form State
  const [inputIdea, setInputIdea] = useState('');
  const [inputHypothesis, setInputHypothesis] = useState('');
  
  // Filters
  const [sortOrder, setSortOrder] = useState<'effort' | 'newest'>('newest');
  const [statusFilter, setStatusFilter] = useState<'all' | HypothesisStatus>('all');

  // --- Effects ---
  useEffect(() => {
    setItems(loadHypothesisItems());
  }, []);

  useEffect(() => {
    saveHypothesisItems(items);
  }, [items]);

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
      platform: 'X（旧Twitter）',
      platformNote: '',
      duration: '',
      effort: 'normal',
      kpi: '',
      status: 'not-started',
      learning: '',
      createdAt: Date.now(),
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

  // --- Helpers ---
  const effortOrder: EffortLevel[] = ['tiny', 'small', 'normal', 'heavy'];

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Sort
    if (sortOrder === 'effort') {
      result.sort((a, b) => effortOrder.indexOf(a.effort) - effortOrder.indexOf(b.effort));
    } else {
      // Newest
      result.sort((a, b) => b.createdAt - a.createdAt);
    }

    return result;
  }, [items, sortOrder, statusFilter]);

  return (
    <div className="space-y-8 pb-20">
      
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
              <option value="effort">作業量が小さい順</option>
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
}

const HypothesisCard: React.FC<HypothesisCardProps> = ({ item, onUpdate, onDelete }) => {
  const isDone = item.status === 'done';

  return (
    <div className={`
      bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden
      ${isDone ? 'border-slate-300 bg-slate-50' : 'border-slate-200 hover:shadow-md'}
    `}>
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
        <button
          onClick={() => onDelete(item.id)}
          className="text-slate-400 hover:text-rose-500 p-2 rounded-full hover:bg-rose-50 transition-colors"
        >
          <Trash2 size={18} />
        </button>
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
            
            {/* Platform */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">プラットフォーム</label>
              <div className="flex gap-2">
                <select 
                  value={item.platform}
                  onChange={(e) => onUpdate(item.id, { platform: e.target.value })}
                  className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {PLATFORM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              {item.platform === 'その他' && (
                <input 
                  type="text" 
                  value={item.platformNote}
                  onChange={(e) => onUpdate(item.id, { platformNote: e.target.value })}
                  placeholder="詳細を入力"
                  className="w-full text-sm border-slate-300 rounded-md mt-1"
                />
              )}
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">テスト期間</label>
              <input
                type="text"
                value={item.duration}
                onChange={(e) => onUpdate(item.id, { duration: e.target.value })}
                placeholder="例: 1週間"
                className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Effort */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">作業量</label>
              <select
                value={item.effort}
                onChange={(e) => onUpdate(item.id, { effort: e.target.value as EffortLevel })}
                className={`w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-medium ${EFFORT_LABELS[item.effort].color.split(' ')[1]}`}
              >
                <option value="tiny">とても小さい</option>
                <option value="small">小さい</option>
                <option value="normal">ふつう</option>
                <option value="heavy">重め</option>
              </select>
            </div>

            {/* KPI */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">成功指標 (KPI)</label>
              <input
                type="text"
                value={item.kpi}
                onChange={(e) => onUpdate(item.id, { kpi: e.target.value })}
                placeholder="例: フォロワー+100"
                className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
