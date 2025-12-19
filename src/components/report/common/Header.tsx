
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Save, Settings, X, Moon, Sun, Monitor, Key, Globe, Database, Download, Upload as UploadIcon, FileJson, RotateCw, SlidersHorizontal, CloudUpload, CheckCircle2 } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

export const Header: React.FC = () => {
  const { currentDashboard, setDashboardTitle, settings, updateSettings, updateAISettings, loadDashboard, refreshAllCharts, isRefreshing, setFilterEditorOpen } = useDashboardStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', description: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  
  const [localSettings, setLocalSettings] = useState(settings.ai);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    if (isSettingsOpen) {
      setLocalSettings(settings.ai);
    }
  }, [isSettingsOpen, settings.ai]);

  useEffect(() => {
    const mode = localStorage.getItem('mode');
    setIsDevMode(mode === 'dev');
  }, []);

  const handleSaveSettings = () => {
    updateAISettings(localSettings);
    setIsSettingsOpen(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(currentDashboard, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDashboard.title || 'dashboard'}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCloudUpload = async () => {
    if (!uploadForm.name.trim()) return;
    setIsUploading(true);
    try {
      // Create a clean payload object
      const payload = {
        name: uploadForm.name.trim(),
        description: uploadForm.description.trim(),
        category: 'Community',
        // Make sure we strip any volatile runtime data
        widgets: currentDashboard.widgets.map(({ id, ...rest }) => rest),
        parameters: currentDashboard.parameters.map(({ id, ...rest }) => rest),
        createdAt: Date.now()
      };

      const res = await fetch('https://siqldob4m4.bja.sealos.run/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('🎉 成功发布到m！');
        setIsUploadModalOpen(false);
        setUploadForm({ name: '', description: '' });
      } else {
        throw new Error('Server returned ' + res.status);
      }
    } catch (e) {
      console.error(e);
      alert('上传失败，请检查网络连接。');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && Array.isArray(json.widgets)) {
          loadDashboard(json);
          setIsSettingsOpen(false);
        } else {
          alert('文件格式错误');
        }
      } catch (err) {
        alert('解析 JSON 失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <header className="navbar bg-base-100 border-b border-base-200 px-6 sticky top-0 z-50 h-16 shadow-sm">
        <div className="flex-1 gap-4">
          <div className="flex items-center gap-2 text-primary font-bold text-xl cursor-default select-none">
            <LayoutDashboard size={24} />
            <span>AI-Dash</span>
          </div>
          <div className="divider divider-horizontal py-2"></div>
          <input 
            type="text" 
            value={currentDashboard.title}
            onChange={(e) => setDashboardTitle(e.target.value)}
            className="input input-ghost font-semibold text-lg w-full max-w-xs focus:bg-base-200 focus:text-base-content"
            placeholder="输入仪表盘标题..."
          />
        </div>
        <div className="flex-none gap-2">
          <button className="btn btn-ghost btn-sm gap-2" onClick={() => setFilterEditorOpen(true)}>
             <SlidersHorizontal size={18} />
             筛选器
          </button>
          
          <div className="divider divider-horizontal py-2 mx-0"></div>

          <button className="btn btn-ghost btn-sm gap-2" onClick={refreshAllCharts} disabled={isRefreshing}>
            <RotateCw size={18} className={isRefreshing ? 'animate-spin text-primary' : ''} />
            {isRefreshing ? '同步中...' : '刷新数据'}
          </button>
          
          <button className="btn btn-ghost btn-sm px-3" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={18} />
          </button>

          <div className="divider divider-horizontal py-2 mx-0"></div>
          
          <button className="btn btn-outline btn-primary btn-sm px-4" onClick={handleExport}>
            <Save size={18} />
            保存本地
          </button>
          
          {isDevMode && (
            <button className="btn btn-accent btn-sm text-white gap-2 shadow-lg shadow-accent/20" onClick={() => setIsUploadModalOpen(true)}>
              <CloudUpload size={18} />
              发布
            </button>
          )}
        </div>
      </header>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
            <div className="p-6 border-b border-base-200 bg-gradient-to-r from-accent/10 to-transparent">
              <h3 className="font-bold text-xl flex items-center gap-2 text-base-content">
                <CloudUpload className="text-accent" /> 分享灵感
              </h3>
              <p className="text-xs opacity-60 mt-1">您的创作将被同步至云端灵感库，供所有用户浏览应用</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase opacity-60">模板名称</label>
                <input 
                  type="text" 
                  className="input input-bordered w-full focus:input-accent" 
                  placeholder="给您的杰作起个响亮的名字..."
                  value={uploadForm.name}
                  onChange={e => setUploadForm({...uploadForm, name: e.target.value})}
                  autoFocus
                />
              </div>
              <div className="form-control">
                <label className="label text-xs font-bold uppercase opacity-60">功能亮点</label>
                <textarea 
                  className="textarea textarea-bordered h-24 focus:textarea-accent" 
                  placeholder="描述一下这个报表的适用场景和核心价值..."
                  value={uploadForm.description}
                  onChange={e => setUploadForm({...uploadForm, description: e.target.value})}
                ></textarea>
              </div>
              <div className="bg-base-200/50 p-4 rounded-2xl text-xs flex items-start gap-3 border border-base-200">
                <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
                <div className="opacity-70">
                   即将同步: <span className="font-bold text-base-content">{currentDashboard.widgets.length}</span> 个图表组件、
                   <span className="font-bold text-base-content">{currentDashboard.parameters.length}</span> 个交互筛选器。
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-base-200 flex justify-end gap-3 bg-base-50/30">
              <button className="btn btn-ghost" onClick={() => setIsUploadModalOpen(false)}>以后再说</button>
              <button 
                className="btn btn-accent text-white px-8 shadow-lg shadow-accent/20" 
                disabled={isUploading || !uploadForm.name.trim()}
                onClick={handleCloudUpload}
              >
                {isUploading ? <span className="loading loading-spinner"></span> : '确认发布'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal - Remains Same */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-200/50">
               <h3 className="font-bold text-lg flex items-center gap-2 text-base-content"><Settings size={20} /> 全局配置</h3>
               <button onClick={() => setIsSettingsOpen(false)} className="btn btn-ghost btn-sm btn-circle"><X size={18} /></button>
             </div>
             <div className="p-6 overflow-y-auto space-y-6">
               <div className="space-y-3">
                 <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2"><FileJson size={14} /> 数据管理</h4>
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleExport} className="btn btn-outline border-base-300 flex items-center gap-2 justify-center text-xs"><Download size={16} /> 导出配置</button>
                    <div className="relative">
                      <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <button className="btn btn-outline border-base-300 w-full flex items-center gap-2 justify-center text-xs"><UploadIcon size={16} /> 导入配置</button>
                    </div>
                 </div>
               </div>
               <div className="divider my-1"></div>
               <div className="space-y-3">
                 <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2"><Key size={14} /> AI 接口配置</h4>
                 <div className="p-4 bg-base-200 rounded-xl space-y-3">
                    <div className="form-control">
                      <label className="label text-xs font-medium">服务提供商</label>
                      <select className="select select-bordered select-sm w-full" value={localSettings.provider} onChange={(e) => {
                        const provider = e.target.value as any;
                        // 设置默认模型和URL
                        let defaultModel = localSettings.model;
                        let defaultUrl = localSettings.baseUrl;
                        
                        switch(provider) {
                          case 'openai':
                            defaultModel = 'gpt-4o';
                            defaultUrl = 'https://api.openai.com/v1';
                            break;
                          case 'tongyi':
                            defaultModel = 'qwen-plus';
                            defaultUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
                            break;
                          case 'deepseek':
                            defaultModel = 'deepseek-chat';
                            defaultUrl = 'https://api.deepseek.com/v1';
                            break;
                          case 'anthropic':
                            defaultModel = 'claude-3-opus-20240229';
                            defaultUrl = 'https://api.anthropic.com/v1';
                            break;
                          case 'gemini':
                            defaultModel = 'gemini-1.5-flash';
                            defaultUrl = undefined;
                            break;
                          case 'custom':
                            // 保持现有值
                            break;
                        }
                        
                        setLocalSettings({...localSettings, provider, model: defaultModel, baseUrl: defaultUrl});
                      }}>
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI</option>
                        <option value="tongyi">阿里云通义千问</option>
                        <option value="deepseek">深度求索 DeepSeek</option>
                        <option value="anthropic">Anthropic Claude</option>
                        <option value="custom">自定义 / OpenAI 兼容</option>
                      </select>
                    </div>
                    <div className="form-control">
                      <label className="label text-xs font-medium">API Key</label>
                      <input type="password" placeholder="sk-..." className="input input-bordered input-sm w-full font-mono" value={localSettings.apiKey} onChange={(e) => setLocalSettings({...localSettings, apiKey: e.target.value})} />
                    </div>
                    {(localSettings.provider !== 'gemini') && (
                      <div className="form-control">
                        <label className="label text-xs font-medium">基础 URL</label>
                        <input type="text" placeholder="https://api.example.com/v1" className="input input-bordered input-sm w-full font-mono" value={localSettings.baseUrl || ''} onChange={(e) => setLocalSettings({...localSettings, baseUrl: e.target.value || undefined})} />
                      </div>
                    )}
                    <div className="form-control">
                      <label className="label text-xs font-medium">模型名称</label>
                      <input type="text" placeholder="gpt-4o" className="input input-bordered input-sm w-full font-mono" value={localSettings.model} onChange={(e) => setLocalSettings({...localSettings, model: e.target.value})} />
                    </div>
                 </div>
               </div>
             </div>
             <div className="p-4 border-t border-base-200 flex justify-end gap-2 bg-base-100">
               <button onClick={() => setIsSettingsOpen(false)} className="btn btn-ghost">取消</button>
               <button onClick={handleSaveSettings} className="btn btn-primary text-white">保存配置</button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};
