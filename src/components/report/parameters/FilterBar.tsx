
import React, { useEffect } from 'react';
import { Search, SlidersHorizontal, Edit2, ArrowRight, LayoutTemplate, Sparkles } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { DashboardParameter } from '../types';

export const FilterBar: React.FC = () => {
  const { 
    currentDashboard, 
    parameterValues, 
    setParameterValue, 
    refreshAllCharts, 
    refreshParameterOptions,
    isRefreshing,
    setFilterEditorOpen,
    setTemplateGalleryOpen
  } = useDashboardStore();

  const { parameters } = currentDashboard;

  useEffect(() => {
    const missingOptions = parameters.some(p => p.type === 'select' && (!p.loadedOptions || p.loadedOptions.length === 0));
    if (missingOptions || parameters.length > 0) {
       refreshParameterOptions();
    }
  }, [parameters.length, JSON.stringify(parameters.map(p => ({id: p.id, type: p.type, srcMode: p.optionsDataSource?.mode})))]);

  const handleChange = (key: string, val: any) => {
    setParameterValue(key, val);
  };

  const handleSearch = () => {
    refreshAllCharts();
  };

  const renderInput = (param: DashboardParameter) => {
    const value = parameterValues[param.key] || '';
    switch (param.type) {
      case 'select':
        return (
          <select 
            className="select select-sm select-bordered max-w-xs bg-base-100 min-w-[120px]"
            value={value}
            onChange={(e) => handleChange(param.key, e.target.value)}
          >
             <option value="" disabled>选择{param.label}...</option>
             {param.loadedOptions?.map((opt, idx) => (
                <option key={`${opt.value}-${idx}`} value={opt.value}>{opt.label}</option>
             ))}
             {(!param.loadedOptions || param.loadedOptions.length === 0) && <option disabled>无选项数据</option>}
          </select>
        );
      case 'date':
        return (
           <input type="date" className="input input-sm input-bordered bg-base-100" value={value} onChange={(e) => handleChange(param.key, e.target.value)} />
        );
      case 'date-range':
        const startKey = `${param.key}_start`;
        const endKey = `${param.key}_end`;
        return (
          <div className="flex items-center gap-1 bg-base-100 rounded-lg border border-base-300 px-2 py-0.5 shadow-sm">
             <input type="date" className="input input-ghost input-xs h-7 px-1 focus:bg-transparent focus:outline-none w-28 text-center" value={parameterValues[startKey] || ''} onChange={(e) => handleChange(startKey, e.target.value)} placeholder="开始时间" />
             <ArrowRight size={12} className="text-slate-400" />
             <input type="date" className="input input-ghost input-xs h-7 px-1 focus:bg-transparent focus:outline-none w-28 text-center" value={parameterValues[endKey] || ''} onChange={(e) => handleChange(endKey, e.target.value)} placeholder="结束时间" />
          </div>
        );
      case 'text':
      default:
        return (
           <input type="text" placeholder={`输入${param.label}...`} className="input input-sm input-bordered bg-base-100 w-32 focus:w-48 transition-all" value={value} onChange={(e) => handleChange(param.key, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
        );
    }
  };

  return (
    <div className="bg-base-100 border-b border-base-200 px-6 py-3 flex flex-wrap items-center gap-4 sticky top-16 z-40 shadow-sm animate-in fade-in slide-in-from-top-2">
      
      {/* Template Gallery Trigger - FAR LEFT */}
      <button 
        className="btn btn-sm btn-primary gap-2 shadow-lg shadow-primary/20 group relative overflow-hidden px-4"
        onClick={() => setTemplateGalleryOpen(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
        <LayoutTemplate size={16} className="group-hover:rotate-12 transition-transform" />
        <span className="font-bold">模板市场</span>
        <Sparkles size={12} className="text-yellow-300 animate-pulse" />
      </button>

      <div className="divider divider-horizontal mx-0"></div>

      {parameters.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mr-2">
            <SlidersHorizontal size={16} />
            <span>数据筛选:</span>
          </div>
          {parameters.map((param) => (
            <div key={param.id} className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 select-none">{param.label}</label>
                {renderInput(param)}
            </div>
          ))}
          <div className="divider divider-horizontal mx-0"></div>
          <button className="btn btn-sm btn-primary text-white gap-2 px-6" onClick={handleSearch} disabled={isRefreshing}>
            <Search size={16} className={isRefreshing ? 'hidden' : ''} />
            {isRefreshing ? <span className="loading loading-spinner loading-xs"></span> : '执行查询'}
          </button>
        </>
      )}

      {parameters.length === 0 && (
        <span className="text-xs text-slate-400 italic">暂无筛选器，点击右侧图标添加变量以绑定图表数据</span>
      )}

      <button className="btn btn-sm btn-ghost btn-circle ml-auto tooltip tooltip-left" data-tip="配置全局变量" onClick={() => setFilterEditorOpen(true)}>
        <Edit2 size={16} className="text-slate-400 hover:text-primary"/>
      </button>
    </div>
  );
};
