
import React, { useState, useEffect } from 'react';
import { Bot, Send, X, Sparkles, PieChart, Layers } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { generateDashboardFromText, modifyDashboardConfig } from '../services/geminiService';
import { WidgetConfig } from '../types';

export const AICopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const { 
    replaceDashboard, 
    setLoadingAI, 
    isLoadingAI, 
    selectedWidgetId, 
    currentDashboard,
    updateWidget,
    updateWidgets
  } = useDashboardStore();

  const selectedWidget = currentDashboard.widgets.find(w => w.id === selectedWidgetId);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      document.getElementById('ai-prompt-input')?.focus();
    }
  }, [isOpen]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoadingAI) return;

    setLoadingAI(true);
    
    try {
      if (selectedWidget) {
        // --- Single Widget Context ---
        const modifiedWidget = await modifyDashboardConfig(selectedWidget, prompt);
        
        if (modifiedWidget && typeof modifiedWidget === 'object') {
           updateWidget(selectedWidget.id, { ...modifiedWidget, id: selectedWidget.id });
        } else {
           alert("AI 未返回有效的组件配置");
        }
      } else {
        // --- Global Context ---
        
        if (currentDashboard.widgets.length > 0) {
           // Modify existing
           const modifiedResult = await modifyDashboardConfig({ 
               widgets: currentDashboard.widgets, 
               parameters: currentDashboard.parameters 
           }, prompt);
           
           if (modifiedResult) {
             const newWidgets = modifiedResult.widgets || currentDashboard.widgets;
             const newParams = modifiedResult.parameters || currentDashboard.parameters;
             replaceDashboard(newWidgets, newParams);
           }
        } else {
           // New generation
           const { widgets, parameters } = await generateDashboardFromText(prompt);
           if (widgets.length > 0) {
             replaceDashboard(widgets, parameters);
             useDashboardStore.getState().setDashboardTitle(prompt.slice(0, 10) + "...");
           }
        }
      }
    } catch (error) {
      console.error(error);
      alert("AI 处理失败，请检查配置或网络。");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <>
      {/* Floating Action Button - Icon Only */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 btn btn-circle btn-lg shadow-xl z-50 transition-all duration-300 ${isOpen ? 'btn-neutral rotate-45' : 'btn-primary animate-bounce hover:animate-none'} text-white border-none`}
        title="AI 助手"
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} />}
      </button>

      {/* Chat Window - Bottom Right, No Overlay */}
      {isOpen && (
        <div className="fixed bottom-24 right-8 z-[49] w-96 max-w-[calc(100vw-2rem)] flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-base-100 rounded-2xl shadow-2xl border border-base-200 overflow-hidden flex flex-col max-h-[600px]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-blue-600 p-4 flex justify-between items-center shrink-0">
              <div className="text-white flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Bot size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-base leading-tight">AI 架构师</h2>
                  <p className="text-blue-100 text-xs opacity-90">Gemini 2.5 Flash</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="btn btn-circle btn-ghost btn-xs text-white/80 hover:bg-white/20">
                <X size={16} />
              </button>
            </div>

            {/* Context Indicator */}
            <div className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-b border-base-200 ${selectedWidget ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}`}>
               {selectedWidget ? (
                 <>
                   <PieChart size={12} />
                   正在编辑: <span className="font-bold truncate max-w-[150px]">{selectedWidget.title}</span>
                 </>
               ) : (
                 <>
                   <Layers size={12} />
                   当前上下文: 全局仪表盘 ({currentDashboard.widgets.length} 个图表)
                 </>
               )}
            </div>

            {/* Body */}
            <form onSubmit={handleGenerate} className="p-4 flex flex-col gap-3 bg-base-100">
              <div className="chat chat-start">
                <div className="chat-image avatar">
                  <div className="w-8 rounded-full bg-primary/10 p-1">
                    <Bot size="100%" className="text-primary"/>
                  </div>
                </div>
                <div className="chat-bubble chat-bubble-primary text-sm">
                  {selectedWidget 
                    ? `已选中「${selectedWidget.title}」。您想如何修改它？比如“改成柱状图”或“把数据改成上升趋势”。` 
                    : "您想如何调整整个仪表盘？可以尝试：“创建一个带有年份筛选和区域销售对比的报表”。"
                  }
                </div>
              </div>

              {/* Input Area */}
              <div className="form-control w-full mt-2">
                <div className="relative">
                  <textarea 
                    id="ai-prompt-input"
                    className="textarea textarea-bordered w-full h-24 pr-10 text-sm focus:outline-none focus:border-primary resize-none bg-base-200/50 focus:bg-base-100 transition-colors disabled:bg-base-200 disabled:opacity-50" 
                    placeholder={selectedWidget ? "例如：把颜色改成红色..." : "例如：添加一个关于用户增长的折线图..."}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoadingAI}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate(e);
                      }
                    }}
                  ></textarea>
                  <button 
                    type="submit" 
                    disabled={!prompt.trim() || isLoadingAI}
                    className={`absolute bottom-3 right-3 btn btn-sm btn-circle btn-primary text-white transition-all 
                      ${(!prompt.trim() || isLoadingAI) ? 'opacity-50 cursor-not-allowed' : 'opacity-100 shadow-lg'}
                    `}
                  >
                    {isLoadingAI ? <span className="loading loading-spinner loading-xs"></span> : <Send size={14} />}
                  </button>
                </div>
                <label className="label flex justify-between">
                  <span className="label-text-alt text-xs text-slate-400">Shift + Enter 换行</span>
                  {prompt && !isLoadingAI && (
                    <span 
                      className="label-text-alt text-xs text-slate-400 cursor-pointer hover:text-primary"
                      onClick={() => setPrompt('')}
                    >
                      清空
                    </span>
                  )}
                </label>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading Toast */}
      {isLoadingAI && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 pointer-events-none">
           <div className="alert alert-info shadow-lg bg-white border-primary/20 text-slate-700">
             <span className="loading loading-spinner loading-md text-primary"></span>
             <div>
               <h3 className="font-bold text-sm">AI 正在思考中...</h3>
               <div className="text-xs opacity-70">
                 {selectedWidget ? '正在优化选中的图表' : '正在构建报表架构与筛选逻辑'}
               </div>
             </div>
           </div>
        </div>
      )}
    </>
  );
};
