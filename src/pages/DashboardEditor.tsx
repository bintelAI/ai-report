
import React, { useEffect } from 'react';
import { Header } from '../components/report/common/Header';
import { DashboardGrid } from '../components/report/dashboard/DashboardGrid';
import { AICopilot } from '../components/report/ai/AICopilot';
import { FilterBar } from '../components/report/parameters/FilterBar';
import { FilterEditor } from '../components/report/parameters/FilterEditor';
import { TemplateGallery } from '../components/report/templates/TemplateGallery'; // New
import { useDashboardStore } from '../components/report/store/dashboardStore';

const DashboardEditor: React.FC = () => {
  const { refreshAllCharts, refreshParameterOptions, isFilterEditorOpen, isTemplateGalleryOpen } = useDashboardStore();

  useEffect(() => {
    // Initial data load
    refreshParameterOptions().then(() => {
       refreshAllCharts();
    });
  }, [refreshAllCharts, refreshParameterOptions]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Header />
      <FilterBar />
      <main className="flex-1 min-h-0 relative">
        <DashboardGrid />
      </main>
      <AICopilot />
      
      {isFilterEditorOpen && <FilterEditor />}
      {isTemplateGalleryOpen && <TemplateGallery />}
    </div>
  );
};

export default DashboardEditor;
