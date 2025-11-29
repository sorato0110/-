import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Idea, ZoneType, ScaleValue, FilterState } from './types';
import { ZONES } from './constants';
import { loadItems, saveItems, loadFilters, saveFilters, loadTitle, saveTitle, calculateMetrics } from './services/storage';
import { IdeaMatrix } from './components/IdeaMatrix';
import { IdeaList } from './components/IdeaList';
import { HypothesisBoard } from './components/HypothesisBoard';
import { ConfidenceBoard } from './components/ConfidenceBoard';
import { Download, Upload, Trash2, Plus, RefreshCw, LayoutGrid, FlaskConical, TrendingUp } from 'lucide-react';

const App: React.FC = () => {
  // --- View State ---
  const [currentView, setCurrentView] = useState<'matrix' | 'hypothesis' | 'confidence'>('matrix');

  // --- Data Transfer State ---
  const [hypothesisInitialIdea, setHypothesisInitialIdea] = useState<string>('');
  const [confidenceInitialData, setConfidenceInitialData] = useState<{ 
    ideaTitle: string, 
    testTitle: string, 
    startDate?: string, 
    endDate?: string,
    initialMetrics?: { reach: number; responses: number; sales: number },
    initialMemo?: string
  } | null>(null);

  // --- Matrix State ---
  const [items, setItems] = useState<Idea[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    [ZoneType.QUICK_WINS]: true,
    [ZoneType.MAJOR_PROJECTS]: true,
    [ZoneType.FILL_INS]: true,
    [ZoneType.IGNORE]: true,
  });
  const [projectTitle, setProjectTitle] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [impact, setImpact] = useState<ScaleValue>(3);
  const [cost, setCost] = useState<ScaleValue>(3);

  // --- Effects ---

  // Initial Load
  useEffect(() => {
    setItems(loadItems());
    setFilters(loadFilters());
    setProjectTitle(loadTitle());
  }, []);

  // Persistence
  useEffect(() => {
    saveItems(items);
  }, [items]);

  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  useEffect(() => {
    saveTitle(projectTitle);
  }, [projectTitle]);

  // Clear highlight after delay
  useEffect(() => {
    if (highlightedId) {
      const timer = setTimeout(() => setHighlightedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedId]);

  // --- Handlers ---

  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const { score, zone } = calculateMetrics(impact, cost);
    
    // Fallback to random string generation if crypto is not available
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    const newIdea: Idea = {
      id: generateId(),
      title: title.trim(),
      memo: memo.trim(),
      impact,
      cost,
      score,
      zone,
      createdAt: Date.now(),
    };

    setItems(prev => [...prev, newIdea]);
    
    // Reset Form
    setTitle('');
    setMemo('');
    setImpact(3);
    setCost(3);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleReset = () => {
    if (window.confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。')) {
      setItems([]);
      localStorage.removeItem('ideaMatrix:v1:items');
    }
  };

  const toggleFilter = (zone: ZoneType) => {
    setFilters(prev => ({ ...prev, [zone]: !prev[zone] }));
  };

  // --- Navigation & Data Transfer Handlers ---

  const handleMoveToHypothesis = (ideaTitle: string) => {
    setHypothesisInitialIdea(ideaTitle);
    setCurrentView('hypothesis');
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMoveToConfidence = (
    ideaTitle: string, 
    hypothesis: string, 
    startDate?: string, 
    endDate?: string,
    metrics?: { reach: number; responses: number; sales: number },
    memo?: string
  ) => {
    // Attempt to create a short test title from hypothesis or just use generic text
    const shortTestTitle = hypothesis.length > 20 ? hypothesis.substring(0, 20) + '...' : hypothesis;
    setConfidenceInitialData({
      ideaTitle: ideaTitle,
      testTitle: shortTestTitle,
      startDate: startDate,
      endDate: endDate,
      initialMetrics: metrics,
      initialMemo: memo
    });
    setCurrentView('confidence');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = () => {
    const exportData = {
      items,
      title: projectTitle
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ideas_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          // Old format support
          if (window.confirm('現在のデータを上書きしてインポートしますか？')) {
            setItems(json);
          }
        } else if (json.items && Array.isArray(json.items)) {
          // New format support
           if (window.confirm('現在のデータを上書きしてインポートしますか？')) {
            setItems(json.items);
            if (json.title) setProjectTitle(json.title);
          }
        } else {
          alert('無効なJSONファイル形式です');
        }
      } catch (err) {
        alert('ファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
  };

  const handleChartItemClick = (id: string) => {
    setHighlightedId(id);
    const el = document.getElementById(`item-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // --- Derived State ---
  const filteredItems = useMemo(() => {
    return items
      .filter(item => filters[item.zone])
      .sort((a, b) => b.score - a.score || b.createdAt - a.createdAt); // Sort by Score DESC, then Date
  }, [items, filters]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8">
      
      {/* 1. Header & Controls */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-slate-700 hidden sm:block">バンディット×ベイズ戦略</h1>
            <h1 className="text-lg font-bold text-slate-700 sm:hidden">戦略ボード</h1>
            
            {/* View Switcher Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-lg overflow-x-auto no-scrollbar">
              <button
                onClick={() => setCurrentView('matrix')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  currentView === 'matrix' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LayoutGrid size={16} />
                戦略マップ
              </button>
              <button
                onClick={() => setCurrentView('hypothesis')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  currentView === 'hypothesis' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FlaskConical size={16} />
                仮説検証
              </button>
              <button
                onClick={() => setCurrentView('confidence')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  currentView === 'confidence' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <TrendingUp size={16} />
                自信度分析
              </button>
            </div>
          </div>

          {/* Conditional Header Controls based on View */}
          {currentView === 'matrix' && (
            <div className="flex justify-end items-center pt-2">
              {/* Data Controls */}
              <div className="flex gap-2">
                <button onClick={handleExport} title="Export JSON" className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors">
                  <Download size={18} />
                </button>
                <button onClick={handleImportClick} title="Import JSON" className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors">
                  <Upload size={18} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImportFile} className="hidden" accept=".json" />
                <button onClick={handleReset} title="Reset All" className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-full transition-colors">
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
        
        {currentView === 'matrix' && (
          <>
            {/* 2. Input Form (Moved to Top) */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <form onSubmit={handleAddIdea} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="タイトル (例: 新機能LP作成)"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-2 text-gray-900 font-medium placeholder:text-slate-500 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Impact (効果)</label>
                    <div className="flex justify-between bg-slate-100 rounded-lg p-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setImpact(v as ScaleValue)}
                          className={`
                            w-8 h-8 rounded-md text-sm font-bold transition-all
                            ${impact === v ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-600 hover:text-slate-800'}
                          `}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Cost (工数)</label>
                    <div className="flex justify-between bg-slate-100 rounded-lg p-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setCost(v as ScaleValue)}
                          className={`
                            w-8 h-8 rounded-md text-sm font-bold transition-all
                            ${cost === v ? 'bg-white text-rose-500 shadow-sm ring-1 ring-black/5' : 'text-slate-600 hover:text-slate-800'}
                          `}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <textarea
                    placeholder="メモ (任意)"
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 text-gray-900 font-medium placeholder:text-slate-500 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
                >
                  保存する
                </button>
              </form>
            </section>

            {/* 3. Matrix Visualization */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="マップのタイトルを入力..."
                  className="w-full font-bold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 focus:outline-none transition-all p-0 text-lg placeholder:text-slate-300"
                />
              </div>

              {/* Filter Bar - Moved here for better visibility */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.values(ZONES).map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => toggleFilter(zone.id)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
                      ${filters[zone.id] ? zone.activeClass : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}
                    `}
                  >
                    {zone.label}
                  </button>
                ))}
              </div>

              <IdeaMatrix items={filteredItems} onItemClick={handleChartItemClick} />
            </section>

            {/* 4. List View */}
            <section>
              <div className="flex items-center justify-between mb-4">
                 <h2 className="font-bold text-slate-700">優先度順リスト</h2>
                 <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">{filteredItems.length} items</span>
              </div>
              <IdeaList 
                items={filteredItems} 
                onDelete={handleDelete} 
                highlightedId={highlightedId}
                onPromote={handleMoveToHypothesis}
              />
            </section>
          </>
        )}

        {currentView === 'hypothesis' && (
          <HypothesisBoard 
            initialIdea={hypothesisInitialIdea}
            onPromoteToConfidence={handleMoveToConfidence}
          />
        )}

        {currentView === 'confidence' && (
          <ConfidenceBoard 
            initialValues={confidenceInitialData}
          />
        )}
      </main>

      {/* Floating Action Button for Mobile (Only in Matrix View) */}
      {currentView === 'matrix' && (
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top (Form)
            }}
            className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;