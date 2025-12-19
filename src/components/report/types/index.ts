
export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'stat' | 'composed' | 'radar' | 'scatter' | 'funnel' | 'wordCloud' | 'table' | 'radialBar' | 'treemap' | 'heatmap' | 'timeline';

export interface DataPoint {
  [key: string]: any; // Relaxed type to allow dynamic keys
}

export type DataSourceMode = 'static' | 'sql' | 'api';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface DataSourceConfig {
  mode: DataSourceMode;
  staticData?: DataPoint[]; // Store local data here so it's not lost when switching modes
  // SQL Configuration
  sql?: {
    query: string;
    connectionId?: string; // Future proofing
  };
  // API Configuration
  api?: {
    url: string;
    method: 'GET' | 'POST' | 'PUT';
    headers?: KeyValuePair[]; // Structured headers
    queryParams?: KeyValuePair[]; // Structured query params
    body?: string; // JSON string for body
    responsePath?: string; // e.g., "data.results" to find the array
  };
}

export interface DataMapping {
  nameKey: string;   // Key for X-Axis / Category (default: 'name')
  valueKey: string;  // Key for Y-Axis / Metric (default: 'value')
  yKey?: string;     // Key for secondary dimension (e.g., Heatmap Y-Axis)
  seriesName?: string; // Display name for the series (e.g., 'Sales')
}

export interface ChartSpecificConfig {
  // Common
  subTitle?: string;
  color?: string; // Custom single color override
  
  // Reference Line (Threshold)
  referenceValue?: number;
  referenceLabel?: string;
  
  // Line/Area/Composed
  curveType?: 'monotone' | 'linear' | 'step'; // Smooth vs Sharp
  strokeWidth?: number; // 1-5
  showDots?: boolean;
  fillOpacity?: number; // 0.1 - 1
  
  // Bar
  layout?: 'horizontal' | 'vertical';
  barSize?: number;
  radius?: number; // Bar corner radius
  
  // Pie
  innerRadius?: number; // 0 for Pie, >0 for Donut
  padAngle?: number;
  
  // Stat
  trendColor?: boolean; // Show green/red for trends

  // Radar
  radarType?: 'polygon' | 'circle'; // Grid shape

  // Funnel
  funnelAlign?: 'center' | 'left' | 'right';

  // Radial Bar / Gauge
  startAngle?: number;
  endAngle?: number;
  outerRadius?: number;
  showCenterLabel?: boolean;
  centerLabel?: string;
  valueUnit?: string;
  centerValueType?: string;
  cornerRadius?: number;
  backgroundOpacity?: number;

  // Treemap
  aspectRatio?: number;

  // Heatmap
  colorRange?: string[];

  // Timeline
  // uses common layout field
}

export interface WidgetConfig {
  id: string;
  type: ChartType;
  title: string;
  data: DataPoint[];
  
  // Data Source Configuration
  dataSource?: DataSourceConfig;
  
  // Data Mapping (New)
  dataMapping?: DataMapping;

  // Layout
  colSpan: number; // 1 to 12
  height: number; // in pixels
  
  description?: string; // For AI context
  
  // Visual Customization
  theme?: 'default' | 'ocean' | 'sunset' | 'forest' | 'purple';
  showLegend?: boolean;
  showGrid?: boolean;
  showDataLabels?: boolean;
  showTooltip?: boolean;
  
  // Advanced
  chartConfig?: ChartSpecificConfig;
}

// --- NEW: Parameter / Filter Types ---

export type ParameterType = 'text' | 'select' | 'date' | 'date-range';

export interface DashboardParameter {
  id: string;
  key: string;         // The variable name used in binding, e.g., {{city}}
  label: string;       // Display label
  type: ParameterType;
  defaultValue?: any;
  width?: number;      // Optional styling width
  
  // For 'select' type: Where do the options come from?
  optionsDataSource?: DataSourceConfig; 
  // Cache for loaded options (value/label pairs)
  loadedOptions?: { label: string; value: any }[];
}

export type AIProvider = 'gemini' | 'openai' | 'tongyi' | 'deepseek' | 'anthropic' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface GlobalSettings {
  theme: string;
  ai: AIConfig;
}

export interface Dashboard {
  id: string;
  title: string;
  widgets: WidgetConfig[];
  parameters: DashboardParameter[]; // NEW: List of global filters
  createdAt: number;
}

export interface AIResponse {
  widgets: Omit<WidgetConfig, 'id'>[];
  parameters?: Omit<DashboardParameter, 'id'>[]; // AI can now generate params
  summary?: string;
}
