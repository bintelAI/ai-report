
import React, { useState, useEffect } from 'react';
import { WidgetConfig, ChartType, DataSourceConfig } from '../types';
import { X, Layout, Database, Sparkles, Check, PieChart, BarChart3, LineChart, Activity, BoxSelect, ChevronDown, ChevronUp, Type, Settings2, Sliders, Hexagon, ScatterChart, Filter, Cloud, ArrowRightLeft, Tag, Table, Gauge, Grid3X3, Layers, History } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { analyzeChartData } from '../services/geminiService';
import { DataSourcePanel } from './data-source/DataSourcePanel';

const PALETTES = [
  { id: 'default', name: '默认蓝', colors: ['#3b82f6', '#f59e0b', '#10b981'] },
  { id: 'ocean', name: '海洋蓝', colors: ['#0ea5e9', '#3b82f6', '#6366f1'] },
  { id: 'sunset', name: '落日橙', colors: ['#f97316', '#ef4444', '#ec4899'] },
  { id: 'forest', name: '森林绿', colors: ['#22c55e', '#10b981', '#14b8a6'] },
  { id: 'purple', name: '紫罗兰', colors: ['#a855f7', '#d946ef', '#ec4899'] },
];

const CHART_TYPES: {id: ChartType, icon: any, label: string}[] = [
  { id: 'line', icon: LineChart, label: '折线图' },
  { id: 'bar', icon: BarChart3, label: '柱状图' },
  { id: 'pie', icon: PieChart, label: '饼图' },
  { id: 'area', icon: BoxSelect, label: '面积图' },
  { id: 'composed', icon: BarChart3, label: '组合图' }, 
  { id: 'radar', icon: Hexagon, label: '雷达图' },
  { id: 'scatter', icon: ScatterChart, label: '散点图' },
  { id: 'funnel', icon: Filter, label: '漏斗图' },
  { id: 'wordCloud', icon: Cloud, label: '词云' },
  { id: 'stat', icon: Activity, label: '统计' },
  { id: 'table', icon: Table, label: '表格' },
  { id: 'radialBar', icon: Gauge, label: '仪表盘' },
  { id: 'treemap', icon: Grid3X3, label: '矩形树' },
  { id: 'heatmap', icon: Layers, label: '热力图' },
  { id: 'timeline', icon: History, label: '时间轴' },
];

export const WidgetEditor: React.FC = () => {
  const { currentDashboard, selectedWidgetId, updateWidget, setSidebarOpen } = useDashboardStore();
  const widget = currentDashboard.widgets.find(w => w.id === selectedWidgetId);
  
  const [activeTab, setActiveTab] = useState<'visual' | 'data' | 'analysis'>('visual');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    appearance: true,
    advanced: false
  });

  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setAnalysisResult('');
  }, [widget?.id]);

  if (!widget) return null;

  const handleUpdate = (updates: Partial<WidgetConfig>) => updateWidget(widget.id, updates);
  const handleChartConfigUpdate = (updates: any) => updateWidget(widget.id, { chartConfig: { ...widget.chartConfig, ...updates } });
  
  // Data Mapping Handler
  const handleMappingUpdate = (key: string, value: string) => {
    updateWidget(widget.id, {
      dataMapping: {
        ...(widget.dataMapping || { nameKey: 'name', valueKey: 'value' }),
        [key]: value
      }
    });
  };

  const handleDataSourceUpdate = (newConfig: DataSourceConfig, newData?: any[]) => {
      // If data is provided (e.g. from static edit or api preview), update it.
      // Otherwise keep existing data.
      const updates: Partial<WidgetConfig> = { dataSource: newConfig };
      if (newData) {
          updates.data = newData;
      }
      handleUpdate(updates);
  };

  const toggleSection = (section: string) => setOpenSections(prev => ({...prev, [section]: !prev[section]}));

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeChartData(widget);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  // Extract keys from first data item for suggestions
  const dataKeys = widget.data && widget.data.length > 0 ? Object.keys(widget.data[0]) : ['name', 'value'];

  return (
    <div className="w-[400px] bg-base-100 h-full overflow-hidden flex flex-col z-30 transition-all duration-300 text-base-content border-l border-base-200">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-base-200 bg-base-200/50">
        <div>
          <h2 className="font-bold">属性配置</h2>
          <p className="text-xs opacity-60 mt-0.5">实时编辑中 - {widget.id.slice(0, 4)}</p>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="btn btn-sm btn-circle btn-ghost">
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-base-200 bg-base-100">
        {['visual', 'data', 'analysis'].map(tab => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab as any)}
             className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
           >
             {tab === 'visual' && <Layout size={15} />}
             {tab === 'data' && <Database size={15} />}
             {tab === 'analysis' && <Sparkles size={15} />}
             {tab === 'visual' ? '视觉' : tab === 'data' ? '数据' : '智能'}
           </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-base-200/30">
        
        {/* === VISUAL TAB === */}
        {activeTab === 'visual' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-300">
            {/* 1. Basic */}
            <div className="bg-base-100 border border-base-200 rounded-lg overflow-hidden">
               <button onClick={() => toggleSection('basic')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-base-200 transition-colors">
                 <span className="font-semibold text-sm flex items-center gap-2"><Type size={14} /> 基础信息</span>
                 {openSections.basic ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
               </button>
               {openSections.basic && (
                 <div className="p-4 space-y-3">
                   <div className="form-control">
                     <label className="label text-xs font-medium opacity-60">标题</label>
                     <input type="text" className="input input-bordered input-sm w-full" value={widget.title} onChange={(e) => handleUpdate({ title: e.target.value })} />
                   </div>
                   <div className="form-control">
                     <label className="label text-xs font-medium opacity-60">副标题</label>
                     <input type="text" className="input input-bordered input-sm w-full" value={widget.chartConfig?.subTitle || ''} onChange={(e) => handleChartConfigUpdate({ subTitle: e.target.value })} />
                   </div>
                 </div>
               )}
            </div>

            {/* 2. Appearance */}
            <div className="bg-base-100 border border-base-200 rounded-lg overflow-hidden">
               <button onClick={() => toggleSection('appearance')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-base-200 transition-colors">
                 <span className="font-semibold text-sm flex items-center gap-2"><Layout size={14} /> 类型与外观</span>
                 {openSections.appearance ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
               </button>
               {openSections.appearance && (
                 <div className="p-4 space-y-4">
                    {/* Types Grid */}
                    <div className="grid grid-cols-5 gap-2">
                      {CHART_TYPES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleUpdate({ type: t.id as ChartType })}
                          title={t.label}
                          className={`flex items-center justify-center p-2 rounded-lg border transition-all ${widget.type === t.id ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 hover:border-base-content/20'}`}
                        >
                          <t.icon size={18} />
                        </button>
                      ))}
                    </div>
                    {/* ... Palettes and Color Picker ... */}
                    <div>
                      <label className="label text-xs font-medium opacity-60 mb-1 block">预设主题</label>
                      <div className="grid grid-cols-5 gap-2">
                        {PALETTES.map((palette) => (
                          <button
                            key={palette.id}
                            onClick={() => handleUpdate({ theme: palette.id as any, chartConfig: { ...widget.chartConfig, color: undefined } })}
                            className={`h-8 rounded-full border flex items-center justify-center transition-all ${widget.theme === palette.id ? 'border-base-content ring-2 ring-primary/20 scale-110' : 'border-transparent hover:scale-105'}`}
                            style={{ background: `linear-gradient(135deg, ${palette.colors[0]} 0%, ${palette.colors[1]} 100%)` }}
                          >
                            {widget.theme === palette.id && <Check size={12} className="text-white drop-shadow-md" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                       <label className="text-xs font-medium opacity-60">自定义主色</label>
                       <div className="flex items-center gap-2">
                         <input type="color" className="w-8 h-8 rounded cursor-pointer border-0" value={widget.chartConfig?.color || '#3b82f6'} onChange={(e) => handleChartConfigUpdate({ color: e.target.value })} />
                         {widget.chartConfig?.color && (
                           <button onClick={() => handleChartConfigUpdate({ color: undefined })} className="btn btn-xs btn-ghost">重置</button>
                         )}
                       </div>
                    </div>
                 </div>
               )}
            </div>
            {/* ... (Advanced section omitted for brevity, logic remains) ... */}
            <div className="bg-base-100 border border-base-200 rounded-lg overflow-hidden">
               <button onClick={() => toggleSection('advanced')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-base-200 transition-colors">
                 <span className="font-semibold text-sm flex items-center gap-2"><Settings2 size={14} /> 高级设置</span>
                 {openSections.advanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
               </button>
               {openSections.advanced && (
                 <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                       {['showLegend', 'showDataLabels', 'showGrid'].map(k => (
                         (k === 'showGrid' && ['pie', 'stat', 'wordCloud', 'funnel', 'radialBar', 'treemap', 'heatmap', 'timeline'].includes(widget.type)) ? null :
                         (k === 'showLegend' && ['stat'].includes(widget.type)) ? null :
                         <label key={k} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                            <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={(widget as any)[k] !== false} onChange={(e) => handleUpdate({ [k]: e.target.checked })} />
                            {k === 'showLegend' ? '显示图例' : k === 'showDataLabels' ? '数值标签' : '显示网格'}
                         </label>
                       ))}
                    </div>
                    
                    {/* Radial Bar Specific */}
                    {widget.type === 'radialBar' && (
                      <div className="space-y-4 mt-2 p-3 bg-base-200/50 rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="form-control">
                            <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">起始角度 ({widget.chartConfig?.startAngle ?? 180}°)</label>
                            <input type="range" min="0" max="360" step="10" className="range range-xs range-primary" value={widget.chartConfig?.startAngle ?? 180} onChange={(e) => handleChartConfigUpdate({ startAngle: Number(e.target.value) })} />
                          </div>
                          <div className="form-control">
                            <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">结束角度 ({widget.chartConfig?.endAngle ?? 0}°)</label>
                            <input type="range" min="0" max="360" step="10" className="range range-xs range-primary" value={widget.chartConfig?.endAngle ?? 0} onChange={(e) => handleChartConfigUpdate({ endAngle: Number(e.target.value) })} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="form-control">
                            <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">内半径 ({widget.chartConfig?.innerRadius ?? 30}%)</label>
                            <input type="range" min="0" max="100" step="5" className="range range-xs range-primary" value={widget.chartConfig?.innerRadius ?? 30} onChange={(e) => handleChartConfigUpdate({ innerRadius: Number(e.target.value) })} />
                          </div>
                          <div className="form-control">
                            <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">外半径 ({widget.chartConfig?.outerRadius ?? 100}%)</label>
                            <input type="range" min="0" max="100" step="5" className="range range-xs range-primary" value={widget.chartConfig?.outerRadius ?? 100} onChange={(e) => handleChartConfigUpdate({ outerRadius: Number(e.target.value) })} />
                          </div>
                        </div>

                        <div className="form-control">
                          <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">条形粗细 ({widget.chartConfig?.barSize ?? 20}px)</label>
                          <input type="range" min="5" max="50" step="1" className="range range-xs range-primary" value={widget.chartConfig?.barSize ?? 20} onChange={(e) => handleChartConfigUpdate({ barSize: Number(e.target.value) })} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="form-control">
                            <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">圆角程度 ({widget.chartConfig?.cornerRadius ?? 0}px)</label>
                            <input type="range" min="0" max="25" step="1" className="range range-xs range-primary" value={widget.chartConfig?.cornerRadius ?? 0} onChange={(e) => handleChartConfigUpdate({ cornerRadius: Number(e.target.value) })} />
                          </div>
                          <div className="form-control">
                            <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">背景透明度 ({Math.round((widget.chartConfig?.backgroundOpacity ?? 0.3) * 100)}%)</label>
                            <input type="range" min="0" max="1" step="0.1" className="range range-xs range-primary" value={widget.chartConfig?.backgroundOpacity ?? 0.3} onChange={(e) => handleChartConfigUpdate({ backgroundOpacity: Number(e.target.value) })} />
                          </div>
                        </div>

                        <div className="divider my-1 opacity-20"></div>

                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={widget.chartConfig?.showCenterLabel !== false} onChange={(e) => handleChartConfigUpdate({ showCenterLabel: e.target.checked })} />
                          <span>显示中心标签</span>
                        </label>

                        {widget.chartConfig?.showCenterLabel !== false && (
                          <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                            <div className="form-control">
                              <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">标签文字</label>
                              <input type="text" className="input input-bordered input-xs" placeholder="例如: 平均达成率" value={widget.chartConfig?.centerLabel || ''} onChange={(e) => handleChartConfigUpdate({ centerLabel: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="form-control">
                                <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">数值单位</label>
                                <input type="text" className="input input-bordered input-xs" placeholder="%" value={widget.chartConfig?.valueUnit || ''} onChange={(e) => handleChartConfigUpdate({ valueUnit: e.target.value })} />
                              </div>
                              <div className="form-control">
                                <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">计算方式</label>
                                <select className="select select-bordered select-xs" value={widget.chartConfig?.centerValueType || 'avg'} onChange={(e) => handleChartConfigUpdate({ centerValueType: e.target.value })}>
                                  <option value="avg">平均值</option>
                                  <option value="sum">合计</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Treemap Specific */}
                    {widget.type === 'treemap' && (
                      <div className="form-control mt-2">
                        <label className="label text-xs font-medium opacity-60">宽高比 ({widget.chartConfig?.aspectRatio ?? '4/3'})</label>
                        <select className="select select-bordered select-xs w-full" value={widget.chartConfig?.aspectRatio || 1.33} onChange={(e) => handleChartConfigUpdate({ aspectRatio: Number(e.target.value) })}>
                          <option value={1}>1:1 (正方形)</option>
                          <option value={1.33}>4:3 (标准)</option>
                          <option value={1.77}>16:9 (宽屏)</option>
                          <option value={2}>2:1 (全宽)</option>
                        </select>
                      </div>
                    )}

                    {/* Timeline Specific */}
                    {widget.type === 'timeline' && (
                      <div className="form-control mt-2">
                        <label className="label text-xs font-medium opacity-60">排列方向</label>
                        <select className="select select-bordered select-xs w-full" value={widget.chartConfig?.layout || 'vertical'} onChange={(e) => handleChartConfigUpdate({ layout: e.target.value as any })}>
                          <option value="vertical">纵向 (列表式)</option>
                          <option value="horizontal">横向 (横轴式)</option>
                        </select>
                      </div>
                    )}

                    {/* Reference Line */}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* === DATA TAB === */}
        {activeTab === 'data' && (
           <div className="h-full flex flex-col">
             {/* Data Mapping Section */}
             <div className="bg-base-100 border-b border-base-200 p-4 animate-in fade-in">
               <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700">
                  <ArrowRightLeft size={16} /> 数据字段映射
               </div>
               <div className="grid grid-cols-2 gap-3 mb-3">
                 <div className="form-control">
                   <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">{widget.type === 'heatmap' ? '维度 X (列)' : '维度 (X轴/分类)'}</label>
                   <select 
                     className="select select-bordered select-xs w-full" 
                     value={widget.dataMapping?.nameKey || 'name'}
                     onChange={(e) => handleMappingUpdate('nameKey', e.target.value)}
                   >
                     {dataKeys.map(k => <option key={k} value={k}>{k}</option>)}
                     {!dataKeys.includes(widget.dataMapping?.nameKey || 'name') && <option value={widget.dataMapping?.nameKey}>{widget.dataMapping?.nameKey}</option>}
                   </select>
                 </div>
                 <div className="form-control">
                   <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">指标 (数值)</label>
                   <select 
                     className="select select-bordered select-xs w-full" 
                     value={widget.dataMapping?.valueKey || 'value'}
                     onChange={(e) => handleMappingUpdate('valueKey', e.target.value)}
                   >
                     {dataKeys.map(k => <option key={k} value={k}>{k}</option>)}
                     {!dataKeys.includes(widget.dataMapping?.valueKey || 'value') && <option value={widget.dataMapping?.valueKey}>{widget.dataMapping?.valueKey}</option>}
                   </select>
                 </div>
               </div>

               {widget.type === 'heatmap' && (
                 <div className="form-control mb-3 animate-in slide-in-from-top-1">
                   <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">维度 Y (行)</label>
                   <select 
                     className="select select-bordered select-xs w-full" 
                     value={widget.dataMapping?.yKey || 'y'}
                     onChange={(e) => handleMappingUpdate('yKey', e.target.value)}
                   >
                     {dataKeys.map(k => <option key={k} value={k}>{k}</option>)}
                     {!dataKeys.includes(widget.dataMapping?.yKey || 'y') && <option value={widget.dataMapping?.yKey}>{widget.dataMapping?.yKey}</option>}
                   </select>
                 </div>
               )}
               <div className="form-control">
                 <label className="label text-[10px] font-bold opacity-60 p-0 mb-1">指标名称</label>
                 <input 
                   type="text" 
                   className="input input-bordered input-xs" 
                   placeholder="例如: 销售额"
                   value={widget.dataMapping?.seriesName || ''}
                   onChange={(e) => handleMappingUpdate('seriesName', e.target.value)}
                 />
               </div>
             </div>

             {/* DataSource Panel */}
             <div className="flex-1 min-h-0">
               <DataSourcePanel 
                 config={widget.dataSource} 
                 onUpdate={handleDataSourceUpdate}
               />
             </div>
           </div>
        )}

        {/* === ANALYSIS TAB === */}
        {activeTab === 'analysis' && (
           <div className="space-y-4 animate-in fade-in duration-300 p-4">
             <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
                <div className="flex items-center gap-2 mb-3 text-primary">
                  <Sparkles size={16} />
                  <h3 className="font-bold text-sm">AI 商业洞察</h3>
                </div>
                {!analysisResult ? (
                  <div className="text-center py-6">
                    <button onClick={runAnalysis} disabled={isAnalyzing} className="btn btn-sm btn-primary w-full">
                      {isAnalyzing ? <span className="loading loading-spinner loading-xs"></span> : '开始分析'}
                    </button>
                  </div>
                ) : (
                  <div className="prose prose-sm">
                    <p className="text-sm opacity-80 leading-relaxed bg-base-100 p-3 rounded border border-base-200">{analysisResult}</p>
                    <button onClick={runAnalysis} className="btn btn-xs btn-ghost text-primary w-full mt-2">重新分析</button>
                  </div>
                )}
             </div>
           </div>
        )}
      </div>
    </div>
  );
};
