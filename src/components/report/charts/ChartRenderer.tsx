import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList, ReferenceLine,
  ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, FunnelChart, Funnel, RadialBarChart, RadialBar, Treemap
} from 'recharts';
import { CheckCircle2, AlertCircle, Info, Calendar, AlertTriangle } from 'lucide-react';
import { WidgetConfig } from '../types';
import { useDashboardStore } from '../store/dashboardStore';

interface Props {
  widget: WidgetConfig;
}

const PALETTES: Record<string, string[]> = {
  default: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'], 
  ocean: ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'], 
  sunset: ['#f97316', '#ef4444', '#ec4899', '#d946ef', '#8b5cf6'], 
  forest: ['#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'], 
  purple: ['#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#fb7185'], 
};

// Theme mapping for chart internals
const THEME_STYLES: Record<string, any> = {
  light: {
    grid: '#e2e8f0', // slate-200
    text: '#64748b', // slate-500
    tooltipBg: '#ffffff',
    tooltipColor: '#1e293b'
  },
  dark: {
    grid: '#374151', // slate-700
    text: '#9ca3af', // slate-400
    tooltipBg: '#1f2937', // slate-800
    tooltipColor: '#f3f4f6'
  },
  cupcake: {
    grid: '#efeae6', 
    text: '#291334',
    tooltipBg: '#ffffff',
    tooltipColor: '#291334'
  }
};

export const ChartRenderer: React.FC<Props> = ({ widget }) => {
  const globalTheme = useDashboardStore((state) => state.settings.theme);
  const { 
    type, 
    data, 
    theme = 'default',
    showLegend = true,
    showGrid = true,
    showDataLabels = false,
    showTooltip = true,
    chartConfig = {},
    dataMapping = { nameKey: 'name', valueKey: 'value', seriesName: 'Value' }
  } = widget;

  // Defaults if mapping is partial (though we set defaults above, safe destructuring)
  const nameKey = dataMapping?.nameKey || 'name';
  const valueKey = dataMapping?.valueKey || 'value';
  const seriesName = dataMapping?.seriesName || widget.title || '数值';

  const colors = PALETTES[theme] || PALETTES['default'];
  const primaryColor = chartConfig.color || colors[0];
  const secondaryColor = colors[1];
  
  // Resolve theme styles
  const themeStyle = THEME_STYLES[globalTheme] || THEME_STYLES['light'];

  // Helper for subtitle rendering
  const SubTitle = () => (
    chartConfig.subTitle ? (
      <div className="text-xs font-medium mb-2 px-1 opacity-70 truncate" style={{ color: themeStyle.text }}>
        {chartConfig.subTitle}
      </div>
    ) : null
  );

  // --- Logic Fix for Bar Chart Orientation ---
  const isHorizontalBar = chartConfig.layout === 'horizontal';
  const rechartsLayout = isHorizontalBar ? 'vertical' : 'horizontal';

  // Common Axis Config - Converted to function to avoid Recharts children parsing issues
  const renderCommonAxis = () => (
    <>
      <XAxis 
        type={isHorizontalBar ? 'number' : 'category'}
        dataKey={isHorizontalBar ? undefined : nameKey} 
        fontSize={12} 
        tickLine={false} 
        axisLine={false} 
        tick={{ fill: themeStyle.text }} 
        hide={isHorizontalBar}
      />
      <YAxis 
        type={isHorizontalBar ? 'category' : 'number'}
        dataKey={isHorizontalBar ? nameKey : undefined}
        fontSize={12} 
        tickLine={false} 
        axisLine={false} 
        tick={{ fill: themeStyle.text }} 
        width={isHorizontalBar ? 80 : 40}
      />
      {showTooltip && (
        <Tooltip 
          contentStyle={{ 
            backgroundColor: themeStyle.tooltipBg, 
            color: themeStyle.tooltipColor,
            borderRadius: '8px', 
            border: 'none', 
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
          }}
          cursor={{ fill: globalTheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }}
          formatter={(value: any) => [value, seriesName]}
          // Ensure label is a string/number, not object, to prevent React Error #31
          labelFormatter={(label) => {
             if (typeof label === 'object') return ''; 
             return label;
          }}
        />
      )}
      {showLegend && <Legend wrapperStyle={{ paddingTop: '10px' }} />}
      
      {/* Reference Line */}
      {chartConfig.referenceValue !== undefined && (
        <ReferenceLine 
          y={isHorizontalBar ? undefined : chartConfig.referenceValue} 
          x={isHorizontalBar ? chartConfig.referenceValue : undefined}
          stroke="red" 
          strokeDasharray="3 3"
          label={{ 
            value: chartConfig.referenceLabel || 'Target', 
            fill: 'red', 
            fontSize: 10, 
            position: 'insideTopRight' 
          }} 
        />
      )}
    </>
  );

  // --- Custom Word Cloud Renderer (Simple HTML Implementation) ---
  if (type === 'wordCloud') {
    // Normalize values for font sizing
    const maxVal = Math.max(...data.map(d => d[valueKey] || 0));
    const minVal = Math.min(...data.map(d => d[valueKey] || 0));
    
    return (
      <div className="h-full w-full flex flex-col">
        <SubTitle />
        <div className="flex-1 flex flex-wrap items-center justify-center content-center gap-4 overflow-hidden p-4">
          {data.map((item, i) => {
            const val = item[valueKey] || 0;
            const name = item[nameKey] || 'Unknown';
            // Scale size between 0.8rem and 2.5rem
            const scale = maxVal === minVal ? 1 : (val - minVal) / (maxVal - minVal);
            const fontSize = 0.8 + (scale * 1.7); 
            
            // Safety check for rendering name
            const displayName = (typeof name === 'object') ? JSON.stringify(name) : name;

            return (
              <span 
                key={i}
                className="transition-all hover:scale-110 cursor-default font-bold"
                style={{ 
                  fontSize: `${fontSize}rem`, 
                  color: colors[i % colors.length],
                  opacity: 0.8 + (scale * 0.2)
                }}
                title={`${displayName}: ${val}`}
              >
                {displayName}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Stat Card ---
  if (type === 'stat') {
    const val = data[0]?.[valueKey] || 0;
    const diff = data.length > 1 ? val - data[1][valueKey] : 0;
    const isPositive = diff >= 0;
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        {chartConfig.subTitle && <span className="text-sm opacity-60 mb-1" style={{ color: themeStyle.text }}>{chartConfig.subTitle}</span>}
        <span className="text-5xl font-bold" style={{ color: primaryColor }}>{val.toLocaleString()}</span>
        <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          <span>{isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(diff).toLocaleString()} 较上期</span>
        </div>
      </div>
    );
  }

  // --- Common Wrapper for HTML-based Charts to fix ResponsiveContainer 0x0 issue ---
  const HtmlChartWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="absolute inset-0">
      {children}
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <SubTitle />
      <div className="flex-1 min-h-0 relative">
        {/* Only wrap Recharts components with ResponsiveContainer */}
        {['heatmap', 'timeline'].includes(type) ? (
          (() => {
            switch (type) {
              case 'heatmap':
                // Use dataMapping if available, otherwise fallback to x, y, value
                const hXKey = widget.dataMapping?.nameKey || 'x';
                const hYKey = widget.dataMapping?.yKey || 'y';
                const hValueKey = widget.dataMapping?.valueKey || 'value';

                const xKeys = Array.from(new Set(data.map(d => d[hXKey]))).sort();
                const yKeys = Array.from(new Set(data.map(d => d[hYKey]))).sort();
                const maxVal = Math.max(...data.map(d => Number(d[hValueKey]) || 0), 1);
                
                if (data.length === 0) {
                  return <div className="h-full flex items-center justify-center opacity-40 italic text-xs">暂无热力图数据</div>;
                }

                return (
                  <HtmlChartWrapper>
                    <div className="h-full w-full overflow-auto p-4 custom-scrollbar" style={{ color: themeStyle.text }}>
                      <div className="min-w-max pb-4">
                        <div className="grid gap-1.5" style={{ 
                          gridTemplateColumns: `minmax(60px, auto) repeat(${xKeys.length}, 36px)`,
                          fontSize: '10px'
                        }}>
                          {/* Header Row */}
                          <div /> 
                          {xKeys.map(x => (
                            <div key={String(x)} className="text-center font-bold opacity-70 truncate px-1 pb-1" title={String(x)}>
                              {String(x)}
                            </div>
                          ))}
                          
                          {/* Data Rows */}
                          {yKeys.map(y => (
                            <React.Fragment key={String(y)}>
                              <div className="flex items-center pr-3 font-bold opacity-70 truncate h-9 text-right justify-end" title={String(y)}>
                                {String(y)}
                              </div>
                              {xKeys.map(x => {
                                const item = data.find(d => d[hXKey] === x && d[hYKey] === y);
                                const val = Number(item?.[hValueKey]) || 0;
                                const ratio = val / maxVal;
                                return (
                                  <div 
                                    key={`${x}-${y}`} 
                                    className="w-9 h-9 rounded-md transition-all hover:ring-2 hover:ring-primary hover:z-10 cursor-pointer flex items-center justify-center text-[9px] font-bold"
                                    style={{ 
                                      backgroundColor: primaryColor,
                                      opacity: 0.05 + (ratio * 0.95),
                                      color: ratio > 0.5 ? '#fff' : themeStyle.text,
                                      boxShadow: ratio > 0.1 ? 'inset 0 0 10px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                    title={`${y} / ${x}: ${val}`}
                                  >
                                    {showDataLabels && val > 0 ? val : ''}
                                  </div>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </HtmlChartWrapper>
                );

              case 'timeline':
                const isVertical = chartConfig.layout !== 'horizontal';
                
                if (data.length === 0) {
                  return <div className="h-full flex items-center justify-center opacity-40 italic text-xs">暂无里程碑数据</div>;
                }

                return (
                  <HtmlChartWrapper>
                    <div className={`h-full w-full overflow-auto p-6 custom-scrollbar ${isVertical ? 'flex flex-col' : 'flex items-start gap-12'}`}>
                      {data.map((item, i) => {
                        const statusColor = 
                          item.status === 'error' ? 'text-error' :
                          item.status === 'warning' ? 'text-warning' :
                          item.status === 'success' ? 'text-success' : 'text-info';
                        
                        const bgColor = 
                          item.status === 'error' ? 'bg-error' :
                          item.status === 'warning' ? 'bg-warning' :
                          item.status === 'success' ? 'bg-success' : 'bg-info';

                        const StatusIcon = 
                          item.status === 'error' ? AlertCircle :
                          item.status === 'warning' ? AlertTriangle :
                          item.status === 'success' ? CheckCircle2 : Info;

                        return (
                          <div key={i} className={`relative ${isVertical ? 'pb-10 last:pb-0' : 'flex-shrink-0 w-72'}`}>
                            {/* Line */}
                            {i < data.length - 1 && (
                              <div className={`absolute opacity-20 ${
                                isVertical 
                                  ? 'left-[11px] top-8 w-0.5 h-full' 
                                  : 'top-[11px] left-8 h-0.5 w-full'
                              }`} style={{ backgroundColor: themeStyle.grid }} />
                            )}
                            
                            {/* Icon/Dot */}
                            <div className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center z-10 shadow-sm ${bgColor} text-white`}>
                              <StatusIcon size={14} strokeWidth={3} />
                            </div>
                            
                            {/* Content */}
                            <div className={`${isVertical ? 'pl-10' : 'pt-10'}`}>
                              <div className="flex flex-col mb-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-sm truncate" style={{ color: themeStyle.tooltipColor }}>
                                    {item[nameKey] || item.title || '未命名事件'}
                                  </span>
                                  <div className="flex items-center gap-1 text-[10px] opacity-50 whitespace-nowrap">
                                    <Calendar size={10} />
                                    {item.date || '无日期'}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-base-200/50 dark:bg-slate-800/50 p-3 rounded-xl border border-base-300/50 dark:border-slate-700/50">
                                {item.description && (
                                  <p className="text-xs opacity-80 leading-relaxed mb-2 line-clamp-4" title={item.description}>
                                    {item.description}
                                  </p>
                                )}
                                
                                {(item.tags || item.status) && (
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {item.status && (
                                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusColor} bg-white/10`}>
                                        {item.status}
                                      </span>
                                    )}
                                    {item.tags && Array.isArray(item.tags) && item.tags.map((tag: string, ti: number) => (
                                      <span key={ti} className="px-1.5 py-0.5 rounded-md bg-base-300 dark:bg-slate-700 text-[9px] opacity-80 font-medium">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </HtmlChartWrapper>
                );
              default:
                return null;
            }
          })()
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {(() => {
              switch (type) {
              case 'line':
                return (
                  <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeStyle.grid} />}
                    {renderCommonAxis()}
                    <Line 
                      name={seriesName}
                      type={chartConfig.curveType || 'monotone'}
                      dataKey={valueKey} 
                      stroke={primaryColor} 
                      strokeWidth={chartConfig.strokeWidth || 3} 
                      dot={chartConfig.showDots !== false ? { r: 4, fill: primaryColor, strokeWidth: 2, stroke: themeStyle.tooltipBg } : false} 
                      activeDot={{ r: 6 }} 
                    >
                      {showDataLabels && <LabelList dataKey={valueKey} position="top" offset={10} fontSize={10} fill={primaryColor} />}
                    </Line>
                  </LineChart>
                );

              case 'bar':
                return (
                  <BarChart 
                    layout={rechartsLayout}
                    data={data} 
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={isHorizontalBar} horizontal={!isHorizontalBar} stroke={themeStyle.grid} />}
                    {renderCommonAxis()}
                    <Bar 
                      name={seriesName}
                      dataKey={valueKey} 
                      fill={primaryColor} 
                      radius={
                        chartConfig.radius 
                          ? [chartConfig.radius, chartConfig.radius, chartConfig.radius, chartConfig.radius] 
                          : (isHorizontalBar ? [0, 4, 4, 0] : [4, 4, 0, 0])
                      }
                      barSize={chartConfig.barSize}
                    >
                      {showDataLabels && <LabelList dataKey={valueKey} position={isHorizontalBar ? 'right' : 'top'} fill={themeStyle.text} fontSize={10} />}
                      {!chartConfig.color && data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                );

              case 'area':
                return (
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeStyle.grid} />}
                    {renderCommonAxis()}
                    <defs>
                      <linearGradient id={`color-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primaryColor} stopOpacity={chartConfig.fillOpacity || 0.3}/>
                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      name={seriesName}
                      type={chartConfig.curveType || 'monotone'}
                      dataKey={valueKey} 
                      stroke={primaryColor}
                      strokeWidth={chartConfig.strokeWidth || 2} 
                      fillOpacity={1} 
                      fill={`url(#color-${widget.id})`} 
                    >
                      {showDataLabels && <LabelList dataKey={valueKey} position="top" fill={primaryColor} fontSize={10} />}
                    </Area>
                  </AreaChart>
                );

              case 'pie':
                return (
                  <PieChart>
                    <Pie
                      nameKey={nameKey}
                      data={data}
                      innerRadius={chartConfig.innerRadius ?? 60}
                      outerRadius={80}
                      paddingAngle={chartConfig.padAngle || 5}
                      dataKey={valueKey}
                      stroke={themeStyle.tooltipBg}
                      strokeWidth={2}
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    {showTooltip && <Tooltip 
                      contentStyle={{ 
                        backgroundColor: themeStyle.tooltipBg, 
                        color: themeStyle.tooltipColor,
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                      }}
                      formatter={(value: any, name: any, props: any) => [value, props.payload[nameKey] || seriesName]}
                    />
                    }
                    {showLegend && <Legend />}
                  </PieChart>
                );

              case 'composed':
                return (
                  <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeStyle.grid} />}
                    {renderCommonAxis()}
                    <Bar name={seriesName} dataKey={valueKey} fill={primaryColor} barSize={20} radius={[4, 4, 0, 0]} />
                    <Line name="Trend" type="monotone" dataKey={data[0]?.trend ? "trend" : valueKey} stroke={secondaryColor} strokeWidth={2} dot={{r:4}} />
                    {showLegend && <Legend />}
                  </ComposedChart>
                );

              case 'radar':
                return (
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid gridType={chartConfig.radarType || 'polygon'} stroke={themeStyle.grid} />
                    <PolarAngleAxis dataKey={nameKey} tick={{ fill: themeStyle.text, fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Radar name={seriesName} dataKey={valueKey} stroke={primaryColor} fill={primaryColor} fillOpacity={0.4} />
                    {showTooltip && <Tooltip contentStyle={{ backgroundColor: themeStyle.tooltipBg, color: themeStyle.tooltipColor, borderRadius: '8px', border: 'none' }} />}
                  </RadarChart>
                );
              
              case 'scatter':
                return (
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeStyle.grid} />}
                    <XAxis type="number" dataKey="x" name="X" unit="" tick={{ fill: themeStyle.text }} tickLine={false} axisLine={false} />
                    <YAxis type="number" dataKey="y" name="Y" unit="" tick={{ fill: themeStyle.text }} tickLine={false} axisLine={false} />
                    {showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: themeStyle.tooltipBg, color: themeStyle.tooltipColor, borderRadius: '8px', border: 'none' }} />}
                    <Scatter name={seriesName} data={data} fill={primaryColor} />
                  </ScatterChart>
                );

              case 'funnel':
                return (
                  <FunnelChart>
                    {showTooltip && <Tooltip contentStyle={{ backgroundColor: themeStyle.tooltipBg, color: themeStyle.tooltipColor, borderRadius: '8px', border: 'none' }} />}
                    <Funnel
                      dataKey={valueKey}
                      data={data}
                      isAnimationActive
                      nameKey={nameKey}
                    >
                      {showDataLabels && <LabelList position="right" fill={themeStyle.text} stroke="none" dataKey={nameKey} />}
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Funnel>
                  </FunnelChart>
                );

              case 'radialBar':
                // Calculate average or sum for center label if needed
                const totalValue = data.reduce((acc, curr) => acc + (Number(curr[valueKey]) || 0), 0);
                const avgValue = data.length > 0 ? (totalValue / data.length).toFixed(1) : 0;
                const displayValue = chartConfig.centerValueType === 'sum' ? totalValue : avgValue;

                return (
                  <div className="relative w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={chartConfig.innerRadius ? `${chartConfig.innerRadius}%` : "30%"} 
                        outerRadius={chartConfig.outerRadius ? `${chartConfig.outerRadius}%` : "100%"} 
                        barSize={chartConfig.barSize || 20} 
                        data={data}
                        startAngle={chartConfig.startAngle ?? 180}
                        endAngle={chartConfig.endAngle ?? 0}
                      >
                        <RadialBar
                          label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
                          background={{ fill: themeStyle.grid, opacity: chartConfig.backgroundOpacity ?? 0.3 }}
                          dataKey={valueKey}
                          cornerRadius={chartConfig.cornerRadius ?? 0}
                        >
                          {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </RadialBar>
                        {showLegend && <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />}
                        {showTooltip && <Tooltip contentStyle={{ backgroundColor: themeStyle.tooltipBg, color: themeStyle.tooltipColor, borderRadius: '8px', border: 'none' }} />}
                      </RadialBarChart>
                    </ResponsiveContainer>
                    
                    {chartConfig.showCenterLabel !== false && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                          {displayValue}{chartConfig.valueUnit || '%'}
                        </span>
                        <span className="text-[10px] opacity-50" style={{ color: themeStyle.text }}>
                          {chartConfig.centerLabel || '平均达成率'}
                        </span>
                      </div>
                    )}
                  </div>
                );

              case 'treemap':
                return (
                  <Treemap
                    data={data}
                    dataKey={valueKey}
                    aspectRatio={chartConfig.aspectRatio ?? 4 / 3}
                    stroke="#fff"
                    fill={primaryColor}
                  >
                    {showTooltip && <Tooltip contentStyle={{ backgroundColor: themeStyle.tooltipBg, color: themeStyle.tooltipColor, borderRadius: '8px', border: 'none' }} />}
                  </Treemap>
                );

              case 'table':
                return (
                  <div className="flex h-full items-center justify-center text-slate-400 text-sm italic">
                    此组件为表格视图，请在卡片设置中查看。
                  </div>
                );

              default:
                return <div>Unsupported Chart Type</div>;
            }
          })()}
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};