
import React, { useEffect, useState } from 'react';
import { DataSourceConfig, DataSourceMode, DashboardParameter } from '../../types';
import { StaticDataEditor } from './StaticDataEditor';
import { SqlDataEditor } from './SqlDataEditor';
import { ApiDataEditor } from './ApiDataEditor';
import { Info } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';

interface Props {
  config?: DataSourceConfig;
  onUpdate: (newConfig: DataSourceConfig, resultingData?: any[]) => void;
  // Optional context for displaying available variables
  showVariableHint?: boolean;
}

const DEFAULT_CONFIG: DataSourceConfig = {
    mode: 'static',
    staticData: []
};

export const DataSourcePanel: React.FC<Props> = ({ config = DEFAULT_CONFIG, onUpdate, showVariableHint = true }) => {
  const { currentDashboard } = useDashboardStore();
  const parameters = currentDashboard.parameters;
  const currentMode = config.mode || 'static';
  
  // Local state to manage rapid mode switching updates before committing
  const [localConfig, setLocalConfig] = useState<DataSourceConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleModeChange = (targetMode: DataSourceMode) => {
    const newConfig: DataSourceConfig = {
        ...localConfig,
        mode: targetMode
    };
    setLocalConfig(newConfig);
    // When mode changes, we propagate config update. 
    // Data is usually undefined here unless we fallback to static data, but let parent decide logic.
    onUpdate(newConfig, targetMode === 'static' ? newConfig.staticData : undefined);
  };

  const handleEditorUpdate = (data: any[], subConfig: any) => {
    const mode = localConfig.mode;
    const newConfig = {
        ...localConfig,
        [mode]: { ...localConfig[mode as keyof DataSourceConfig] as any, ...subConfig },
        // If updating static, also sync staticData property
        staticData: mode === 'static' ? data : localConfig.staticData
    };
    setLocalConfig(newConfig);
    onUpdate(newConfig, data);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 p-4">
      {/* Mode Switcher - Dropdown */}
      <div className="form-control mb-4">
        <label className="label text-xs font-bold opacity-70">数据来源模式</label>
        <select 
          className="select select-bordered select-sm w-full font-medium"
          value={currentMode}
          onChange={(e) => handleModeChange(e.target.value as DataSourceMode)}
        >
          <option value="static">📁 本地静态数据 (Static JSON)</option>
          <option value="sql">🗄️ SQL 数据库 (Simulation)</option>
          <option value="api">🌐 远程 API 接口 (REST/HTTP)</option>
        </select>
      </div>

      {showVariableHint && parameters.length > 0 && currentMode !== 'static' && (
         <div className="alert alert-info py-2 px-3 text-xs mb-3 flex items-start gap-2">
            <Info size={14} className="mt-0.5 shrink-0"/>
            <div>
               参数绑定: 使用 <code className="bg-white/30 px-1 rounded font-bold">{`{{变量名}}`}</code>
               <div className="opacity-70 mt-1">
                  可用变量: {parameters.map(p => p.key).join(', ')}
               </div>
            </div>
         </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-h-0 bg-base-100 border border-base-200 rounded-xl p-3 shadow-sm relative overflow-y-auto custom-scrollbar">
        {currentMode === 'static' && (
          <StaticDataEditor 
             config={localConfig} 
             onUpdate={(d) => handleEditorUpdate(d, {})} 
          />
        )}
        {currentMode === 'sql' && (
          <SqlDataEditor 
            config={localConfig} 
            onUpdate={(d, cfg) => handleEditorUpdate(d, cfg)} 
          />
        )}
        {currentMode === 'api' && (
          <ApiDataEditor 
            config={localConfig} 
            onUpdate={(d, cfg) => handleEditorUpdate(d, cfg)} 
          />
        )}
      </div>
    </div>
  );
};
