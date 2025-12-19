import React, { useState, useRef, useEffect } from 'react';
import { WidgetConfig } from '../types';
import { ChartRenderer } from '../charts/ChartRenderer';
import { WidgetTable } from './WidgetTable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical, Settings, Loader2, Table, Download, BarChart2 } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

interface Props {
  widget: WidgetConfig;
}

export const WidgetCard: React.FC<Props> = ({ widget }) => {
  const { removeWidget, selectWidget, selectedWidgetId, updateWidget, setSidebarOpen, widgetLoadingStates } = useDashboardStore();
  const isSelected = selectedWidgetId === widget.id;
  const isLoading = widgetLoadingStates[widget.id];
  
  // Local state for view mode
  const [showTable, setShowTable] = useState(widget.type === 'table');

  useEffect(() => {
    if (widget.type === 'table') {
      setShowTable(true);
    }
  }, [widget.type]);
  
  // Resizing state
  const resizeRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  // DnD Hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: widget.id,
    disabled: isResizing // Disable DnD while resizing
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : (isSelected ? 10 : 1), // Selected items slightly higher
    gridColumn: `span ${widget.colSpan}`,
    height: `${widget.height}px`,
  };

  // CSV Export Logic
  const handleExportCSV = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!widget.data || widget.data.length === 0) {
      alert("暂无数据可导出");
      return;
    }

    // Get all unique keys from data to form headers
    // Using an explicit mapping to avoid inference issues with flatMap in certain TS versions
    const allKeys = Array.from(new Set(widget.data.flatMap(row => Object.keys(row))));
    
    // Create CSV Header
    const csvContent = [
      allKeys.join(','),
      // Fix: Explicitly type key as string to resolve "Type 'unknown' cannot be used as an index type"
      ...widget.data.map(row => allKeys.map((key: string) => {
        let val = row[key];
        // Handle strings with commas or quotes
        if (typeof val === 'string') {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? '';
      }).join(','))
    ].join('\n');

    // Create a Blob with UTF-8 BOM for Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${widget.title || 'export'}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Resize Handler
  useEffect(() => {
    const handle = resizeRef.current;
    if (!handle) return;

    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      selectWidget(widget.id); // Auto-select on resize

      startX = e.clientX;
      startY = e.clientY;
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        startWidth = rect.width;
        startHeight = rect.height;
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      
      const parentWidth = cardRef.current.parentElement?.clientWidth || 1000;
      const oneColWidth = parentWidth / 12; // 12 grid columns
      
      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;

      // Calculate new height (Pixel perfect)
      const newHeight = Math.max(150, startHeight + diffY);

      // Calculate new ColSpan (Snap to grid)
      const newWidthRaw = startWidth + diffX;
      let newColSpan = Math.round(newWidthRaw / oneColWidth);
      newColSpan = Math.max(1, Math.min(12, newColSpan));

      updateWidget(widget.id, {
        height: newHeight,
        colSpan: newColSpan
      });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', onMouseDown);
    return () => handle.removeEventListener('mousedown', onMouseDown);
  }, [widget.id, updateWidget, selectWidget]);


  return (
    <div 
      ref={(node) => {
        setNodeRef(node);
        // @ts-ignore
        cardRef.current = node;
      }}
      style={style} 
      className={`relative bg-white rounded-xl flex flex-col group transition-all duration-200 overflow-hidden
        ${isSelected 
          ? 'ring-2 ring-primary shadow-lg' 
          : 'border border-slate-100 shadow-sm hover:shadow-md'
        }
      `}
      onClick={(e) => {
        e.stopPropagation();
        selectWidget(widget.id);
      }}
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-slate-50 select-none bg-white relative z-10">
        <div className="flex items-center gap-2 overflow-hidden">
          <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-600 active:cursor-grabbing p-1">
            <GripVertical size={14} />
          </div>
          <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
            {widget.title}
          </h3>
        </div>
        
        {/* Quick Actions */}
        <div className={`flex items-center gap-1 transition-opacity ${isSelected || 'opacity-0 group-hover:opacity-100'}`}>
          {/* View Toggle (Chart <-> Table) */}
          {widget.type !== 'table' && (
            <button 
              onClick={(e) => {
                 e.stopPropagation();
                 setShowTable(!showTable);
              }}
              className="btn btn-xs btn-ghost btn-circle text-slate-400 hover:text-primary hover:bg-slate-100"
              title={showTable ? "切换到图表" : "切换到表格"}
            >
              {showTable ? <BarChart2 size={14} /> : <Table size={14} />}
            </button>
          )}

          {/* Export CSV */}
          <button 
            onClick={handleExportCSV}
            className="btn btn-xs btn-ghost btn-circle text-slate-400 hover:text-primary hover:bg-slate-100"
            title="导出 CSV"
          >
            <Download size={14} />
          </button>

          {/* Settings */}
          <button 
            onClick={(e) => {
               e.stopPropagation();
               selectWidget(widget.id);
               setSidebarOpen(true);
            }}
            className={`btn btn-xs btn-circle ${isSelected ? 'btn-ghost text-primary bg-primary/10' : 'btn-ghost text-slate-400 hover:bg-slate-100'}`}
            title="配置图表"
          >
            <Settings size={14} />
          </button>

          {/* Delete */}
          <button 
            onClick={(e) => {
               e.stopPropagation();
               removeWidget(widget.id);
            }}
            className="btn btn-xs btn-ghost btn-circle text-red-400 hover:bg-red-50"
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Body with Flip Effect Logic (Conditional Rendering with Animation) */}
      <div className="p-4 flex-1 min-h-0 overflow-hidden relative" onClick={(e) => {
        e.stopPropagation();
        selectWidget(widget.id);
      }}>
        {showTable ? (
          <div className="h-full w-full animate-in fade-in zoom-in-95 duration-200">
            <WidgetTable widget={widget} />
          </div>
        ) : (
          <div className="h-full w-full animate-in fade-in zoom-in-95 duration-200">
            <ChartRenderer widget={widget} />
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-20 animate-in fade-in duration-200">
             <div className="flex flex-col items-center gap-2 text-primary">
               <Loader2 size={32} className="animate-spin" />
               <span className="text-xs font-semibold px-2 py-1 bg-white/80 rounded-full shadow-sm">
                 加载数据中...
               </span>
             </div>
          </div>
        )}
      </div>

      {/* Resize Handle (Only visible when selected) */}
      <div 
        ref={resizeRef}
        className={`absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 transition-opacity z-30
          ${isSelected ? 'text-primary opacity-100' : 'opacity-0'}
        `}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M10 10L10 2L2 10Z" />
        </svg>
      </div>
    </div>
  );
};