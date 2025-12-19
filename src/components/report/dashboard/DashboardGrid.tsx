
import React from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { useDashboardStore } from '../store/dashboardStore';
import { WidgetCard } from './WidgetCard';
import { PlusCircle, BarChart3, LineChart, PieChart, Activity, BoxSelect, Settings, Hexagon, ScatterChart, Filter, Cloud, Table, Gauge, Grid3X3, Layers, History } from 'lucide-react';
import { ChartType, WidgetConfig } from '../types';
import { WidgetEditor } from './WidgetEditor';

export const DashboardGrid: React.FC = () => {
  const { currentDashboard, updateWidgets, addWidget, selectWidget, selectedWidgetId, isSidebarOpen, setSidebarOpen } = useDashboardStore();
  const widgets = currentDashboard.widgets;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      updateWidgets(arrayMove(widgets, oldIndex, newIndex));
    }
  };

  const handleAddWidget = (type: ChartType) => {
    const defaults: Record<string, Partial<WidgetConfig>> = {
      'line': { 
        title: '新折线图', 
        data: [{name: '一月', value: 400}, {name: '二月', value: 300}, {name: '三月', value: 600}],
        showGrid: true, showLegend: true
      },
      'bar': { 
        title: '新柱状图', 
        data: [{name: 'A产品', value: 120}, {name: 'B产品', value: 200}, {name: 'C产品', value: 150}],
        showGrid: true, showLegend: true 
      },
      'pie': { 
        title: '新饼图', 
        data: [{name: '分类A', value: 400}, {name: '分类B', value: 300}, {name: '分类C', value: 300}],
        showGrid: false, showLegend: true 
      },
      'area': { 
        title: '新面积图', 
        data: [{name: 'Mon', value: 400}, {name: 'Tue', value: 300}, {name: 'Wed', value: 600}],
        showGrid: true, showLegend: true 
      },
      'stat': { 
        title: '关键指标', 
        data: [{name: 'Current', value: 1234}, {name: 'Prev', value: 1000}], 
        height: 150,
        showLegend: false 
      },
      'composed': { 
        title: '组合图表', 
        data: [{name: 'Q1', value: 500, trend: 100}, {name: 'Q2', value: 800, trend: 120}, {name: 'Q3', value: 600, trend: 110}],
        showGrid: true, showLegend: true 
      },
      'radar': { 
        title: '雷达图', 
        data: [{name: '力量', value: 90}, {name: '速度', value: 70}, {name: '敏捷', value: 80}, {name: '耐力', value: 60}, {name: '智力', value: 85}],
        showGrid: true, showLegend: false,
        chartConfig: { radarType: 'polygon' }
      },
      'scatter': { 
        title: '散点分布', 
        data: Array.from({length: 20}, (_, i) => ({ name: `P${i}`, x: Math.floor(Math.random()*100), y: Math.floor(Math.random()*100), value: 1 })),
        showGrid: true, showLegend: false 
      },
      'funnel': { 
        title: '销售漏斗', 
        data: [{name: '访问', value: 1000}, {name: '注册', value: 600}, {name: '下单', value: 200}, {name: '复购', value: 50}],
        showGrid: false, showLegend: true 
      },
      'wordCloud': { 
        title: '热词云', 
        data: [{name: 'React', value: 90}, {name: 'AI', value: 80}, {name: 'Data', value: 60}, {name: 'Charts', value: 50}, {name: 'Design', value: 40}],
        showGrid: false, showLegend: false 
      },
      'table': {
        title: '数据表格',
        data: [
          { name: '项目 A', category: '软件', value: 1200, status: '进行中', date: '2023-10-01' },
          { name: '项目 B', category: '硬件', value: 850, status: '已完成', date: '2023-09-15' },
          { name: '项目 C', category: '服务', value: 2100, status: '延迟', date: '2023-11-20' },
          { name: '项目 D', category: '软件', value: 450, status: '进行中', date: '2023-10-10' },
          { name: '项目 E', category: '咨询', value: 3200, status: '已完成', date: '2023-08-05' },
        ],
        colSpan: 12,
        height: 400
      },
      'radialBar': {
        title: '核心指标达成度',
        data: [{ name: '核心目标', value: 85 }],
        showLegend: true,
        chartConfig: { 
          showCenterLabel: true, 
          centerLabel: '达成率', 
          valueUnit: '%',
          startAngle: 210,
          endAngle: -30,
          innerRadius: 60,
          outerRadius: 100
        }
      },
      'treemap': {
        title: '业务分类占比',
        data: [
          { name: '电子产品', value: 450 },
          { name: '服装鞋帽', value: 320 },
          { name: '家居百货', value: 210 },
          { name: '户外运动', value: 180 },
          { name: '图书影像', value: 120 },
          { name: '美妆个护', value: 150 }
        ],
        showLegend: false
      },
      'heatmap': {
        title: '活跃度热力分布',
        data: [
          { x: '周一', y: '早晨', value: 20 }, { x: '周二', y: '早晨', value: 25 }, { x: '周三', y: '早晨', value: 30 }, { x: '周四', y: '早晨', value: 22 }, { x: '周五', y: '早晨', value: 28 },
          { x: '周一', y: '上午', value: 50 }, { x: '周二', y: '上午', value: 55 }, { x: '周三', y: '上午', value: 60 }, { x: '周四', y: '上午', value: 52 }, { x: '周五', y: '上午', value: 58 },
          { x: '周一', y: '下午', value: 80 }, { x: '周二', y: '下午', value: 85 }, { x: '周三', y: '下午', value: 90 }, { x: '周四', y: '下午', value: 82 }, { x: '周五', y: '下午', value: 88 },
          { x: '周一', y: '晚上', value: 40 }, { x: '周二', y: '晚上', value: 45 }, { x: '周三', y: '晚上', value: 50 }, { x: '周四', y: '晚上', value: 42 }, { x: '周五', y: '晚上', value: 48 },
        ],
        showGrid: false
      },
      'timeline': {
        title: '项目里程碑',
        data: [
          { name: '项目立项', date: '2023-01-01', description: '项目正式启动，组建核心团队。', status: 'success' },
          { name: '原型设计', date: '2023-02-15', description: '完成高保真原型评审与确认。', status: 'success' },
          { name: '核心开发', date: '2023-04-01', description: '后端架构搭建与前端核心组件开发。', status: 'warning', tags: ['关键节点', '加班'] },
          { name: '测试发布', date: '2023-06-20', description: '全量测试完成，准备正式发布。', status: 'info' },
        ],
        showLegend: false
      }
    };

    const def = defaults[type] || defaults['line'];
    const initialData = def.data || [];

    addWidget({
      type,
      title: def.title || '新图表',
      colSpan: type === 'stat' ? 4 : 6, // 1/3 or 1/2 of 12
      height: def.height || 300,
      data: initialData,
      // IMPORTANT: Initialize dataSource with static data so it persists correctly and edits work immediately
      dataSource: {
        mode: 'static',
        staticData: initialData
      },
      description: 'User added widget',
      theme: 'default',
      showLegend: def.showLegend,
      showGrid: def.showGrid,
      chartConfig: def.chartConfig
    });
  };

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* Canvas Area */}
      <div 
        className="flex-1 min-w-0 bg-base-200/50 p-6 overflow-y-auto h-full"
        onClick={() => {
           // Clicking background deselects everything and closes sidebar
           selectWidget(null);
           setSidebarOpen(false);
        }} 
      >
        <div className="max-w-[1400px] mx-auto pb-20">
          <div className="mb-6 flex justify-between items-center relative z-20">
            <div>
              <p className="text-slate-500 text-sm">点击卡片选中及调整大小 • 点击 <Settings className="inline w-3 h-3"/> 配置属性</p>
            </div>
            
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-sm btn-primary text-white gap-2 shadow-lg shadow-primary/30">
                <PlusCircle size={16} />
                添加图表
              </div>
              <ul tabIndex={0} className="dropdown-content z-[100] menu p-2 shadow-xl bg-base-100 rounded-xl w-52 border border-base-200 text-base-content max-h-[80vh] overflow-y-auto">
                <li className="menu-title">基础图表</li>
                <li><button onClick={() => handleAddWidget('stat')}><Activity size={16}/> 统计数值</button></li>
                <li><button onClick={() => handleAddWidget('line')}><LineChart size={16}/> 折线图</button></li>
                <li><button onClick={() => handleAddWidget('bar')}><BarChart3 size={16}/> 柱状图</button></li>
                <li><button onClick={() => handleAddWidget('pie')}><PieChart size={16}/> 饼图</button></li>
                <li><button onClick={() => handleAddWidget('area')}><BoxSelect size={16}/> 面积图</button></li>
                <li><button onClick={() => handleAddWidget('table')}><Table size={16}/> 数据表格</button></li>
                
                <li className="menu-title mt-2">高级图表</li>
                <li><button onClick={() => handleAddWidget('composed')}><BarChart3 size={16}/> 组合图</button></li>
                <li><button onClick={() => handleAddWidget('radar')}><Hexagon size={16}/> 雷达图</button></li>
                <li><button onClick={() => handleAddWidget('scatter')}><ScatterChart size={16}/> 散点图</button></li>
                <li><button onClick={() => handleAddWidget('funnel')}><Filter size={16}/> 漏斗图</button></li>
                <li><button onClick={() => handleAddWidget('wordCloud')}><Cloud size={16}/> 词云</button></li>
                <li><button onClick={() => handleAddWidget('radialBar')}><Gauge size={16}/> 仪表盘</button></li>
                <li><button onClick={() => handleAddWidget('treemap')}><Grid3X3 size={16}/> 矩形树图</button></li>
                <li><button onClick={() => handleAddWidget('heatmap')}><Layers size={16}/> 热力图</button></li>
                <li><button onClick={() => handleAddWidget('timeline')}><History size={16}/> 时间轴</button></li>
              </ul>
            </div>
          </div>

          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={widgets.map(w => w.id)} 
              strategy={rectSortingStrategy}
            >
              {/* CSS Grid - 12 Columns */}
              <div className="grid grid-cols-12 gap-4 auto-rows-min pb-32">
                {widgets.map((widget) => (
                  <WidgetCard key={widget.id} widget={widget} />
                ))}
                
                {widgets.length === 0 && (
                  <div className="col-span-12 h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-base-100/50 text-slate-400">
                    <PlusCircle size={48} className="mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">空仪表盘</h3>
                    <p>点击上方“添加图表”或使用右下角 <span className="text-primary font-bold">AI 助手</span></p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Persistent Sidebar (Floating / Overlay) */}
      {selectedWidgetId && isSidebarOpen && (
        <div className="absolute top-0 right-0 h-full z-40 shadow-2xl animate-in slide-in-from-right duration-300 border-l border-base-200">
          <WidgetEditor />
        </div>
      )}
    </div>
  );
};
