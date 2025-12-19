
import React, { useState, useEffect } from 'react';
import { X, Search, ChevronLeft, ChevronRight, LayoutGrid, Zap, ShoppingCart, BarChart, Rocket, MonitorCheck, Cloud, Globe, RotateCw } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { WidgetConfig, DashboardParameter } from '../types';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  widgets: Omit<WidgetConfig, 'id'>[];
  parameters: Omit<DashboardParameter, 'id'>[];
  icon?: string;
}

const ITEMS_PER_PAGE = 6;

export const TemplateGallery: React.FC = () => {
  const { setTemplateGalleryOpen, replaceDashboard, setDashboardTitle, refreshAllCharts, refreshParameterOptions } = useDashboardStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchTemplates = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch(`https://siqldob4m4.bja.sealos.run/report?page=${page}&pageSize=${ITEMS_PER_PAGE}&search=${encodeURIComponent(appliedSearch)}`);
      if (res.ok) {
        const response = await res.json();
        const data = response.data || response;
        const newTemplates = Array.isArray(data) ? data : [];
        
        setTemplates(newTemplates);
        
        if (response.pagination) {
          setTotalCount(response.pagination.total);
          setHasMore(page < response.pagination.totalPages);
        }
      }
    } catch (e) {
      console.error("Failed to fetch templates", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates(currentPage);
  }, [currentPage, appliedSearch]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setAppliedSearch(searchQuery);
      setCurrentPage(1);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const currentTemplates = templates;

  const applyTemplate = (template: Template) => {
    if (confirm(`确定应用“${template.name}”模板吗？这会覆盖当前的所有配置。`)) {
      console.log("Applying template:", template);
      // Directly call replace with fallback for safety
      replaceDashboard(template.widgets || [], template.parameters || []);
      setDashboardTitle(template.name || "新仪表盘");
      setTemplateGalleryOpen(false);
      
      // Sequence the refreshes to ensure parameters are loaded before charts
      setTimeout(async () => {
        await refreshParameterOptions();
        await refreshAllCharts();
      }, 200);
    }
  };

  const getIcon = (category: string) => {
    switch(category?.toLowerCase()) {
      case 'business': return <ShoppingCart size={24} />;
      case 'saas': return <Rocket size={24} />;
      case 'finance': return <BarChart size={24} />;
      case 'it': return <MonitorCheck size={24} />;
      default: return <Globe size={24} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        
        {/* Header */}
        <div className="p-6 border-b border-base-200 flex justify-between items-center bg-gradient-to-r from-primary/5 via-accent/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/30">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl tracking-tight flex items-center gap-2">
                模板市场 <span className="text-xs font-normal opacity-40">Blueprints</span>
              </h3>
              <p className="text-sm opacity-60">浏览云端预设和社区分享的优秀仪表盘布局</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchTemplates(1)} className="btn btn-ghost btn-sm btn-circle" title="刷新列表">
              <RotateCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setTemplateGalleryOpen(false)} className="btn btn-ghost btn-sm btn-circle bg-base-200/50">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 bg-base-100/50 border-b border-base-200">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="搜索模板、关键词或分类..." 
              className="input input-bordered w-full pr-12 pl-6 bg-base-200/30 focus:bg-base-100 rounded-2xl transition-all"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); }}
              onKeyDown={handleSearchKeyDown}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-primary" size={18} />
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-base-200/20">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-slate-400 animate-pulse">正在同步云端灵感...</p>
            </div>
          ) : currentTemplates.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
              <LayoutGrid size={64} className="mb-4" />
              <p className="text-lg font-medium">未找到匹配的模板</p>
              <p className="text-sm">尝试换个关键词，或者点击刷新按钮</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentTemplates.map((template) => (
                <div 
                  key={template.id}
                  className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group rounded-3xl overflow-hidden"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        {getIcon(template.category)}
                      </div>
                      <div className={`badge badge-sm uppercase tracking-tighter font-bold ${template.category === 'Community' ? 'badge-accent' : 'badge-ghost'}`}>
                        {template.category || '社区'}
                      </div>
                    </div>
                    <h4 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors truncate">{template.name}</h4>
                    <p className="text-sm opacity-60 leading-relaxed mb-6 line-clamp-2 h-10">{template.description || '无描述信息'}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-base-100">
                      <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase">
                        <div className="flex items-center gap-1"><LayoutGrid size={12} /> {template.widgets?.length || 0} 图表</div>
                        <div className="flex items-center gap-1"><Globe size={12} /> {template.parameters?.length || 0} 筛选</div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-bold text-xs flex items-center gap-1">
                        立即应用 <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Footer & Pagination moved out of scroll area */}
        </div>

        {/* Footer & Pagination */}
        <div className="p-6 border-t border-base-200 bg-base-100 flex justify-between items-center shrink-0">
          <div className="text-sm font-medium opacity-40">
            {totalCount} 个灵感已就绪
          </div>
          
          <div className="join shadow-sm border border-base-200 rounded-2xl overflow-hidden">
            <button className="join-item btn btn-sm bg-base-100" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
              <ChevronLeft size={16} />
            </button>
            <button className="join-item btn btn-sm bg-base-100 no-animation px-6 border-x-0">
              {currentPage} / {totalPages || 1}
            </button>
            <button 
              className="join-item btn btn-sm bg-base-100" 
              disabled={currentPage >= totalPages || totalPages === 0} 
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


