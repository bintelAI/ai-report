import React, { useState, useMemo } from 'react';
import { WidgetConfig } from '../types';
import { Search, ChevronUp, ChevronDown, ArrowUpDown, Filter } from 'lucide-react';

interface Props {
  widget: WidgetConfig;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc' | null;
};

export const WidgetTable: React.FC<Props> = ({ widget }) => {
  const { data, dataMapping } = widget;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400 text-sm gap-2">
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
          <Filter size={20} className="opacity-20" />
        </div>
        暂无数据
      </div>
    );
  }

  const allKeys = Object.keys(data[0]);
  const valueKey = dataMapping?.valueKey || 'value';
  const nameKey = dataMapping?.nameKey || 'name';

  // Handle Sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  // Process Data (Search + Sort + Pagination)
  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchTerm) {
      result = result.filter(row => 
        Object.values(row).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const maxValue = useMemo(() => {
    return Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
  }, [data, valueKey]);

  // Helper for rendering cell content based on value and key
  const renderCell = (value: any, key: string) => {
    if (typeof value === 'boolean') {
      return (
        <span className={`badge badge-sm ${value ? 'badge-success' : 'badge-ghost'} gap-1`}>
          {value ? 'True' : 'False'}
        </span>
      );
    }

    // Status mapping (creative touch)
    if (key.toLowerCase().includes('status') || key.toLowerCase().includes('状态')) {
      const statusStr = String(value).toLowerCase();
      let badgeClass = 'badge-ghost';
      if (statusStr.includes('完成') || statusStr.includes('done') || statusStr.includes('success')) badgeClass = 'badge-success text-white';
      if (statusStr.includes('进行') || statusStr.includes('progress') || statusStr.includes('running')) badgeClass = 'badge-info text-white';
      if (statusStr.includes('延迟') || statusStr.includes('delay') || statusStr.includes('error')) badgeClass = 'badge-error text-white';
      if (statusStr.includes('待') || statusStr.includes('pending') || statusStr.includes('todo')) badgeClass = 'badge-warning text-white';
      
      return <span className={`badge badge-sm ${badgeClass} font-medium`}>{String(value)}</span>;
    }

    // Date rendering
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
        return <span className="text-xs text-slate-500 font-mono">{String(value)}</span>;
    }

    // Numeric rendering with bar
    if (key === valueKey && !isNaN(Number(value))) {
      const numVal = Number(value);
      const percent = (numVal / maxValue) * 100;
      return (
        <div className="flex flex-col gap-1 w-full max-w-[120px] ml-auto">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-primary">
            <span>{numVal.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-700 ease-out rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      );
    }

    return <span className="text-slate-700">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>;
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-xl overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-50 bg-slate-50/30">
        <label className="input input-sm input-bordered flex items-center gap-2 w-full max-w-xs bg-white h-8 focus-within:border-primary focus-within:outline-none transition-all group">
          <Search size={14} className="text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="搜索数据..." 
            className="grow text-xs bg-transparent border-none focus:ring-0 focus:outline-none p-0"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </label>
        
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
             {processedData.length} 条结果
           </span>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="table table-xs table-pin-rows w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/80 backdrop-blur-sm">
              <th className="w-10 bg-slate-50/80 text-center text-[10px] font-bold text-slate-400">#</th>
              {allKeys.map((key) => (
                <th 
                  key={key} 
                  className={`cursor-pointer hover:bg-slate-100 transition-colors py-3 group ${key === valueKey ? 'text-right' : ''}`}
                  onClick={() => handleSort(key)}
                >
                  <div className={`flex items-center gap-1 ${key === valueKey ? 'justify-end' : ''}`}>
                    <span className="text-[11px] font-bold text-slate-600">
                      {key === nameKey ? '维度' : key === valueKey ? '指标' : key}
                    </span>
                    <span className={`text-slate-300 transition-colors ${sortConfig.key === key ? 'text-primary' : 'opacity-0 group-hover:opacity-100'}`}>
                      {sortConfig.key === key ? (
                        sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      ) : <ArrowUpDown size={10} />}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                <td className="text-center">
                  <span className="text-[10px] font-mono text-slate-300">
                    {(currentPage - 1) * pageSize + index + 1}
                  </span>
                </td>
                {allKeys.map((key) => (
                  <td key={key} className={`py-3 ${key === valueKey ? 'text-right' : ''}`}>
                    {renderCell(row[key], key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <p className="text-sm">未找到匹配的数据</p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-50 bg-slate-50/30">
          <div className="text-[10px] text-slate-500 font-medium">
            第 {currentPage} / {totalPages} 页
          </div>
          <div className="join">
            <button 
              className="join-item btn btn-xs btn-ghost disabled:bg-transparent" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              上一页
            </button>
            <button 
              className="join-item btn btn-xs btn-ghost disabled:bg-transparent" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
