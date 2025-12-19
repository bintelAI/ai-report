
import React, { useState } from 'react';
import { X, Plus, Trash2, Save, SlidersHorizontal, RotateCw, CalendarDays, ArrowRight } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { DashboardParameter, ParameterType } from '../types';
import { DataSourcePanel } from '../dashboard/data-source/DataSourcePanel'; 

export const FilterEditor: React.FC = () => {
  const { currentDashboard, updateParameter, addParameter, removeParameter, setFilterEditorOpen, refreshParameterOptions } = useDashboardStore();
  const { parameters } = currentDashboard;

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    addParameter({
        key: 'new_param',
        label: '新筛选器',
        type: 'text',
        defaultValue: ''
    });
  };

  const handleTypeChange = (id: string, type: ParameterType) => {
      const updates: any = { type };
      
      // If switching to select, ensure we have a default data source AND initialized options
      if (type === 'select') {
          const defaultData = [{label: '选项A', value: 'a'}, {label: '选项B', value: 'b'}];
          updates.optionsDataSource = { 
              mode: 'static', 
              staticData: defaultData 
          };
          // Critical Fix: Immediately populate loadedOptions so UI isn't empty
          updates.loadedOptions = defaultData;
      } else {
          // Clear options if not select
          updates.loadedOptions = undefined;
      }
      
      updateParameter(id, updates);
  };

  const handleDataSourceUpdate = (id: string, newConfig: any) => {
      const updates: any = { optionsDataSource: newConfig };
      
      // REAL-TIME PREVIEW FIX:
      // If mode is static, immediately update loadedOptions without waiting for manual refresh
      if (newConfig.mode === 'static' && Array.isArray(newConfig.staticData)) {
          updates.loadedOptions = newConfig.staticData.map((item: any) => ({
                label: item.label || item.name || item.text || String(item.value),
                value: item.value !== undefined ? item.value : item.id
          }));
      }

      updateParameter(id, updates);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
         {/* Header */}
         <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-200/50">
           <h3 className="font-bold text-lg flex items-center gap-2">
             <SlidersHorizontal size={20} className="text-primary"/> 筛选器配置
           </h3>
           <button onClick={() => setFilterEditorOpen(false)} className="btn btn-ghost btn-sm btn-circle">
             <X size={18} />
           </button>
         </div>

         {/* Body */}
         <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            <div className="alert bg-blue-50 text-blue-800 text-xs border-blue-100">
                <span>提示: 在图表 SQL 或 API URL 中使用 <code className="bg-white px-1 rounded font-bold">{`{{变量名}}`}</code> 来引用这些筛选值。</span>
            </div>

            {parameters.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                    暂无筛选器，点击下方按钮添加
                </div>
            )}

            <div className="space-y-3">
                {parameters.map(param => (
                    <div key={param.id} className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-box overflow-visible">
                        <input type="checkbox" checked={editingId === param.id} onChange={() => setEditingId(editingId === param.id ? null : param.id)} /> 
                        <div className="collapse-title font-medium flex items-center gap-3">
                             <span className="badge badge-primary badge-outline badge-sm">{param.type === 'date-range' ? '日期范围' : param.type}</span>
                             <span>{param.label}</span>
                             <code className="text-xs text-slate-400 bg-base-200 px-1 rounded">{`{{${param.key}}}`}</code>
                        </div>
                        <div className="collapse-content border-t border-base-200 pt-3">
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <div className="form-control">
                                    <label className="label text-xs">显示标签</label>
                                    <input className="input input-sm input-bordered" value={param.label} onChange={(e) => updateParameter(param.id, { label: e.target.value })} />
                                </div>
                                <div className="form-control">
                                    <label className="label text-xs">变量名 (Key)</label>
                                    <input className="input input-sm input-bordered font-mono" value={param.key} onChange={(e) => updateParameter(param.id, { key: e.target.value })} />
                                </div>
                                <div className="form-control">
                                    <label className="label text-xs">类型</label>
                                    <select className="select select-sm select-bordered" value={param.type} onChange={(e) => handleTypeChange(param.id, e.target.value as any)}>
                                        <option value="text">文本框 (Text)</option>
                                        <option value="select">下拉框 (Select)</option>
                                        <option value="date">日期 (Date)</option>
                                        <option value="date-range">日期范围 (Start ~ End)</option>
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label text-xs">默认值</label>
                                    <input 
                                        className="input input-sm input-bordered" 
                                        value={param.defaultValue || ''} 
                                        onChange={(e) => updateParameter(param.id, { defaultValue: e.target.value })}
                                        disabled={param.type === 'date-range'}
                                        placeholder={param.type === 'date-range' ? '不支持默认值' : ''}
                                    />
                                </div>
                            </div>

                            {/* Type Specific Hints / Configs */}
                            {param.type === 'date-range' && (
                                <div className="mt-3 p-3 bg-base-200/50 rounded-lg border border-base-200 flex items-start gap-3 text-xs text-slate-600">
                                    <CalendarDays size={16} className="mt-0.5 text-primary shrink-0"/>
                                    <div>
                                        <p className="font-bold mb-1">日期范围变量说明</p>
                                        <p>此类型将生成两个变量供查询使用：</p>
                                        <ul className="list-disc list-inside mt-1 font-mono text-primary space-y-1">
                                            <li>{`{{${param.key}_start}}`} <span className="text-slate-400">- 开始日期</span></li>
                                            <li>{`{{${param.key}_end}}`} <span className="text-slate-400">- 结束日期</span></li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Select Options Config using REUSABLE DataSourcePanel */}
                            {param.type === 'select' && (
                                <div className="mt-3 border border-base-200 rounded-lg p-2 bg-base-50">
                                    <div className="text-xs font-bold text-slate-500 mb-2 px-2 flex justify-between items-center">
                                       <span>选项数据源 (需包含 label, value 字段)</span>
                                       <button 
                                          className="btn btn-xs btn-ghost gap-1 text-primary"
                                          onClick={() => refreshParameterOptions()}
                                       >
                                          <RotateCw size={12}/> 刷新预览
                                       </button>
                                    </div>
                                    
                                    <div className="h-96 relative bg-white rounded border border-base-200 flex flex-col overflow-hidden shadow-sm">
                                        <DataSourcePanel 
                                            config={param.optionsDataSource} 
                                            onUpdate={(newConfig) => handleDataSourceUpdate(param.id, newConfig)}
                                            showVariableHint={false} 
                                        />
                                    </div>
                                    <div className="mt-2 text-[10px] text-slate-400 px-2 flex items-center gap-2">
                                        <span>当前预览:</span>
                                        <div className="flex gap-1 overflow-x-auto max-w-full">
                                            {param.loadedOptions?.slice(0, 5).map((o, i) => (
                                                <span key={i} className="bg-white border px-1 rounded truncate max-w-[80px]">
                                                    {o.label}
                                                </span>
                                            ))}
                                            {(param.loadedOptions?.length || 0) > 5 && <span>...</span>}
                                            {(!param.loadedOptions || param.loadedOptions.length === 0) && <span>(无数据)</span>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-3 flex justify-end">
                                <button className="btn btn-xs btn-error btn-outline" onClick={() => removeParameter(param.id)}>
                                    <Trash2 size={12}/> 删除此筛选器
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="btn btn-outline btn-primary btn-block border-dashed" onClick={handleAdd}>
                <Plus size={16} /> 添加新筛选器
            </button>
         </div>

         <div className="p-4 border-t border-base-200 flex justify-end">
           <button onClick={() => setFilterEditorOpen(false)} className="btn btn-primary text-white">
             <Save size={16} /> 完成
           </button>
         </div>
      </div>
    </div>
  );
};
