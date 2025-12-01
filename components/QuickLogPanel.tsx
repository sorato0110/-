import React, { useState, useEffect, useRef } from 'react';
import { HypothesisItem, KpiConfigItem, DailyLog } from '../types';
import { X, Send, MessageSquarePlus, ChevronLeft, Calendar } from 'lucide-react';

interface QuickLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
  runningItems: HypothesisItem[];
  kpiConfig: KpiConfigItem[];
  onAddLog: (itemId: string, log: DailyLog) => void;
}

export const QuickLogPanel: React.FC<QuickLogPanelProps> = ({
  isOpen,
  onClose,
  runningItems,
  kpiConfig,
  onAddLog
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showProjectList, setShowProjectList] = useState(true);

  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [memo, setMemo] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset view when opening/closing
  useEffect(() => {
    if (isOpen) {
      if (runningItems.length === 1) {
        setSelectedItemId(runningItems[0].id);
        setShowProjectList(false);
      } else {
        setShowProjectList(true);
      }
    }
  }, [isOpen, runningItems]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedItemId, showProjectList, isOpen]); // Trigger when view changes

  const handleProjectSelect = (id: string) => {
    setSelectedItemId(id);
    setShowProjectList(false);
    // Reset form
    setDate(new Date().toISOString().split('T')[0]);
    setMetrics({});
    setMemo('');
  };

  const handleBackToList = () => {
    setShowProjectList(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;

    const numMetrics: Record<string, number> = {};
    Object.entries(metrics).forEach(([key, val]) => {
      if (val) numMetrics[key] = Number(val);
    });

    const newLog: DailyLog = {
      id: Date.now().toString(),
      date,
      metrics: numMetrics,
      memo,
      createdAt: Date.now(),
    };

    onAddLog(selectedItemId, newLog);
    
    // Clear inputs but keep date
    setMetrics({});
    setMemo('');
  };

  const selectedItem = runningItems.find(item => item.id === selectedItemId);
  const logs = selectedItem?.dailyLogs || [];

  // Sort logs by date asc
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-end justify-end pointer-events-none">
      {/* Backdrop for mobile */}
      <div className="absolute inset-0 bg-black/20 pointer-events-auto sm:bg-transparent" onClick={onClose} />

      {/* Main Panel */}
      <div className="pointer-events-auto w-full sm:w-[400px] h-[85vh] sm:h-[600px] bg-white shadow-2xl rounded-t-2xl sm:rounded-tl-2xl sm:rounded-tr-2xl sm:mr-4 sm:mb-0 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300 border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-800 text-white p-4 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            {!showProjectList && runningItems.length > 1 && (
              <button onClick={handleBackToList} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
                <ChevronLeft size={20} />
              </button>
            )}
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquarePlus size={18} />
              {showProjectList ? '進捗ログを記録' : 'トーク'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-100">
          
          {showProjectList ? (
            /* Project List View */
            <div className="p-4 space-y-3 overflow-y-auto">
               <p className="text-xs text-slate-500 mb-2 font-bold px-1">記録するプロジェクトを選択</p>
               {runningItems.length === 0 ? (
                 <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                   実行中の仮説がありません。<br/>ステータスを「実行中」にしてください。
                 </div>
               ) : (
                 runningItems.map(item => (
                   <button
                     key={item.id}
                     onClick={() => handleProjectSelect(item.id)}
                     className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-left hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                   >
                     <div className="font-bold text-slate-800 mb-1 group-hover:text-indigo-700">{item.ideaTitle}</div>
                     <div className="text-xs text-slate-500 truncate">{item.hypothesis}</div>
                     <div className="flex justify-between items-center mt-3">
                       <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                         ログ: {item.dailyLogs?.length || 0}件
                       </span>
                       <span className="text-xs text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">
                         選択 &rarr;
                       </span>
                     </div>
                   </button>
                 ))
               )}
            </div>
          ) : (
            /* Chat Room View */
            <>
              {/* Messages Area */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-4"
                ref={scrollRef}
              >
                {/* Info Header in Chat */}
                <div className="text-center py-2">
                   <span className="text-[10px] bg-slate-200 text-slate-500 px-3 py-1 rounded-full">
                     {selectedItem?.ideaTitle}
                   </span>
                </div>

                {sortedLogs.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    まだ記録がありません。<br/>今日の進捗を入力してみましょう！
                  </div>
                )}

                {sortedLogs.map((log) => (
                  <div key={log.id} className="flex flex-col items-end animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-slate-400">{log.date}</span>
                    </div>
                    <div className="bg-white border border-indigo-100 p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] text-sm relative group">
                      {/* Metrics Bubble */}
                      {Object.keys(log.metrics).length > 0 && (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2 border-b border-dashed border-slate-100 pb-2">
                          {Object.entries(log.metrics).map(([key, val]) => {
                             const config = kpiConfig.find(k => k.id === key);
                             return (
                               <div key={key} className="flex flex-col">
                                 <span className="text-[10px] text-slate-400 font-bold uppercase">{config?.label || key}</span>
                                 <span className="font-mono font-bold text-indigo-600">{val}</span>
                               </div>
                             );
                          })}
                        </div>
                      )}
                      {/* Memo Bubble */}
                      <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                        {log.memo || <span className="text-slate-300 italic">メモなし</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="bg-white border-t border-slate-200 p-3 shrink-0">
                <form onSubmit={handleSubmit} className="space-y-3">
                  
                  {/* Top Row: Date & Metrics */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                     <div className="shrink-0 relative">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 w-[110px] outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                        <Calendar size={12} className="absolute left-2.5 top-2 text-slate-400 pointer-events-none"/>
                     </div>
                     
                     {/* Dynamic Metrics Inputs */}
                     {kpiConfig.map(kpi => (
                       <div key={kpi.id} className="shrink-0 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                         <span className="text-[10px] text-slate-500 font-bold mr-2 whitespace-nowrap">{kpi.label}</span>
                         <input
                           type="number"
                           placeholder="0"
                           value={metrics[kpi.id] || ''}
                           onChange={(e) => setMetrics({...metrics, [kpi.id]: e.target.value})}
                           className="w-12 bg-transparent text-sm font-bold text-indigo-600 outline-none placeholder:text-slate-300"
                         />
                       </div>
                     ))}
                  </div>

                  {/* Bottom Row: Memo & Send */}
                  <div className="flex items-end gap-2">
                    <textarea
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      placeholder="ひとことメモ (例: インプレッションが急増した)"
                      rows={1}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                    <button
                      type="submit"
                      disabled={!memo && Object.keys(metrics).length === 0}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white p-3 rounded-full shadow-md transition-all active:scale-95"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};