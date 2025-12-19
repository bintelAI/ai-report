
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Dashboard, WidgetConfig, GlobalSettings, DashboardParameter, KeyValuePair } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { simulateSQLExecution } from '../services/geminiService';

interface DashboardState {
  currentDashboard: Dashboard;
  selectedWidgetId: string | null;
  
  // UI States
  isSidebarOpen: boolean;
  isFilterEditorOpen: boolean;
  isTemplateGalleryOpen: boolean;
  isLoadingAI: boolean;
  isRefreshing: boolean;
  widgetLoadingStates: Record<string, boolean>;

  // Parameter Runtime State
  parameterValues: Record<string, any>;
  
  settings: GlobalSettings;
  
  // Actions
  setLoadingAI: (loading: boolean) => void;
  setWidgetLoading: (id: string, isLoading: boolean) => void;
  setDashboardTitle: (title: string) => void;
  updateSettings: (settings: Partial<GlobalSettings>) => void;
  updateAISettings: (ai: Partial<GlobalSettings['ai']>) => void;
  
  selectWidget: (id: string | null) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setFilterEditorOpen: (isOpen: boolean) => void;
  setTemplateGalleryOpen: (isOpen: boolean) => void;
  
  // Widget Actions
  addWidget: (widget: Omit<WidgetConfig, 'id'>) => void;
  removeWidget: (id: string) => void;
  updateWidgets: (widgets: WidgetConfig[]) => void;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void;
  replaceDashboard: (widgets: Omit<WidgetConfig, 'id'>[], parameters?: Omit<DashboardParameter, 'id'>[]) => void;
  loadDashboard: (dashboard: Dashboard) => void;
  
  // Parameter Actions
  addParameter: (param: Omit<DashboardParameter, 'id'>) => void;
  updateParameter: (id: string, updates: Partial<DashboardParameter>) => void;
  removeParameter: (id: string) => void;
  setParameterValue: (key: string, value: any) => void;
  
  // Logic
  refreshAllCharts: () => Promise<void>;
  refreshParameterOptions: () => Promise<void>;
}

const initialDashboard: Dashboard = {
  id: 'default',
  title: '我的数据仪表盘',
  widgets: [],
  parameters: [],
  createdAt: Date.now(),
};

const defaultSettings: GlobalSettings = {
  theme: 'light',
  ai: {
    provider: 'gemini',
    apiKey: '', 
    model: 'gemini-3-flash-preview',
  }
};

const interpolate = (template: string, params: Record<string, any>) => {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = params[key];
    return val !== undefined && val !== null ? String(val) : '';
  });
};

const fetchDataFromSource = async (dataSource: any, interpolatedParams: Record<string, any>) => {
    const mode = dataSource?.mode || 'static';
    if (mode === 'static') return dataSource?.staticData || [];
    if (mode === 'sql' && dataSource?.sql?.query) {
        const finalSql = interpolate(dataSource.sql.query, interpolatedParams);
        const result = await simulateSQLExecution(finalSql);
        return Array.isArray(result) ? result : [];
    }
    if (mode === 'api' && dataSource?.api?.url) {
        const { url, method, responsePath, body, headers, queryParams } = dataSource.api;
        let finalUrl = interpolate(url, interpolatedParams);
        if (queryParams && Array.isArray(queryParams)) {
           const params = new URLSearchParams();
           queryParams.forEach((p: KeyValuePair) => {
             if (p.enabled && p.key) params.append(interpolate(p.key, interpolatedParams), interpolate(p.value, interpolatedParams));
           });
           const qs = params.toString();
           if (qs) finalUrl += (finalUrl.includes('?') ? '&' : '?') + qs;
        }
        const finalHeaders: Record<string, string> = {};
        if (headers && Array.isArray(headers)) {
           headers.forEach((h: KeyValuePair) => { if (h.enabled && h.key) finalHeaders[h.key] = interpolate(h.value, interpolatedParams); });
        }
        let finalBody = undefined;
        if (method !== 'GET' && body) finalBody = interpolate(body, interpolatedParams);
        const res = await fetch(finalUrl, { method, body: finalBody, headers: finalHeaders });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const json = await res.json();
        let resultData = json;
        if (responsePath) resultData = responsePath.split('.').reduce((o: any, k: string) => (o || {})[k], json);
        if (!Array.isArray(resultData) && typeof resultData === 'object' && resultData !== null) return Object.keys(resultData).map(k => ({ name: k, value: resultData[k] }));
        return Array.isArray(resultData) ? resultData : [];
    }
    return [];
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      currentDashboard: initialDashboard,
      selectedWidgetId: null,
      isSidebarOpen: false,
      isFilterEditorOpen: false,
      isTemplateGalleryOpen: false,
      isLoadingAI: false,
      isRefreshing: false,
      widgetLoadingStates: {},
      settings: defaultSettings,
      parameterValues: {},
      
      setLoadingAI: (loading) => set({ isLoadingAI: loading }),
      setWidgetLoading: (id, isLoading) => set((state) => ({ widgetLoadingStates: { ...state.widgetLoadingStates, [id]: isLoading } })),
      setDashboardTitle: (title) => set((state) => ({ currentDashboard: { ...state.currentDashboard, title } })),
      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      updateAISettings: (newAI) => set((state) => ({ settings: { ...state.settings, ai: { ...state.settings.ai, ...newAI } } })),
      selectWidget: (id) => set({ selectedWidgetId: id }),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      setFilterEditorOpen: (isOpen) => set({ isFilterEditorOpen: isOpen }),
      setTemplateGalleryOpen: (isOpen) => set({ isTemplateGalleryOpen: isOpen }),

      addWidget: (widget) => set((state) => ({ currentDashboard: { ...state.currentDashboard, widgets: [...state.currentDashboard.widgets, { ...widget, id: uuidv4() }] } })),
      removeWidget: (id) => set((state) => ({ currentDashboard: { ...state.currentDashboard, widgets: state.currentDashboard.widgets.filter((w) => w.id !== id) }, selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId, isSidebarOpen: state.selectedWidgetId === id ? false : state.isSidebarOpen })),
      updateWidgets: (widgets) => set((state) => ({ currentDashboard: { ...state.currentDashboard, widgets } })),
      updateWidget: (id, updates) => set((state) => ({ currentDashboard: { ...state.currentDashboard, widgets: state.currentDashboard.widgets.map((w) => w.id === id ? { ...w, ...updates } : w) } })),

      replaceDashboard: (newWidgets = [], newParams = []) => set((state) => {
          // Robust data sanitization
          const safeWidgets = Array.isArray(newWidgets) ? newWidgets : [];
          const safeParams = Array.isArray(newParams) ? newParams : [];

          const processedWidgets = safeWidgets.map(w => ({ 
              ...w, 
              id: uuidv4(), 
              dataSource: w.dataSource || { mode: 'static', staticData: w.data || [] } 
          }));
          
          const processedParams = safeParams.map(p => ({ 
              ...p, 
              id: uuidv4() 
          }));

          const initialValues: Record<string, any> = {};
          processedParams.forEach(p => { 
              if (p.defaultValue !== undefined) initialValues[p.key] = p.defaultValue; 
          });

          return { 
              currentDashboard: { 
                  ...state.currentDashboard, 
                  widgets: processedWidgets, 
                  parameters: processedParams 
              }, 
              parameterValues: initialValues,
              selectedWidgetId: null,
              isSidebarOpen: false
          };
      }),

      loadDashboard: (dashboard) => {
         const initialValues: Record<string, any> = {};
         (dashboard.parameters || []).forEach(p => { if (p.defaultValue) initialValues[p.key] = p.defaultValue; });
         set({ currentDashboard: dashboard, parameterValues: initialValues });
      },

      addParameter: (param) => set((state) => ({ currentDashboard: { ...state.currentDashboard, parameters: [...(state.currentDashboard.parameters || []), { ...param, id: uuidv4() }] }, parameterValues: { ...state.parameterValues, [param.key]: param.defaultValue || '' } })),
      updateParameter: (id, updates) => set((state) => ({ currentDashboard: { ...state.currentDashboard, parameters: state.currentDashboard.parameters.map(p => p.id === id ? { ...p, ...updates } : p) }, parameterValues: updates.key && updates.key !== state.currentDashboard.parameters.find(p => p.id === id)?.key ? (() => { const oldKey = state.currentDashboard.parameters.find(p => p.id === id)?.key; const newValues = { ...state.parameterValues }; if (oldKey) { newValues[updates.key] = newValues[oldKey]; delete newValues[oldKey]; } return newValues; })() : state.parameterValues })),
      removeParameter: (id) => set((state) => ({ currentDashboard: { ...state.currentDashboard, parameters: state.currentDashboard.parameters.filter(p => p.id !== id) } })),
      setParameterValue: (key, value) => set((state) => ({ parameterValues: { ...state.parameterValues, [key]: value } })),

      refreshParameterOptions: async () => {
         const { currentDashboard, parameterValues, updateParameter } = get();
         const promises = (currentDashboard.parameters || []).filter(p => p.type === 'select' && p.optionsDataSource).map(async (param) => {
                try {
                    const rawData = await fetchDataFromSource(param.optionsDataSource, parameterValues);
                    const options = rawData.map((item: any) => ({ label: item.label || item.name || item.text || String(item.value), value: item.value !== undefined ? item.value : item.id }));
                    updateParameter(param.id, { loadedOptions: options });
                } catch (e) { console.error(`Failed to load options for ${param.key}`, e); }
            });
         await Promise.all(promises);
      },

      refreshAllCharts: async () => {
        const { currentDashboard, updateWidgets, setWidgetLoading, parameterValues, isRefreshing } = get();
        if (isRefreshing) return;
        set({ isRefreshing: true });
        try {
          const newWidgets = await Promise.all((currentDashboard.widgets || []).map(async (widget) => {
            setWidgetLoading(widget.id, true);
            try {
              const resultData = await fetchDataFromSource(widget.dataSource, parameterValues);
              if (Array.isArray(resultData)) {
                  const processedData = resultData.map((item: any) => {
                    if (typeof item !== 'object' || item === null) return { value: item };
                    const newItem = { ...item };
                    Object.keys(newItem).forEach(key => { const val = newItem[key]; if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') newItem[key] = Number(val); });
                    if (newItem.name === undefined && (newItem.title || newItem.id)) newItem.name = newItem.title || newItem.id;
                    return newItem;
                  });
                  return { ...widget, data: processedData };
              }
            } catch (e) { console.error(`Failed to refresh widget ${widget.id}`, e); } finally { setWidgetLoading(widget.id, false); }
            return widget;
          }));
          updateWidgets(newWidgets);
        } catch (error) { console.error("Global Refresh Error", error); } finally { set({ isRefreshing: false }); }
      }
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({ currentDashboard: state.currentDashboard, settings: state.settings, parameterValues: state.parameterValues }),
    }
  )
);
