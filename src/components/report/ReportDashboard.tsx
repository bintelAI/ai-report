import React, { useEffect } from 'react';
import { Header } from './common/Header';
import { DashboardGrid } from './dashboard/DashboardGrid';
import { AICopilot } from './ai/AICopilot';
import { FilterBar } from './parameters/FilterBar';
import { FilterEditor } from './parameters/FilterEditor';
import { TemplateGallery } from './templates/TemplateGallery';
import { useDashboardStore } from './store/dashboardStore';

export const ReportDashboard: React.FC = () => {
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
