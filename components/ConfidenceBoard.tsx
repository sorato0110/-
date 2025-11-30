
import React, { useState, useEffect, useMemo } from 'react';
import { ExperimentLog, ConfidenceData, ImpactType, KpiConfigItem, KpiRole } from '../types';
import { IMPACT_OPTIONS, DEFAULT_KPI_CONFIG } from '../constants';
import { loadExperiments, saveExperiments, loadConfidenceData, saveConfidenceData, loadKpiConfig, saveKpiConfig } from '../services/storage';
import { Plus, ChevronDown, ChevronUp, Trash2, TrendingUp, Info, Settings, X, Calendar } from 'lucide-react';

interface ConfidenceBoardProps {
  initialValues?: { 
    ideaTitle: string; 
    testTitle: string; 
    startDate?: string; 
    endDate?: string;
    initialMetrics?: { reach: number; responses: number; sales: number };
    initialMemo?: string;
  } | null;
}

export const ConfidenceBoard: React.FC<ConfidenceBoardProps> = ({ initialValues }) => {
  // --- State ---
  const [experiments, setExperiments] = useState<ExperimentLog[]>([]);
  const [confidenceData, setConfidenceData] = useState<ConfidenceData[]>([]);
  const [kpiConfig, setKpiConfig] = useState<KpiConfigItem[]>(DEFAULT_KPI_CONFIG);

  // Form State
  const [ideaTitle, setIdeaTitle] = useState('');
  const [testTitle, setTestTitle] = useState('');
  
  // Date Inputs for Period
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // KPI Inputs
  const [reach, setReach] = useState('');
  const [responses, setResponses] = useState('');
  const [sales, setSales] = useState('');
  
  const [memo, setMemo] = useState('');

  // Filters
  const [filterIdea, setFilterIdea] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'sales' | 'response_rate'>('newest');

  // Modal State
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [editingKpiConfig, setEditingKpiConfig] = useState<KpiConfigItem[]>([]);

  // --- Effects ---
  useEffect(() => {
    setExperiments(loadExperiments());
    setConfidenceData(loadConfidenceData());
    setKpiConfig(loadKpiConfig());
  }, []);

  useEffect(() => {
    saveExperiments(experiments);
  }, [experiments]);

  useEffect(() => {
    saveConfidenceData(confidenceData);
  }, [confidenceData]);

  // Handle incoming data from navigation
  useEffect(() => {
    if (initialValues) {
      setIdeaTitle(initialValues.ideaTitle);
      setTestTitle(initialValues.testTitle);
      if (initialValues.startDate) setStartDate(initialValues.startDate);
      if (initialValues.endDate) setEndDate(initialValues.endDate);
      
      if (initialValues.initialMetrics) {
        if(initialValues.initialMetrics.reach) setReach(initialValues.initialMetrics.reach.toString());
        if(initialValues.initialMetrics.responses) setResponses(initialValues.initialMetrics.responses.toString());
        if(initialValues.initialMetrics.sales) setSales(initialValues.initialMetrics.sales.toString());
      }
      
      if (initialValues.initialMemo) {
        setMemo(initialValues.initialMemo);
      }
    }
  }, [initialValues]);

  // Sync Confidence Data with Experiments
  useEffect(() => {
    const uniqueIdeas = Array.from(new Set(experiments.map(e => e.ideaTitle)));
    setConfidenceData(prev => {
      const currentMap = new Map(prev.map(c => [c.ideaTitle, c]));
      let hasChanges = false;
      
      uniqueIdeas.forEach(idea => {
        if (!currentMap.has(idea)) {
          currentMap.set(idea, {
            ideaTitle: idea,
            currentConfidence: 50, // Default start
            lastImpact: 'neutral',
            memo: '',
            updatedAt: Date.now()
          });
          hasChanges = true;
        }
      });

      return hasChanges ? Array.from(currentMap.values()) : prev;
    });
  }, [experiments]);

  // --- Handlers ---

  const handleAddExperiment = () => {
    if (!ideaTitle.trim() || !testTitle.trim()) return;

    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

    // Calculate period string from dates
    let periodStr = '';
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
      const durationLabel = diffDays > 0 ? `(${diffDays}日間)` : '';
      const format = (d: string) => d.replace(/-/g, '/');
      periodStr = `${format(startDate)}～${format(endDate)} ${durationLabel}`;
    } else if (startDate) {
        periodStr = startDate.replace(/-/g, '/');
    } else if (endDate) {
        periodStr = endDate.replace(/-/g, '/');
    }

    const newExp: ExperimentLog = {
      id: generateId(),
      ideaTitle: ideaTitle.trim(),
      testTitle: testTitle.trim(),
      period: periodStr,
      reach: Number(reach) || 0,
      responses: Number(responses) || 0,
      sales: Number(sales) || 0,
      memo: memo.trim(),
      successFactors: '',
      failureFactors: '',
      feedback: '',
      createdAt: Date.now(),
    };

    setExperiments(prev => [newExp, ...prev]);

    // Clear Form
    setIdeaTitle('');
    setTestTitle('');
    setStartDate('');
    setEndDate('');
    setReach('');
    setResponses('');
    setSales('');
    setMemo('');
  };

  const handleUpdateExperiment = (id: string, updates: Partial<ExperimentLog>) => {
    setExperiments(prev => prev.map(exp => exp.id === id ? { ...exp, ...updates } : exp));
  };

  const handleDeleteExperiment = (id: string) => {
    if (window.confirm('この実験記録を削除しますか？')) {
      setExperiments(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleUpdateConfidence = (ideaTitle: string, updates: Partial<ConfidenceData>) => {
    setConfidenceData(prev => prev.map(c => 
      c.ideaTitle === ideaTitle ? { ...c, ...updates, updatedAt: Date.now() } : c
    ));
  };

  // KPI Modal Handlers
  const openKpiModal = () => {
    // Fill in default role if missing (for legacy data)
    const current = kpiConfig.map(item => ({
       ...item,
       role: item.role || 'none'
    }));
    setEditingKpiConfig(JSON.parse(JSON.stringify(current))); // Deep copy
    setIsKpiModalOpen(true);
  };

  const closeKpiModal = () => {
    setIsKpiModalOpen(false);
  };

  const saveKpiModal = () => {
    setKpiConfig(editingKpiConfig);
    saveKpiConfig(editingKpiConfig);
    setIsKpiModalOpen(false);
  };

  const handleKpiEditChange = (index: number, field: keyof KpiConfigItem, value: any) => {
    setEditingKpiConfig(prev => {
      const newConfig = [...prev];
      newConfig[index] = { ...newConfig[index], [field]: value };
      return newConfig;
    });
  };

  // --- Helper Helpers ---
  const getKpiInputProps = (id: string) => {
    switch(id) {
      case 'reach': return { value: reach, setValue: setReach };
      case 'responses': return { value: responses, setValue: setResponses };
      case 'sales': return { value: sales, setValue: setSales };
      default: return { value: '', setValue: () => {} };
    }
  };

  // --- Derived ---
  const filteredExperiments = useMemo(() => {
    let result = [...experiments];
    if (filterIdea !== 'all') {
      result = result.filter(e => e.ideaTitle === filterIdea);
    }

    if (sortOrder === 'sales') {
      result.sort((a, b) => b.sales - a.sales);
    } else if (sortOrder === 'response_rate') {
      result.sort((a, b) => {
        const rateA = a.reach > 0 ? a.responses / a.reach : 0;
        const rateB = b.reach > 0 ? b.responses / b.reach : 0;
        return rateB - rateA;
      });
    } else {
      result.sort((a, b) => b.createdAt - a.createdAt);
    }
    return result;
  }, [experiments, filterIdea, sortOrder]);

  const uniqueIdeaTitles = useMemo(() => {
    return Array.from(new Set(experiments.map(e => e.ideaTitle)));
  }, [experiments]);

  return (
    <div className="space-y-10 pb-20 relative">
      
      {/* KPI Edit Modal */}
      {isKpiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Settings size={18} className="text-slate-500" />
                指標ラベルのカスタマイズ
              </h3>
              <button onClick={closeKpiModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              {editingKpiConfig.map((item, index) => (
                <div key={item.id} className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{item.id}</div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">ラベル名</label>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleKpiEditChange(index, 'label', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white"
                        placeholder="ラベル名"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">説明文</label>
                      <input
                        type="text"
                        value={item.helper}
                        onChange={(e) => handleKpiEditChange(index, 'helper', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-500 bg-white focus:ring-2 focus:ring-indigo-500"
                        placeholder="説明文"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">計算設定 (母数 or 成果)</label>
                      <select
                        value={item.role || 'none'}
                        onChange={(e) => handleKpiEditChange(index, 'role', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="none">計算に使わない</option>
                        <option value="denominator">母数 (分母) として扱う</option>
                        <option value="numerator">成果 (分子) として扱う</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        ※「成果」を選ぶと、「母数」に設定された項目に対する割合(%)を自動計算して表示します。
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button onClick={closeKpiModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                キャンセル
              </button>
              <button onClick={saveKpiModal} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
                保存する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Record */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="mb-4 pb-2 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">Step 1</span>
            実験結果を記録する
          </h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">アイデア名</label>
              <input
                type="text"
                value={ideaTitle}
                onChange={e => setIdeaTitle(e.target.value)}
                placeholder="例：AIで◯◯解説のショート動画"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">テスト名 / 実験名</label>
              <input
                type="text"
                value={testTitle}
                onChange={e => setTestTitle(e.target.value)}
                placeholder="例：1週間毎日投稿テスト"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">実施期間</label>
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute -top-1.5 left-2 bg-white px-1 text-[10px] text-slate-400 font-bold z-10">開始</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600"
                  />
                </div>
                <div className="relative">
                  <span className="absolute -top-1.5 left-2 bg-white px-1 text-[10px] text-slate-400 font-bold z-10">終了</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600"
                  />
                </div>
              </div>
            </div>
            
            <div className="md:col-span-3 relative bg-slate-50 p-3 rounded-lg border border-slate-100">
              <button 
                onClick={openKpiModal}
                className="absolute top-2 right-2 text-xs flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors bg-white px-2 py-1 rounded border border-slate-200 shadow-sm z-10"
              >
                <Settings size={12} />
                指標を編集
              </button>
              
              <div className="grid grid-cols-3 gap-3">
                {kpiConfig.map((kpi) => {
                  const { value, setValue } = getKpiInputProps(kpi.id);
                  return (
                    <div key={kpi.id}>
                      <label className="block text-xs font-bold text-slate-600 mb-1 truncate pr-8" title={kpi.label}>
                        {kpi.label}
                      </label>
                      <input 
                        type="number" 
                        value={value} 
                        onChange={e => setValue(e.target.value)} 
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                        placeholder="0"
                      />
                      <div className="text-[10px] text-slate-400 mt-1 truncate leading-tight" title={kpi.helper}>
                        {kpi.helper}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">メモ（結果の概要）</label>
             <textarea
               value={memo}
               onChange={e => setMemo(e.target.value)}
               placeholder="例：フォロワーは増えたが、DMは0件だった"
               rows={2}
               className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
             />
          </div>

          <button
            onClick={handleAddExperiment}
            disabled={!ideaTitle.trim() || !testTitle.trim()}
            className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-lg shadow flex items-center justify-center gap-2 transition-all"
          >
            <Plus size={18} />
            この実験結果を追加
          </button>
        </div>
      </section>

      {/* Step 2: Analyze */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">Step 2</span>
            データから学びを言語化する
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
             <select 
               value={filterIdea} 
               onChange={e => setFilterIdea(e.target.value)}
               className="px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-700 max-w-[140px] truncate"
             >
               <option value="all">すべてのアイデア</option>
               {uniqueIdeaTitles.map(t => <option key={t} value={t}>{t}</option>)}
             </select>
             <select
               value={sortOrder}
               onChange={e => setSortOrder(e.target.value as any)}
               className="px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-700"
             >
               <option value="newest">新しい順</option>
               <option value="sales">売上が高い順</option>
               <option value="response_rate">反応率が高い順</option>
             </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredExperiments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
              実験ログがありません。
            </div>
          ) : (
            filteredExperiments.map(exp => (
              <ExperimentCard 
                key={exp.id} 
                experiment={exp} 
                kpiConfig={kpiConfig}
                onUpdate={handleUpdateExperiment}
                onDelete={handleDeleteExperiment}
              />
            ))
          )}
        </div>
      </section>

      {/* Step 3: Confidence Update */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="mb-4 pb-2 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
            <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">Step 3</span>
            仮説の自信度をアップデートする
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            小さな実験で得られたデータやフィードバックをもとに、「このアイデアがうまくいく確率」を自分なりに更新していきましょう。<br/>
            これはベイズ更新の “ざっくりバージョン” です。
          </p>
        </div>

        <div className="space-y-6">
          {confidenceData.length === 0 ? (
             <div className="text-center py-6 text-slate-400">実験を追加すると、ここに自信度トラッカーが表示されます。</div>
          ) : (
             confidenceData.map(conf => (
               <ConfidenceTracker 
                 key={conf.ideaTitle} 
                 data={conf} 
                 onUpdate={handleUpdateConfidence} 
               />
             ))
          )}
        </div>
      </section>
    </div>
  );
};

// --- Sub Components ---

const ExperimentCard: React.FC<{
  experiment: ExperimentLog,
  kpiConfig: KpiConfigItem[],
  onUpdate: (id: string, updates: Partial<ExperimentLog>) => void,
  onDelete: (id: string) => void
}> = ({ experiment, kpiConfig, onUpdate, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to calculate rate if needed
  const getRateDisplay = (kpi: KpiConfigItem) => {
    if (kpi.role !== 'numerator') return null;
    
    // Find denominator
    const denominatorKpi = kpiConfig.find(k => k.role === 'denominator');
    if (!denominatorKpi) return null;

    const numeratorVal = experiment[kpi.id as keyof ExperimentLog] as number;
    const denominatorVal = experiment[denominatorKpi.id as keyof ExperimentLog] as number;

    if (denominatorVal > 0) {
      const rate = ((numeratorVal / denominatorVal) * 100).toFixed(1);
      return <span className="text-xs text-slate-400 font-normal ml-1">({rate}%)</span>;
    }
    return <span className="text-xs text-slate-400 font-normal ml-1">(-%)</span>;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {/* Summary Row */}
      <div className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="col-span-12 md:col-span-4">
           <div className="text-xs font-bold text-slate-400">{experiment.period || '期間未設定'}</div>
           <div className="font-bold text-slate-800 truncate">{experiment.ideaTitle}</div>
           <div className="text-sm text-slate-600 truncate">{experiment.testTitle}</div>
        </div>
        
        {/* Dynamic KPI Columns */}
        {kpiConfig.map((kpi) => {
           const value = experiment[kpi.id as keyof ExperimentLog];
           const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
           const isSales = kpi.id === 'sales'; // Preserve special styling for sales if it still exists
           
           return (
             <div key={kpi.id} className="col-span-4 md:col-span-2 text-center">
               <div className="text-xs font-bold text-slate-400 truncate px-1" title={kpi.label}>{kpi.label}</div>
               <div className={`font-mono ${isSales ? 'font-bold text-emerald-600' : 'font-medium'}`}>
                 {isSales && '¥'}{formattedValue}
                 {getRateDisplay(kpi)}
               </div>
             </div>
           );
        })}

        <div className="col-span-12 md:col-span-2 flex justify-end items-center gap-2">
           <button onClick={(e) => { e.stopPropagation(); onDelete(experiment.id); }} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
           {isOpen ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
        </div>
      </div>

      {/* Details Panel */}
      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4 animate-in slide-in-from-top-2">
          {experiment.memo && (
             <div className="bg-white p-3 rounded border border-slate-200 text-sm text-slate-600">
               <span className="font-bold block text-xs text-slate-400 mb-1">MEMO</span>
               {experiment.memo}
             </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-emerald-700 mb-1">なぜうまくいったと思うか？（成功要因）</label>
               <textarea
                 value={experiment.successFactors}
                 onChange={e => onUpdate(experiment.id, { successFactors: e.target.value })}
                 className="w-full text-sm p-2 border border-emerald-200 bg-white rounded focus:ring-emerald-500 focus:border-emerald-500"
                 rows={3}
                 placeholder="要因を言語化..."
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-rose-700 mb-1">うまくいかなかった点は？（課題）</label>
               <textarea
                 value={experiment.failureFactors}
                 onChange={e => onUpdate(experiment.id, { failureFactors: e.target.value })}
                 className="w-full text-sm p-2 border border-rose-200 bg-white rounded focus:ring-rose-500 focus:border-rose-500"
                 rows={3}
                 placeholder="課題を言語化..."
               />
             </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-indigo-700 mb-1 flex items-center gap-1">
              ユーザーの声 / フィードバック
              <span className="text-[10px] font-normal text-slate-500 ml-1">(数字にならない声をメモ)</span>
            </label>
            <textarea
              value={experiment.feedback}
              onChange={e => onUpdate(experiment.id, { feedback: e.target.value })}
              className="w-full text-sm p-2 border border-indigo-200 bg-white rounded focus:ring-indigo-500 focus:border-indigo-500"
              rows={2}
              placeholder="感想、コメント、アンケート結果など..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ConfidenceTracker: React.FC<{
  data: ConfidenceData,
  onUpdate: (title: string, updates: Partial<ConfidenceData>) => void
}> = ({ data, onUpdate }) => {
  const [tempConfidence, setTempConfidence] = useState(data.currentConfidence);
  
  // Update parent only when user stops dragging or explicitly changes
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setTempConfidence(val);
  };
  
  const handleSliderCommit = () => {
    onUpdate(data.ideaTitle, { currentConfidence: tempConfidence });
  };

  useEffect(() => {
    setTempConfidence(data.currentConfidence);
  }, [data.currentConfidence]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-indigo-600"/>
        {data.ideaTitle}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Previous / Current State */}
        <div className="md:col-span-3 space-y-2">
          <label className="text-xs font-bold text-slate-400">前回までの自信度</label>
          <div className="text-3xl font-bold text-slate-700">{tempConfidence}%</div>
          <input 
            type="range" 
            min="0" max="100" 
            value={tempConfidence} 
            onChange={handleSliderChange}
            onMouseUp={handleSliderCommit}
            onTouchEnd={handleSliderCommit}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Impact Selection */}
        <div className="md:col-span-4 space-y-2">
          <label className="text-xs font-bold text-slate-400">今回の実験の影響</label>
          <div className="space-y-2">
            <select
              value={data.lastImpact}
              onChange={(e) => onUpdate(data.ideaTitle, { lastImpact: e.target.value as ImpactType })}
              className={`w-full p-2 border rounded-md text-sm font-bold ${IMPACT_OPTIONS[data.lastImpact].color}`}
            >
              {Object.entries(IMPACT_OPTIONS).map(([key, opt]) => (
                <option key={key} value={key}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
               ※これを選んでから、左のスライダーを動かして自信度を更新してください。
            </p>
          </div>
        </div>

        {/* Memo */}
        <div className="md:col-span-5 space-y-2">
           <label className="text-xs font-bold text-slate-400">メモ（なぜそう更新したか？）</label>
           <textarea
             value={data.memo}
             onChange={e => onUpdate(data.ideaTitle, { memo: e.target.value })}
             className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 outline-none"
             rows={3}
             placeholder="どのデータ/コメントが効いたか..."
           />
        </div>

      </div>
    </div>
  );
};
